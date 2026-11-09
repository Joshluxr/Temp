/**
 * @kita/domain — evaluate-risk (T-KYC-06).
 *
 * Pure fail-closed checker. Concurrent transfers cannot exceed the aggregate
 * limit. SERIALIZABLE buckets are not implemented. Never ok:true. Never reserve.
 */

import type { Kyc06Input, Kyc06Output } from '../../contracts/src/compliance.ts';
import type { Problem, Result, WorkerContext } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const EVALUATE_RISK_LIMIT_DETAIL =
  'T-KYC-06 concurrent transfers cannot exceed aggregate limit';

export const EVALUATE_RISK_UNAVAILABLE_DETAIL =
  'T-KYC-06 evaluateRisk cannot reserve limits: SERIALIZABLE limit buckets are not implemented (fail closed)';

export async function evaluateRisk(
  ctx: WorkerContext,
  input: Kyc06Input,
): Promise<Result<Kyc06Output, Problem>> {
  ctx.trace('evaluate_risk_fail_closed', {
    workId: String(ctx.workId),
    attemptGeneration: ctx.attemptGeneration,
    wouldExceedAggregateLimit: input.wouldExceedAggregateLimit,
  });
  if (input.wouldExceedAggregateLimit) {
    return err(problem('LIMIT_EXCEEDED', 409, false, EVALUATE_RISK_LIMIT_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, EVALUATE_RISK_UNAVAILABLE_DETAIL));
}
