/**
 * @kita/domain — settle-custody-leg (T-EXT-02).
 *
 * Pure fail-closed checker. Wrong network, depeg, reorg, and uncertain
 * settlement never produce available PHP cash. Never ok:true.
 * T-CORE-02, T-LEDGER-02, and DEP-11 remain HOLD.
 */

import type { Ext02CommandContext, Ext02Input, Ext02Output } from '../../contracts/src/treasury.ts';
import type { Problem, Result } from '../../contracts/src/result.ts';
import { err, problem } from '../../contracts/src/result.ts';

export const SETTLE_CUSTODY_UNAUTHORIZED_DETAIL =
  'T-EXT-02 institutional custody movement is not authorized';

export const SETTLE_CUSTODY_POLICY_DETAIL =
  'T-EXT-02 custody asset or network policy mismatch blocks settlement';

export const SETTLE_CUSTODY_DEPEG_DETAIL =
  'T-EXT-02 depeg or reorganization blocks custody settlement';

export const SETTLE_CUSTODY_UNCERTAIN_DETAIL =
  'T-EXT-02 custody or fiat settlement remains uncertain; no available PHP cash is established';

export const SETTLE_CUSTODY_UNAVAILABLE_DETAIL =
  'T-EXT-02 settleCustodyLeg cannot persist custody or fiat settlement or grant financial authority: T-CORE-02 and T-LEDGER-02 remain HOLD; DEP-11 is not cleared (fail closed)';

export async function settleCustodyLeg(
  _ctx: Ext02CommandContext,
  input: Ext02Input,
): Promise<Result<Ext02Output, Problem>> {
  if (input.unauthorizedCustodyMovement) {
    return err(problem('unauthorized', 403, false, SETTLE_CUSTODY_UNAUTHORIZED_DETAIL));
  }
  if (input.assetOrNetworkPolicyMismatch) {
    return err(problem('CAPABILITY_UNAVAILABLE', 409, false, SETTLE_CUSTODY_POLICY_DETAIL));
  }
  if (input.depegOrReorgDetected) {
    return err(problem('CAPABILITY_UNAVAILABLE', 409, false, SETTLE_CUSTODY_DEPEG_DETAIL));
  }
  if (input.settlementUncertain) {
    return err(problem('PROVIDER_OUTCOME_UNKNOWN', 409, false, SETTLE_CUSTODY_UNCERTAIN_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, SETTLE_CUSTODY_UNAVAILABLE_DETAIL));
}
