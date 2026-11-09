/**
 * @kita/platform — observe-financial-health (T-PLAT-06).
 *
 * STATUS: NOT IMPLEMENTED AND DELIBERATELY INERT. Correlated dashboards,
 * SLO alerts, and audit pointers require T-CORE-02 plus a real exporter.
 * Every call fails closed with 503 `dependency_unavailable`. No audit_events
 * writes, no on-call dispatch, no journals, no PII in traces.
 */

import type { Plat06Input, Plat06Output, Problem, Result, WorkerContext } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const OBSERVE_FINANCIAL_HEALTH_UNAVAILABLE_DETAIL =
  'T-PLAT-06 observeFinancialHealth is not implemented: T-CORE-02 and telemetry exporters are absent, so health alerts cannot be delivered (fail closed)';

export async function observeFinancialHealth(
  ctx: WorkerContext,
  _input: Plat06Input,
): Promise<Result<Plat06Output, Problem>> {
  ctx.trace('observe_financial_health_dependency_unavailable', {
    workId: String(ctx.workId),
    attemptGeneration: ctx.attemptGeneration,
  });
  return err(problem('dependency_unavailable', 503, true, OBSERVE_FINANCIAL_HEALTH_UNAVAILABLE_DETAIL));
}
