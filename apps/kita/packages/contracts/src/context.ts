/**
 * @kita/contracts — context types per docs/kita-plan/13-backlog.md §M2.
 *
 * "CommandContext carries validated actor/person, book, assurance, command
 * key/hash, correlation and a transaction runner; ReadContext carries scoped
 * identity/as-of; WorkerContext carries durable work identity, attempt
 * generation and trace. None accepts a client-selected role or arbitrary ledger
 * account."
 */

import type { Problem, Result } from './result.ts';

/** Opaque UUID-shaped identifier on the wire (decimal string; vendor refs stay exact strings). */
export type UUID = string & { readonly __brand: 'UUID' };
export type Instant = string & { readonly __brand: 'RFC3339UTC' };

/**
 * Durable worker identity for internal platform tools (T-PLAT-*). Carries NO
 * actor role, NO ledger account and NO transaction runner — a worker reducer
 * is internal and never invoked by a customer HTTP mutation.
 */
export interface WorkerContext {
  readonly workId: UUID;
  readonly attemptGeneration: number;
  readonly correlationId: UUID;
  readonly causationId?: UUID;
  readonly startedAt: Instant;
  /** Redacted trace sink; implementations must never receive secrets (§H2). */
  readonly trace: (message: string, fields?: Readonly<Record<string, string | number | boolean>>) => void;
  /** Fail-closed capability probe; workers may not assume an external rail exists. */
  readonly capability: (name: string) => Promise<Result<boolean, Problem>>;
}
