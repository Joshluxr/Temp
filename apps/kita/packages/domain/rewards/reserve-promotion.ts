/**
 * @kita/domain — reserve-promotion (T-GROW-03).
 *
 * Pure fail-closed checker. Last budget unit reserved by one transfer only.
 * Never ok:true. Never reserve budget. T-REWARD-01 remains HOLD.
 */

import type { Grow03CommandContext, Grow03Input, Grow03Output } from '../../contracts/src/rewards.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const RESERVE_PROMOTION_DOUBLE_RESERVE_DETAIL =
  'Last budget unit reserved by one transfer only.';

export const RESERVE_PROMOTION_UNAVAILABLE_DETAIL =
  'T-GROW-03 reservePromotion cannot complete: campaign/points store is not implemented (fail closed); T-REWARD-01 HOLD';

export async function reservePromotion(
  ctx: Grow03CommandContext,
  input: Grow03Input,
): Promise<Result<Grow03Output, Problem>> {
  ctx.trace('reserve_promotion_fail_closed', {
    lastBudgetUnitReservedTwice: input.lastBudgetUnitReservedTwice,
  });
  if (input.lastBudgetUnitReservedTwice) {
    return err(problem('LIMIT_EXCEEDED', 409, false, RESERVE_PROMOTION_DOUBLE_RESERVE_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, RESERVE_PROMOTION_UNAVAILABLE_DETAIL));
}
