/**
 * @kita/domain — report-reward-liability (T-GROW-09).
 *
 * Pure fail-closed checker. Issued/vested/redeemed/expired totals must
 * reconcile to provision. Never ok:true. Never imply a fiat balance.
 * T-REWARD-01 remains HOLD.
 */

import type { Grow09CommandContext, Grow09Input, Grow09Output } from '../../contracts/src/rewards.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const REPORT_REWARD_LIABILITY_DRIFT_DETAIL =
  'Issued/vested/redeemed/expired totals must reconcile to provision.';

export const REPORT_REWARD_LIABILITY_UNAVAILABLE_DETAIL =
  'T-GROW-09 reportRewardLiability cannot complete: journals/points store is not implemented (fail closed); T-REWARD-01 HOLD';

export async function reportRewardLiability(
  ctx: Grow09CommandContext,
  input: Grow09Input,
): Promise<Result<Grow09Output, Problem>> {
  ctx.trace('report_reward_liability_fail_closed', {
    issuedVestedRedeemedExpiredDisagreeProvision: input.issuedVestedRedeemedExpiredDisagreeProvision,
  });
  if (input.issuedVestedRedeemedExpiredDisagreeProvision) {
    return err(problem('VERSION_CONFLICT', 409, false, REPORT_REWARD_LIABILITY_DRIFT_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, REPORT_REWARD_LIABILITY_UNAVAILABLE_DETAIL));
}
