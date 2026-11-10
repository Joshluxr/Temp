/**
 * @kita/domain — execute-auto-conversion (T-GROW-06).
 *
 * Pure fail-closed checker. Revoked mandate, stale revoke version, and
 * mandate-bound violations never convert. Never ok:true. Never reserve.
 * T-CORE-02 and T-LEDGER-02 remain HOLD.
 */

import type { Grow06CommandContext, Grow06Input, Grow06Output } from '../../contracts/src/schedules.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const EXECUTE_AUTO_CONVERSION_REVOKED_DETAIL =
  'T-GROW-06 revoked mandate cannot execute auto-conversion';

export const EXECUTE_AUTO_CONVERSION_STALE_DETAIL =
  'T-GROW-06 stale revoke version cannot execute auto-conversion';

export const EXECUTE_AUTO_CONVERSION_BOUNDS_DETAIL =
  'T-GROW-06 conversion would violate mandate bounds';

export const EXECUTE_AUTO_CONVERSION_UNAVAILABLE_DETAIL =
  'T-GROW-06 executeAutoConversion cannot persist a mandate reservation or grant execution authority: T-CORE-02 and T-LEDGER-02 remain HOLD (fail closed)';

export async function executeAutoConversion(
  ctx: Grow06CommandContext,
  input: Grow06Input,
): Promise<Result<Grow06Output, Problem>> {
  ctx.trace('execute_auto_conversion_fail_closed', {
    revokedMandate: input.revokedMandate,
    staleRevokeVersion: input.staleRevokeVersion,
    wouldViolateMandateBounds: input.wouldViolateMandateBounds,
  });
  if (input.revokedMandate) {
    return err(problem('unauthorized', 403, false, EXECUTE_AUTO_CONVERSION_REVOKED_DETAIL));
  }
  if (input.staleRevokeVersion) {
    return err(problem('VERSION_CONFLICT', 409, false, EXECUTE_AUTO_CONVERSION_STALE_DETAIL));
  }
  if (input.wouldViolateMandateBounds) {
    return err(problem('LIMIT_EXCEEDED', 409, false, EXECUTE_AUTO_CONVERSION_BOUNDS_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, EXECUTE_AUTO_CONVERSION_UNAVAILABLE_DETAIL));
}
