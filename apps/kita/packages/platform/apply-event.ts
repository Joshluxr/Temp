/**
 * @kita/platform — apply-event (T-PLAT-03).
 *
 * Backlog signature: `applyEvent(ctx: WorkerContext, input: Plat03Input):
 * Promise<Result<Plat03Output>>`.
 *
 * STATUS: NOT IMPLEMENTED AND DELIBERATELY INERT. T-PLAT-03 lists T-CORE-02 as
 * a hard dependency (13-backlog.md "Deps"), and T-CORE-02 — the durable
 * command/ledger substrate that owns outbox/inbox/consumer_inbox writes — does
 * not exist yet. Until it does, this entry point has NO database access, NO
 * queue access and NO journal reachability of any kind; every call fails
 * closed with 503 `dependency_unavailable` and mutates nothing. It is never
 * permitted to guess an outcome or manufacture a success receipt (§F2 fail
 * closed; SOL-REVIEW batch constraint: no money effects before their gates).
 *
 * When T-CORE-02 lands, the real implementation must satisfy TEST-PLAT-03's
 * boundary matrix (07-algorithms.md §G7) rather than this stub:
 * - claim with FOR UPDATE SKIP LOCKED + 30s lease; mark published only after
 *   send acknowledgment; crash-after-send republishes the SAME stable eventId;
 * - dedup on BOTH business ID (consumer,event_id) and delivery ID
 *   (provider_account_id,delivery_id); same ID + changed hash quarantines;
 * - consumer_inbox insert and domain changes commit in ONE transaction BEFORE
 *   queue ack, so a crash at any commit/send/ack boundary preserves exactly
 *   one economic effect;
 * - DLQ replay preserves IDs and cannot change an attempt payload;
 * - IDEMPOTENCY_MISMATCH on same identity / changed body;
 * - posting journals remains T-LEDGER-02 territory reached through T-CORE-02
 *   procedures — this worker itself executes no financial write.
 */

import type { Plat03Input, Plat03Output, Problem, Result, WorkerContext } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

/** The single refusal reason, exported so tests and runbooks cite one string. */
export const APPLY_EVENT_UNAVAILABLE_DETAIL =
  'T-PLAT-03 applyEvent is not implemented: T-CORE-02 durable command/ledger substrate is absent, so outbox/inbox/consumer_inbox are unreachable (fail closed)';

export async function applyEvent(ctx: WorkerContext, _input: Plat03Input): Promise<Result<Plat03Output, Problem>> {
  ctx.trace('apply_event_dependency_unavailable', {
    workId: String(ctx.workId),
    attemptGeneration: ctx.attemptGeneration,
  });
  return err(problem('dependency_unavailable', 503, true, APPLY_EVENT_UNAVAILABLE_DETAIL));
}
