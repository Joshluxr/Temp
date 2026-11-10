/**
 * @kita/domain — validate-rate (T-QUOTE-04).
 *
 * Pure fail-closed checker. Stale quote unavailable; no cached execution
 * fallback. Never ok:true. Never execute. T-QUOTE-01 remains HOLD.
 */

import type { Quote04CommandContext, Quote04Input, Quote04Output } from '../../contracts/src/quotes.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const VALIDATE_RATE_STALE_DETAIL =
  'Stale quote unavailable; no cached execution fallback.';

export const VALIDATE_RATE_UNAVAILABLE_DETAIL =
  'T-QUOTE-04 validateRate cannot complete: executable FX store is not implemented (fail closed); T-QUOTE-01 HOLD';

export async function validateRate(
  ctx: Quote04CommandContext,
  input: Quote04Input,
): Promise<Result<Quote04Output, Problem>> {
  ctx.trace('validate_rate_fail_closed', {
    staleQuoteWouldExecuteFromCache: input.staleQuoteWouldExecuteFromCache,
  });
  if (input.staleQuoteWouldExecuteFromCache) {
    return err(problem('RATE_STALE', 409, false, VALIDATE_RATE_STALE_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, VALIDATE_RATE_UNAVAILABLE_DETAIL));
}
