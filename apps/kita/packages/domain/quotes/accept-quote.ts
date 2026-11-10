/**
 * @kita/domain — accept-quote (T-QUOTE-05).
 *
 * Pure fail-closed checker. Expiry equality or recipient change produces
 * conflict. Never ok:true. Never accept. T-QUOTE-01 remains HOLD.
 */

import type { Quote05CommandContext, Quote05Input, Quote05Output } from '../../contracts/src/quotes.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const ACCEPT_QUOTE_CONFLICT_DETAIL =
  'Expiry equality or recipient change produces conflict.';

export const ACCEPT_QUOTE_UNAVAILABLE_DETAIL =
  'T-QUOTE-05 acceptQuote cannot complete: quotes/transfers store is not implemented (fail closed); T-QUOTE-01 HOLD';

export async function acceptQuote(
  ctx: Quote05CommandContext,
  input: Quote05Input,
): Promise<Result<Quote05Output, Problem>> {
  ctx.trace('accept_quote_fail_closed', {
    expiryEqualityOrRecipientChange: input.expiryEqualityOrRecipientChange,
  });
  if (input.expiryEqualityOrRecipientChange) {
    return err(problem('QUOTE_EXPIRED', 409, false, ACCEPT_QUOTE_CONFLICT_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, ACCEPT_QUOTE_UNAVAILABLE_DETAIL));
}
