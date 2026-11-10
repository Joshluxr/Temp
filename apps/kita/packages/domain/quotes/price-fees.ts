/**
 * @kita/domain — price-fees (T-QUOTE-03).
 *
 * Pure fail-closed checker. Tier boundary discount and tax totals must be
 * exact; missing tax cannot default to zero. Never ok:true. Never price.
 * T-QUOTE-01 remains HOLD.
 */

import type { Quote03CommandContext, Quote03Input, Quote03Output } from '../../contracts/src/quotes.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const PRICE_FEES_TAX_DETAIL =
  'Tier boundary discount and tax totals must be exact; no missing-tax default zero.';

export const PRICE_FEES_UNAVAILABLE_DETAIL =
  'T-QUOTE-03 priceFees cannot complete: policies/quotes store is not implemented (fail closed); T-QUOTE-01 HOLD';

export async function priceFees(
  ctx: Quote03CommandContext,
  input: Quote03Input,
): Promise<Result<Quote03Output, Problem>> {
  ctx.trace('price_fees_fail_closed', {
    missingTaxWouldDefaultZeroOrInexactTierTotals: input.missingTaxWouldDefaultZeroOrInexactTierTotals,
  });
  if (input.missingTaxWouldDefaultZeroOrInexactTierTotals) {
    return err(problem('POLICY_UNAVAILABLE', 409, false, PRICE_FEES_TAX_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, PRICE_FEES_UNAVAILABLE_DETAIL));
}
