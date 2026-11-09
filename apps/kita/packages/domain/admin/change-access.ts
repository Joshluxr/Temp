/**
 * @kita/domain — change-access (T-ADM-10).
 *
 * Pure fail-closed checker. No financial self-grant. Revoked approver cannot
 * execute a queued request. Never ok:true.
 */

import type { Adm01CommandContext, Adm10Input, Adm10Output } from '../../contracts/src/admin.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const CHANGE_ACCESS_SELF_GRANT_DETAIL =
  'T-ADM-10 no financial self-grant bypass';

export const CHANGE_ACCESS_REVOKED_DETAIL =
  'T-ADM-10 revoked approver cannot execute queued request';

export const CHANGE_ACCESS_UNAVAILABLE_DETAIL =
  'T-ADM-10 changeAccess cannot mutate grants: staff_grants store is not implemented (fail closed)';

export async function changeAccess(
  ctx: Adm01CommandContext,
  input: Adm10Input,
): Promise<Result<Adm10Output, Problem>> {
  ctx.trace('change_access_fail_closed', {
    revokedApprover: input.revokedApprover,
    financialSelfGrant: input.financialSelfGrant,
  });
  if (input.financialSelfGrant) {
    return err(problem('unauthorized', 403, false, CHANGE_ACCESS_SELF_GRANT_DETAIL));
  }
  if (input.revokedApprover) {
    return err(problem('APPROVAL_STALE', 409, false, CHANGE_ACCESS_REVOKED_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, CHANGE_ACCESS_UNAVAILABLE_DETAIL));
}
