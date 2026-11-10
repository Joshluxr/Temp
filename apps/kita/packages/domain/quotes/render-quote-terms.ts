/**
 * @kita/domain — render-quote-terms (T-QUOTE-07).
 *
 * Pure fail-closed checker. Display rounding never changes execution
 * arithmetic. Never ok:true. Never rewrite terms. T-QUOTE-01 remains HOLD.
 */

import type { Quote07CommandContext, Quote07Input, Quote07Output } from '../../contracts/src/quotes.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const RENDER_QUOTE_TERMS_ROUNDING_DETAIL =
  'Display rounding never changes execution arithmetic.';

export const RENDER_QUOTE_TERMS_UNAVAILABLE_DETAIL =
  'T-QUOTE-07 renderQuoteTerms cannot complete: quotes store is not implemented (fail closed); T-QUOTE-01 HOLD';

export async function renderQuoteTerms(
  ctx: Quote07CommandContext,
  input: Quote07Input,
): Promise<Result<Quote07Output, Problem>> {
  ctx.trace('render_quote_terms_fail_closed', {
    displayRoundingWouldChangeExecutionArithmetic: input.displayRoundingWouldChangeExecutionArithmetic,
  });
  if (input.displayRoundingWouldChangeExecutionArithmetic) {
    return err(problem('POLICY_UNAVAILABLE', 409, false, RENDER_QUOTE_TERMS_ROUNDING_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, RENDER_QUOTE_TERMS_UNAVAILABLE_DETAIL));
}
