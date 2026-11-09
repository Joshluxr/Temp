/**
 * @kita/domain — qualify-referral (T-GROW-04).
 *
 * Pure fail-closed checker. Self-referral blocked and household signal reviewed.
 * Never ok:true. Never issue points. T-REWARD-01 remains HOLD.
 */

import type { Grow04CommandContext, Grow04Input, Grow04Output } from '../../contracts/src/rewards.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const QUALIFY_REFERRAL_SELF_DETAIL =
  'Self-referral blocked and household signal reviewed.';

export const QUALIFY_REFERRAL_UNAVAILABLE_DETAIL =
  'T-GROW-04 qualifyReferral cannot complete: referral/points store is not implemented (fail closed); T-REWARD-01 HOLD';

export async function qualifyReferral(
  ctx: Grow04CommandContext,
  input: Grow04Input,
): Promise<Result<Grow04Output, Problem>> {
  ctx.trace('qualify_referral_fail_closed', {
    selfReferral: input.selfReferral,
  });
  if (input.selfReferral) {
    return err(problem('LIMIT_EXCEEDED', 409, false, QUALIFY_REFERRAL_SELF_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, QUALIFY_REFERRAL_UNAVAILABLE_DETAIL));
}
