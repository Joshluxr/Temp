/**
 * @kita/domain — recover-funding (T-FUND-05).
 *
 * Pure fail-closed checker. Timeout after debit never creates second charge.
 * Never ok:true.
 */

import type { Fund01CommandContext, Fund05Input, Fund05Output } from '../../contracts/src/funding.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const RECOVER_FUNDING_UNKNOWN_DETAIL =
  'T-FUND-05 timeout after debit never creates second charge';

export const RECOVER_FUNDING_UNAVAILABLE_DETAIL =
  'T-FUND-05 recoverFunding cannot complete: provider_attempts/inquiry store is not implemented (fail closed)';

export async function recoverFunding(
  ctx: Fund01CommandContext,
  input: Fund05Input,
): Promise<Result<Fund05Output, Problem>> {
  ctx.trace('recover_funding_fail_closed', {
    timeoutAfterDebitWouldRecharge: input.timeoutAfterDebitWouldRecharge,
  });
  if (input.timeoutAfterDebitWouldRecharge) {
    return err(problem('PROVIDER_OUTCOME_UNKNOWN', 409, false, RECOVER_FUNDING_UNKNOWN_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, RECOVER_FUNDING_UNAVAILABLE_DETAIL));
}
