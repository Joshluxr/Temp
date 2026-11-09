/**
 * @kita/domain — estimate-quote (T-PUB-02).
 *
 * Pure fail-closed checker. Stale feed labels estimate and cannot yield executable transfer.
 * Never ok:true. Never yield an executable transfer or quoteId. T-QUOTE-01 remains HOLD.
 */

import type { Pub01CommandContext, Pub02Input, Pub02Output } from '../../contracts/src/catalog.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const ESTIMATE_QUOTE_STALE_DETAIL =
  'T-PUB-02 stale feed labels estimate and cannot yield executable transfer';

export const ESTIMATE_QUOTE_UNAVAILABLE_DETAIL =
  'T-PUB-02 estimateQuote cannot complete: indicative snapshot store is not implemented (fail closed); T-QUOTE-01 HOLD';

export async function estimateQuote(
  ctx: Pub01CommandContext,
  input: Pub02Input,
): Promise<Result<Pub02Output, Problem>> {
  ctx.trace('estimate_quote_fail_closed', {
    staleIndicativeFeed: input.staleIndicativeFeed,
  });
  if (input.staleIndicativeFeed) {
    return err(problem('RATE_STALE', 409, false, ESTIMATE_QUOTE_STALE_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, ESTIMATE_QUOTE_UNAVAILABLE_DETAIL));
}
