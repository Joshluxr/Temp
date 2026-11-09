/**
 * @kita/domain — decide-approval (T-ADM-05).
 *
 * Pure fail-closed checker. Second login of the same person cannot approve.
 * Approvals store is not implemented. Never ok:true. Never grant command authority.
 */

import type { Adm01CommandContext, Adm05Input, Adm05Output } from '../../contracts/src/admin.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const DECIDE_APPROVAL_SAME_PERSON_DETAIL =
  'T-ADM-05 second login of the same person cannot approve';

export const DECIDE_APPROVAL_UNAVAILABLE_DETAIL =
  'T-ADM-05 decideApproval cannot grant command authority: approvals store is not implemented (fail closed)';

export async function decideApproval(
  ctx: Adm01CommandContext,
  input: Adm05Input,
): Promise<Result<Adm05Output, Problem>> {
  ctx.trace('decide_approval_fail_closed', {
    samePersonSecondLogin: input.samePersonSecondLogin,
  });
  if (input.samePersonSecondLogin) {
    return err(problem('APPROVAL_STALE', 409, false, DECIDE_APPROVAL_SAME_PERSON_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, DECIDE_APPROVAL_UNAVAILABLE_DETAIL));
}
