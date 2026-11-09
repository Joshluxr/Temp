/**
 * @kita/platform — schedule-timer (T-PLAT-05).
 *
 * STATUS: NOT IMPLEMENTED AND DELIBERATELY INERT. DB timers / outbox require
 * T-CORE-02. Every call fails closed with 503 `dependency_unavailable`.
 * No timer table writes, no queue publish, no journals.
 */

import type { Plat05Input, Plat05Output, Problem, Result, WorkerContext } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const SCHEDULE_TIMER_UNAVAILABLE_DETAIL =
  'T-PLAT-05 scheduleTimer is not implemented: T-CORE-02 durable timer/outbox substrate is absent, so deadlines cannot be persisted (fail closed)';

export async function scheduleTimer(
  ctx: WorkerContext,
  _input: Plat05Input,
): Promise<Result<Plat05Output, Problem>> {
  ctx.trace('schedule_timer_dependency_unavailable', {
    workId: String(ctx.workId),
    attemptGeneration: ctx.attemptGeneration,
  });
  return err(problem('dependency_unavailable', 503, true, SCHEDULE_TIMER_UNAVAILABLE_DETAIL));
}
