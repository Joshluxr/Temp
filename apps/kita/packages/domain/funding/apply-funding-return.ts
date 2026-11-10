/**
 * @kita/domain — apply-funding-return (T-FUND-06).
 *
 * Pure fail-closed checker. Paid PHP persists with separate loss/recovery.
 * Never ok:true. Never seize an unrelated wallet. T-FIN-08 remains HOLD.
 */

import type { Fund01CommandContext, Fund06Input, Fund06Output } from '../../contracts/src/funding.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const APPLY_FUNDING_RETURN_PAID_PHP_DETAIL =
  'T-FUND-06 paid PHP persists with separate loss/recovery';

export const APPLY_FUNDING_RETURN_UNAVAILABLE_DETAIL =
  'T-FUND-06 applyFundingReturn cannot complete: dispute/journal store is not implemented (fail closed); T-FIN-08 HOLD';

export async function applyFundingReturn(
  ctx: Fund01CommandContext,
  input: Fund06Input,
): Promise<Result<Fund06Output, Problem>> {
  ctx.trace('apply_funding_return_fail_closed', {
    erasePaidPhpOrSeizeUnrelatedWallet: input.erasePaidPhpOrSeizeUnrelatedWallet,
  });
  if (input.erasePaidPhpOrSeizeUnrelatedWallet) {
    return err(problem('POLICY_UNAVAILABLE', 409, false, APPLY_FUNDING_RETURN_PAID_PHP_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, APPLY_FUNDING_RETURN_UNAVAILABLE_DETAIL));
}
