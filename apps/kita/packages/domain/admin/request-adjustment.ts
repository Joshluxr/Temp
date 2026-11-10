/**
 * @kita/domain — request-adjustment (T-ADM-06).
 *
 * Pure fail-closed checker. Unauthorized accounts and stale bound approval
 * payloads never grant command authority. Never ok:true. Never persist.
 * T-CORE-02 and T-LEDGER-02 remain HOLD.
 */

import type { Adm06CommandContext, Adm06Input, Adm06Output } from '../../contracts/src/admin.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const REQUEST_ADJUSTMENT_UNAUTHORIZED_DETAIL =
  'T-ADM-06 unauthorized accounts cannot request an adjustment';

export const REQUEST_ADJUSTMENT_STALE_DETAIL =
  'T-ADM-06 stale bound approval payload cannot request an adjustment';

export const REQUEST_ADJUSTMENT_UNAVAILABLE_DETAIL =
  'T-ADM-06 requestAdjustment cannot persist an adjustment or grant command authority: T-CORE-02 and T-LEDGER-02 remain HOLD (fail closed)';

export async function requestAdjustment(
  ctx: Adm06CommandContext,
  input: Adm06Input,
): Promise<Result<Adm06Output, Problem>> {
  ctx.trace('request_adjustment_fail_closed', {
    stalePayload: input.stalePayload,
    unauthorizedAccounts: input.unauthorizedAccounts,
  });
  if (input.unauthorizedAccounts) {
    return err(problem('unauthorized', 403, false, REQUEST_ADJUSTMENT_UNAUTHORIZED_DETAIL));
  }
  if (input.stalePayload) {
    return err(problem('APPROVAL_STALE', 409, false, REQUEST_ADJUSTMENT_STALE_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, REQUEST_ADJUSTMENT_UNAVAILABLE_DETAIL));
}
