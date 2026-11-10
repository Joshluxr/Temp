/**
 * @kita/domain — vest-points (T-GROW-01).
 *
 * Pure fail-closed checker. Duplicate payout callback awards once.
 * Never ok:true. Never award points. T-REWARD-01 remains HOLD.
 */

import type { Grow01CommandContext, Grow01Input, Grow01Output } from '../../contracts/src/rewards.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const VEST_POINTS_DUPLICATE_DETAIL =
  'Duplicate payout callback awards once.';

export const VEST_POINTS_UNAVAILABLE_DETAIL =
  'T-GROW-01 vestPoints cannot complete: points store is not implemented (fail closed); T-REWARD-01 HOLD';

export async function vestPoints(
  ctx: Grow01CommandContext,
  input: Grow01Input,
): Promise<Result<Grow01Output, Problem>> {
  ctx.trace('vest_points_fail_closed', {
    duplicatePayoutCallbackAwardsTwice: input.duplicatePayoutCallbackAwardsTwice,
  });
  if (input.duplicatePayoutCallbackAwardsTwice) {
    return err(problem('POLICY_UNAVAILABLE', 409, false, VEST_POINTS_DUPLICATE_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, VEST_POINTS_UNAVAILABLE_DETAIL));
}
