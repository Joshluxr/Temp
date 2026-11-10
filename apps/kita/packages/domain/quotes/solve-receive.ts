/**
 * @kita/domain — solve-receive (T-QUOTE-02).
 *
 * Pure fail-closed checker. JPY and USD inversion must deliver the requested
 * minor amount exactly. Never ok:true. Never solve. T-QUOTE-01 remains HOLD.
 */

import type { Quote02CommandContext, Quote02Input, Quote02Output } from '../../contracts/src/quotes.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const SOLVE_RECEIVE_MISS_DETAIL =
  'JPY and USD inversion must deliver the requested minor amount exactly.';

export const SOLVE_RECEIVE_UNAVAILABLE_DETAIL =
  'T-QUOTE-02 solveReceive cannot complete: quotes store is not implemented (fail closed); T-QUOTE-01 HOLD';

export async function solveReceive(
  ctx: Quote02CommandContext,
  input: Quote02Input,
): Promise<Result<Quote02Output, Problem>> {
  ctx.trace('solve_receive_fail_closed', {
    inverseWouldMissRequestedMinorAmount: input.inverseWouldMissRequestedMinorAmount,
  });
  if (input.inverseWouldMissRequestedMinorAmount) {
    return err(problem('CAPABILITY_UNAVAILABLE', 409, false, SOLVE_RECEIVE_MISS_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, SOLVE_RECEIVE_UNAVAILABLE_DETAIL));
}
