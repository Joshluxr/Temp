/**
 * @kita/domain — reserve-points (T-GROW-02).
 *
 * Pure fail-closed checker. Concurrent redemption/expiry cannot overspend a lot.
 * Never ok:true. Never convert units to fiat. T-REWARD-01 remains HOLD.
 */

import type { Grow02CommandContext, Grow02Input, Grow02Output } from '../../contracts/src/rewards.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const RESERVE_POINTS_OVERSPEND_DETAIL =
  'Concurrent redemption/expiry cannot overspend a lot.';

export const RESERVE_POINTS_UNAVAILABLE_DETAIL =
  'T-GROW-02 reservePoints cannot complete: points store is not implemented (fail closed); T-REWARD-01 HOLD';

export async function reservePoints(
  ctx: Grow02CommandContext,
  input: Grow02Input,
): Promise<Result<Grow02Output, Problem>> {
  ctx.trace('reserve_points_fail_closed', {
    concurrentRedemptionExpiryOverspend: input.concurrentRedemptionExpiryOverspend,
  });
  if (input.concurrentRedemptionExpiryOverspend) {
    return err(problem('INSUFFICIENT_FUNDS', 409, false, RESERVE_POINTS_OVERSPEND_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, RESERVE_POINTS_UNAVAILABLE_DETAIL));
}
