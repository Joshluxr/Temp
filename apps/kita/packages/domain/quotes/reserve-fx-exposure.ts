/**
 * @kita/domain — reserve-fx-exposure (T-QUOTE-06).
 *
 * Pure fail-closed checker. Wholesale deterioration changes corporate cost,
 * not the customer promise. Never ok:true. Never mutate terms. T-QUOTE-01 remains HOLD.
 */

import type { Quote06CommandContext, Quote06Input, Quote06Output } from '../../contracts/src/quotes.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const RESERVE_FX_EXPOSURE_PROMISE_DETAIL =
  'Wholesale deterioration changes corporate cost, not the customer promise.';

export const RESERVE_FX_EXPOSURE_UNAVAILABLE_DETAIL =
  'T-QUOTE-06 reserveFxExposure cannot complete: liquidity/quotes store is not implemented (fail closed); T-QUOTE-01 HOLD';

export async function reserveFxExposure(
  ctx: Quote06CommandContext,
  input: Quote06Input,
): Promise<Result<Quote06Output, Problem>> {
  ctx.trace('reserve_fx_exposure_fail_closed', {
    wholesaleDeteriorationWouldChangeCustomerPromise:
      input.wholesaleDeteriorationWouldChangeCustomerPromise,
  });
  if (input.wholesaleDeteriorationWouldChangeCustomerPromise) {
    return err(problem('POLICY_UNAVAILABLE', 409, false, RESERVE_FX_EXPOSURE_PROMISE_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, RESERVE_FX_EXPOSURE_UNAVAILABLE_DETAIL));
}
