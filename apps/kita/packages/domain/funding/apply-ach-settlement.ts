/**
 * @kita/domain — apply-ach-settlement (T-FUND-02).
 *
 * Pure fail-closed checker. Initiation alone cannot authorize payout.
 * Never ok:true. Never advance ACH. T-LEDGER-02 remains HOLD.
 */

import type { Fund02CommandContext, Fund02Input, Fund02Output } from '../../contracts/src/funding.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const APPLY_ACH_SETTLEMENT_INITIATION_DETAIL =
  'Initiation alone cannot authorize payout.';

export const APPLY_ACH_SETTLEMENT_UNAVAILABLE_DETAIL =
  'T-FUND-02 applyAchSettlement cannot complete: ACH settlement store is not implemented (fail closed); T-LEDGER-02 HOLD';

export async function applyAchSettlement(
  ctx: Fund02CommandContext,
  input: Fund02Input,
): Promise<Result<Fund02Output, Problem>> {
  ctx.trace('apply_ach_settlement_fail_closed', {
    initiationAloneWouldAuthorizePayout: input.initiationAloneWouldAuthorizePayout,
  });
  if (input.initiationAloneWouldAuthorizePayout) {
    return err(problem('FUNDING_PENDING', 409, false, APPLY_ACH_SETTLEMENT_INITIATION_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, APPLY_ACH_SETTLEMENT_UNAVAILABLE_DETAIL));
}
