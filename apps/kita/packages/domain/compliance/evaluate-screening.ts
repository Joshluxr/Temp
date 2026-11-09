/**
 * @kita/domain — evaluate-screening (T-KYC-04).
 *
 * Pure fail-closed checker. Unavailable or stale lists cannot silently pass.
 * Fresh lists still 503: live screening adapter / T-KYC-02 is not implemented.
 * Never ok:true. Never a payout-enabling clear.
 */

import type { Kyc04Input, Kyc04Output } from '../../contracts/src/compliance.ts';
import type { Problem, Result, WorkerContext } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const EVALUATE_SCREENING_HOLD_DETAIL =
  'T-KYC-04 unavailable or stale screening list cannot silently pass';

export const EVALUATE_SCREENING_UNAVAILABLE_DETAIL =
  'T-KYC-04 evaluateScreening cannot clear a subject: live screening adapter/T-KYC-02 is not implemented (fail closed)';

export async function evaluateScreening(
  ctx: WorkerContext,
  input: Kyc04Input,
): Promise<Result<Kyc04Output, Problem>> {
  ctx.trace('evaluate_screening_fail_closed', {
    workId: String(ctx.workId),
    attemptGeneration: ctx.attemptGeneration,
    listUnavailable: input.listUnavailable,
    listStale: input.listStale,
  });
  if (input.listUnavailable || input.listStale) {
    return err(problem('COMPLIANCE_HOLD', 409, false, EVALUATE_SCREENING_HOLD_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, EVALUATE_SCREENING_UNAVAILABLE_DETAIL));
}
