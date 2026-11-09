/**
 * @kita/api-client — idempotent command recovery helpers (T-PLAT-01 lane).
 *
 * READ-ORIENTED ONLY. Per 06-api-contracts.md §F1/§F2 and backlog M2: when a
 * quote/transfer command response is lost, the client either replays the SAME
 * idempotency key + identical canonical payload through the server's own
 * durable-command layer, or queries `/v1/commands/{key}`. These helpers never
 * invoke a financial reducer, never fabricate an outcome, and never return
 * mock data when the server is unreachable (§F6) — ambiguity surfaces as
 * `unknown`, which is a durable state requiring inquiry, not a retry with a
 * fresh key. addSandboxFunds / simulatePartnerCompletion are banned; nothing
 * here can manufacture money movement.
 */

import type { ClientResult, CommandState } from '@kita/contracts';
import { err, ok, problem } from '@kita/contracts';

const KEY_MIN = 16;
const KEY_MAX = 128;
const SAFE_KEY_RE = /^[A-Za-z0-9_-]+$/;

/** Validate an Idempotency-Key per §F1: 16–128 safe opaque chars, no PII shape heuristics possible client-side beyond charset. */
export function isValidIdempotencyKey(key: string): boolean {
  return key.length >= KEY_MIN && key.length <= KEY_MAX && SAFE_KEY_RE.test(key);
}

/** Canonical request hash used for same-key body-equality checks (server is authoritative). */
export function canonicalRequestHash(payload: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(stableStringify(payload));
  return crypto.subtle.digest('SHA-256', bytes).then((d) => Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, '0')).join(''));
}

/** Deterministic JSON stringify (sorted keys) so equal payloads hash equal across runtimes. */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const parts = Object.keys(obj)
    .sort()
    .filter((k) => obj[k] !== undefined)
    .map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`);
  return `{${parts.join(',')}}`;
}

/** The only transport surface this module may use: authenticated GETs. No POST from recovery. */
export interface ReadTransport {
  /** GET /v1/commands/{key}?operation=… — scoped to actor; returns recorded result or current state. */
  lookupCommand(key: string, operation: string): Promise<CommandState | 404>;
}

export type RecoveryDecision =
  /** Original response was recorded — return it; do NOT re-send. */
  | { readonly action: 'return-recorded' }
  /** Command still durably running — keep waiting; same key only. */
  | { readonly action: 'still-pending' }
  /** Server recorded a rejection — surface it; recording means decided. */
  | { readonly action: 'surface-recorded-rejection' }
  /** Outcome genuinely unknown — inquiry path, never a fresh-key retry of money. */
  | { readonly action: 'inquire-required' }
  /** Lookup itself failed/unreachable — no claim either way (§F6: no mock success). */
  | { readonly action: 'transport-unavailable' };

/** Map a durable command record to a recovery decision without touching money paths. */
export function decideRecovery(state: CommandState): RecoveryDecision {
  switch (state.status) {
    case 'succeeded':
      return { action: 'return-recorded' };
    case 'pending':
      return { action: 'still-pending' };
    case 'failed':
      return { action: 'surface-recorded-rejection' };
    case 'unknown':
      return { action: 'inquire-required' };
    default:
      return { action: 'inquire-required' };
  }
}

/**
 * Recover the outcome of a previously-submitted idempotent command by READ
 * lookup only. Returns the recorded response when one exists; otherwise a
 * decision describing the required next step. Never submits work.
 */
export async function recoverCommand<TResponse>(
  transport: ReadTransport,
  input: { readonly key: string; readonly operation: string },
): Promise<ClientResult<{ readonly decision: RecoveryDecision; readonly state?: CommandState }>> {
  if (!isValidIdempotencyKey(input.key)) {
    return err(problem('invalid_request', 400, false, 'idempotency key fails §F1 charset/length rule'));
  }
  const found = await transport.lookupCommand(input.key, input.operation);
  if (found === 404) {
    // Absent record is NOT proof of non-submission; require inquiry, never auto-resubmit.
    return ok({ decision: { action: 'inquire-required' } });
  }
  return ok({ decision: decideRecovery(found), state: found });
}
