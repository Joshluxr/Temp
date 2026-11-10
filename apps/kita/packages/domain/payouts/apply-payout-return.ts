/**
 * @kita/domain — apply-payout-return (T-PAY-05).
 *
 * Pure fail-closed checker. Returned amount capped and original delivered timestamp preserved.
 * Never ok:true. Never grant a refund. T-TX-06 remains HOLD.
 */

import type { Pay05Input, Pay05Output, Pay06CommandContext } from '../../contracts/src/payouts.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const APPLY_PAYOUT_RETURN_CAP_DETAIL =
  'T-PAY-05 returned amount capped and original delivered timestamp preserved';

export const APPLY_PAYOUT_RETURN_UNAVAILABLE_DETAIL =
  'T-PAY-05 applyPayoutReturn cannot complete: payout-return store is not implemented (fail closed); T-TX-06 HOLD';

export async function applyPayoutReturn(
  ctx: Pay06CommandContext,
  input: Pay05Input,
): Promise<Result<Pay05Output, Problem>> {
  ctx.trace('apply_payout_return_fail_closed', {
    returnExceedsCapOrErasesDeliveredTimestamp: input.returnExceedsCapOrErasesDeliveredTimestamp,
  });
  if (input.returnExceedsCapOrErasesDeliveredTimestamp) {
    return err(problem('PROVIDER_OUTCOME_UNKNOWN', 409, false, APPLY_PAYOUT_RETURN_CAP_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, APPLY_PAYOUT_RETURN_UNAVAILABLE_DETAIL));
}
