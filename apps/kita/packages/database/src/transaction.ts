import type { PoolClientLike, PoolLike } from "./pool.js";

/**
 * T-CORE-01 serializable transaction helper.
 *
 * Retries ONLY on the driver's structured SQLSTATE codes: 40001 (serialization
 * failure) and 40P01 (deadlock). Retryability is never inferred from message text;
 * every other error propagates immediately. One client checkout per attempt serves
 * BEGIN, all callback SQL, COMMIT, and any ROLLBACK.
 */

const RETRYABLE_SQLSTATES: ReadonlySet<string> = new Set(["40001", "40P01"]);
const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY_MS = 50;
const MAX_RETRY_DELAY_MS_CAP = 30_000; // bounded backoff even with a bad override

export interface WithSerializableOptions {
  readonly maxAttempts?: number;
  readonly retryDelayMs?: number;
  readonly sleep?: (ms: number) => Promise<void>;
}

interface ValidatedOptions {
  readonly maxAttempts: number;
  readonly retryDelayMs: number;
  readonly sleep: (ms: number) => Promise<void>;
}

// Positive finite integer only: rejects NaN/Infinity/0/fractional/negative.
function assertPositiveInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new TypeError(`${name} must be a positive finite integer, got ${String(value)}`);
  }
}

function validateOptions(options: WithSerializableOptions | undefined): ValidatedOptions {
  const maxAttempts = options?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const retryDelayMs = options?.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;
  assertPositiveInteger(maxAttempts, "maxAttempts");
  assertPositiveInteger(retryDelayMs, "retryDelayMs");
  if (retryDelayMs > MAX_RETRY_DELAY_MS_CAP) {
    throw new RangeError(`retryDelayMs must be <= ${MAX_RETRY_DELAY_MS_CAP}`);
  }
  const sleep = options?.sleep ?? defaultSleep;
  if (typeof sleep !== "function") {
    throw new TypeError("sleep must be a function");
  }
  return { maxAttempts, retryDelayMs, sleep };
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sqlStateOf(err: unknown): string | undefined {
  const code = (err as { code?: unknown }).code;
  return typeof code === "string" ? code : undefined;
}

function isRetryable(err: unknown): boolean {
  return RETRYABLE_SQLSTATES.has(sqlStateOf(err) ?? "");
}

/**
 * Runs `work` inside a SERIALIZABLE transaction, returning its result only after a
 * successful COMMIT. Retries the FULL callback on a fresh checkout for 40001/40P01
 * (including commit-time failures), up to `maxAttempts` total attempts (default 3);
 * on exhaustion the final transaction error is thrown with code/cause intact.
 *
 * WARNING: the callback may execute MULTIPLE times. It must contain transaction SQL
 * only — no HTTP/RPC calls, external-service requests, emails, queue publishing, or
 * other irreversible side effects. The transaction's own database connection is the
 * necessary transport; no other network work is permitted inside it.
 */
export async function withSerializable<T>(
  pool: PoolLike,
  work: (client: PoolClientLike) => Promise<T>,
  options?: WithSerializableOptions,
): Promise<T> {
  const { maxAttempts, retryDelayMs, sleep } = validateOptions(options);
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const client = await pool.connect();
    let transactionOpen = true;
    try {
      await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
      const result = await work(client);
      await client.query("COMMIT");
      transactionOpen = false;
      client.release();
      return result;
    } catch (err) {
      // Cleanup must never replace the primary transaction error.
      lastError = err;
      if (transactionOpen) {
        try {
          await client.query("ROLLBACK");
          transactionOpen = false;
        } catch {
          // Rollback failed: the server-side transaction state is unknown, so the
          // client is unusable — pg semantics: release(err) discards it. Rethrowing
          // the rollback failure would mask the primary error below.
        }
      }
      try {
        client.release(transactionOpen ? err : undefined);
      } catch {
        // Release itself failing is also cleanup; the primary error still wins.
      }
      // Release precedes backoff: no sleep may hold an open checkout.
      if (!isRetryable(err) || attempt === maxAttempts) throw err;
      await sleep(retryDelayMs);
    }
  }
  // Unreachable: the loop returns or throws on every path.
  throw lastError;
}
