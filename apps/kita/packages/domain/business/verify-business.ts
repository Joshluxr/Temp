/**
 * @kita/domain — verify-business (T-EXT-03).
 *
 * Pure fail-closed checker. Individual KYC alone cannot authorize business
 * payout. Live KYB (T-KYC-04 / T-ADM-05) is not implemented. Never ok:true.
 */

import type { Ext03Input, Ext03Output } from '../../contracts/src/business.ts';
import type { Problem, Result, WorkerContext } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const VERIFY_BUSINESS_INDIVIDUAL_KYC_DETAIL =
  'T-EXT-03 individual KYC alone cannot authorize business payout';

export const VERIFY_BUSINESS_UNAVAILABLE_DETAIL =
  'T-EXT-03 verifyBusiness cannot attest KYB/signatory authority: T-KYC-04/T-ADM-05 live KYB is not implemented (fail closed)';

export async function verifyBusiness(
  ctx: WorkerContext,
  input: Ext03Input,
): Promise<Result<Ext03Output, Problem>> {
  ctx.trace('verify_business_fail_closed', {
    workId: String(ctx.workId),
    attemptGeneration: ctx.attemptGeneration,
    individualKycOnly: input.individualKycOnly,
  });
  if (input.individualKycOnly) {
    return err(problem('APPROVAL_REQUIRED', 409, false, VERIFY_BUSINESS_INDIVIDUAL_KYC_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, VERIFY_BUSINESS_UNAVAILABLE_DETAIL));
}
