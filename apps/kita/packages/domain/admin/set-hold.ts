/**
 * @kita/domain — set-hold (T-ADM-03).
 *
 * Pure fail-closed checker. A hold after dispatch is never treated as
 * pre-dispatch cancellation. Never records a hold. Never ok:true.
 * Holds store remains T-CORE-02 HOLD.
 */

import type { Adm03CommandContext, Adm03Input, Adm03Output } from '../../contracts/src/admin.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const SET_HOLD_POST_DISPATCH_CANCEL_DETAIL =
  'T-ADM-03 hold after dispatch cannot be treated as pre-dispatch cancellation';

export const SET_HOLD_UNAVAILABLE_DETAIL =
  'T-ADM-03 setHold cannot record a hold: holds store and T-CORE-02 are not implemented (fail closed)';

export async function setHold(
  ctx: Adm03CommandContext,
  input: Adm03Input,
): Promise<Result<Adm03Output, Problem>> {
  ctx.trace('set_hold_fail_closed', {
    holdAfterDispatchWouldBeTreatedAsPreDispatchCancel:
      input.holdAfterDispatchWouldBeTreatedAsPreDispatchCancel,
  });
  if (input.holdAfterDispatchWouldBeTreatedAsPreDispatchCancel) {
    return err(problem('COMPLIANCE_HOLD', 409, false, SET_HOLD_POST_DISPATCH_CANCEL_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, SET_HOLD_UNAVAILABLE_DETAIL));
}
