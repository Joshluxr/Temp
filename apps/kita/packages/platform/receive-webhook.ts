/**
 * @kita/platform — receive-webhook (T-PLAT-04).
 *
 * Backlog signature: `receiveWebhook(ctx: WorkerContext, input: Plat04Input):
 * Promise<Result<Plat04Output>>`.
 *
 * STATUS: NOT IMPLEMENTED AND DELIBERATELY INERT. Authenticating a provider
 * webhook and writing `inbox` requires the durable substrate owned by
 * T-CORE-02 (and later signature material from T-DEPEND-01). Until those
 * exist, this entry point has NO inbox writes, NO journals, NO signature
 * verification side effects; every call fails closed with 503
 * `dependency_unavailable` and mutates nothing. Invalid signatures MUST NOT
 * be treated as accepted, and same-ID changed bodies MUST NOT be posted —
 * this stub never posts at all.
 */

import type { Plat04Input, Plat04Output, Problem, Result, WorkerContext } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const RECEIVE_WEBHOOK_UNAVAILABLE_DETAIL =
  'T-PLAT-04 receiveWebhook is not implemented: T-CORE-02 durable inbox substrate is absent, so provider webhook rows cannot be written (fail closed)';

export async function receiveWebhook(
  ctx: WorkerContext,
  _input: Plat04Input,
): Promise<Result<Plat04Output, Problem>> {
  ctx.trace('receive_webhook_dependency_unavailable', {
    workId: String(ctx.workId),
    attemptGeneration: ctx.attemptGeneration,
  });
  return err(problem('dependency_unavailable', 503, true, RECEIVE_WEBHOOK_UNAVAILABLE_DETAIL));
}
