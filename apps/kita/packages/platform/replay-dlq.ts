/**
 * @kita/platform — replay-dlq (T-PLAT-05).
 *
 * STATUS: NOT IMPLEMENTED AND DELIBERATELY INERT. Manual DLQ replay requires
 * T-CORE-02 (and T-PLAT-03 durable workers). Every call fails closed with 503
 * `dependency_unavailable`. No queue writes, no original-key mutation, no journals.
 */

import type { Plat05Input, Plat05Output, Problem, Result, WorkerContext } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const REPLAY_DLQ_UNAVAILABLE_DETAIL =
  'T-PLAT-05 replayDlq is not implemented: T-CORE-02 durable outbox/DLQ substrate is absent, so replay cannot preserve original keys (fail closed)';

export async function replayDlq(
  ctx: WorkerContext,
  _input: Plat05Input,
): Promise<Result<Plat05Output, Problem>> {
  ctx.trace('replay_dlq_dependency_unavailable', {
    workId: String(ctx.workId),
    attemptGeneration: ctx.attemptGeneration,
  });
  return err(problem('dependency_unavailable', 503, true, REPLAY_DLQ_UNAVAILABLE_DETAIL));
}
