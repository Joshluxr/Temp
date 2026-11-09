/**
 * @kita/api bootstrap (T-CORE-01) — minimal, fail-closed composition stub.
 *
 * Contract of this module:
 *  - Importing it has NO side effects: no pool, no listener, no process globals.
 *  - `bootstrap()` validates runtime bindings BEFORE any pool construction or
 *    listener start (coder-46's `validateRuntimeBindingsOrProblem` owns the
 *    rules; we only sequence them). On invalid bindings it returns a failure
 *    result and performs nothing else — no server, no readiness, no database
 *    connection, no fabricated bindings.
 *  - Every external effect (pool driver, listener, logger, signal source) is an
 *    injected seam so tests drive `bootstrap()` directly without touching the
 *    network. There is deliberately NO HTTP framework, NO routes, NO
 *    readiness/liveness publication, NO ledger/posting API here (T-CORE-01
 *    scope boundary; see apps/kita/docs/FORBIDDEN.md).
 */

// PACKAGING GAP (recorded, not restructured): cross-package subpath exports for
// "@kita/platform/runtime" and "@kita/database/pool" are not yet wired by
// coders 44/46. Relative imports into their source files are used per the batch
// instruction. If they later expose package specifiers, switch these lines only.
import { validateRuntimeBindingsOrProblem, toDatabaseBindings } from '../../../packages/platform/runtime.ts';
import { createPool, sanitizeDatabaseUrl } from '../../../packages/database/src/pool.ts';
import type { PoolDriver } from '../../../packages/database/src/pool.ts';

export interface BootstrapLogger {
  info(message: string): void;
  error(message: string): void;
}

export interface BootstrapResult {
  readonly ok: boolean;
  /** Sanitized DATABASE_URL (credentials masked); absent when validation failed. */
  readonly databaseUrl?: string;
  readonly port?: number;
  /** Sanitized diagnostics naming each missing/invalid binding; never a secret value. */
  readonly reasons?: readonly string[];
}

export interface BootstrapOptions {
  readonly env: Readonly<Record<string, string | undefined>>;
  /** Pool driver seam passed through to createPool; omitted => pg default (never used in tests). */
  readonly driver?: PoolDriver;
  /** Diagnostic sink; defaults to console. Never receives raw credentials. */
  readonly logger?: BootstrapLogger;
  /** Listener seam; called with the validated port. Omitted => no listen performed. */
  readonly listen?: (port: number) => Promise<void> | void;
  /** Shutdown signal source; default registers SIGTERM/SIGINT once-handlers. */
  readonly signal?: (onShutdown: () => Promise<void>) => void;
}

const DEFAULT_LOGGER: BootstrapLogger = {
  info: (m) => console.log(m),
  error: (m) => console.error(m),
};

function defaultSignal(onShutdown: () => Promise<void>): void {
  const handler = (): void => {
    void onShutdown();
  };
  process.once('SIGTERM', handler);
  process.once('SIGINT', handler);
}

export async function bootstrap(options: BootstrapOptions): Promise<BootstrapResult> {
  const logger = options.logger ?? DEFAULT_LOGGER;

  // Step 1 — validate ALL required bindings BEFORE anything else. Diagnostics
  // name the binding and its failure shape, never the value. Fail closed: no
  // pool, no listener, no readiness, no fabricated bindings on this path.
  const validated = validateRuntimeBindingsOrProblem(options.env);
  if (!validated.ok) {
    const reasons = validated.error.map((p) => p.detail);
    for (const reason of reasons) {
      logger.error(`startup aborted (fail closed): ${reason}`);
    }
    return { ok: false, reasons };
  }

  const { databaseUrl, port } = validated.value;
  const bindings = toDatabaseBindings(validated.value);

  // Step 2 — pool construction happens only after validation succeeded.
  const pool = createPool(bindings, options.driver !== undefined ? { driver: options.driver } : {});

  logger.info(`bindings valid; starting api stub on port ${port} (db: ${sanitizeDatabaseUrl(databaseUrl)})`);

  // Step 3 — listener seam only; no HTTP framework in this stub.
  if (options.listen) {
    await options.listen(port);
  }

  // Step 4 — shutdown closes exactly this pool; no other lifecycle wiring.
  const signal = options.signal ?? defaultSignal;
  signal(async () => {
    await pool.close();
  });

  return { ok: true, databaseUrl: sanitizeDatabaseUrl(databaseUrl), port };
}
