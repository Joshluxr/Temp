/**
 * @kita/domain — validate-funding-capability (T-FUND-04).
 *
 * Pure fail-closed checker. Unapproved method fails closed.
 * Never ok:true. Never collect funds. T-FUND-03 remains HOLD.
 */

import type { Fund01CommandContext, Fund04Input, Fund04Output } from '../../contracts/src/funding.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const VALIDATE_FUNDING_CAPABILITY_UNAPPROVED_DETAIL =
  'T-FUND-04 unapproved method fails closed';

export const VALIDATE_FUNDING_CAPABILITY_UNAVAILABLE_DETAIL =
  'T-FUND-04 validateFundingCapability cannot complete: capabilities store is not implemented (fail closed); T-FUND-03 HOLD';

export async function validateFundingCapability(
  ctx: Fund01CommandContext,
  input: Fund04Input,
): Promise<Result<Fund04Output, Problem>> {
  ctx.trace('validate_funding_capability_fail_closed', {
    unapprovedMethod: input.unapprovedMethod,
  });
  if (input.unapprovedMethod) {
    return err(problem('CAPABILITY_UNAVAILABLE', 403, false, VALIDATE_FUNDING_CAPABILITY_UNAPPROVED_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, VALIDATE_FUNDING_CAPABILITY_UNAVAILABLE_DETAIL));
}
