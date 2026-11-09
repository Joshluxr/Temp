/**
 * @kita/domain — decide-case (T-ADM-04).
 *
 * Pure fail-closed checker. Unqualified roles cannot override blocked-property
 * restrictions. No sanctions override. Never ok:true.
 */

import type { Adm01CommandContext, Adm04Input, Adm04Output } from '../../contracts/src/admin.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const DECIDE_CASE_UNQUALIFIED_DETAIL =
  'T-ADM-04 unqualified role cannot override blocked-property restriction';

export const DECIDE_CASE_OVERRIDE_DENIED_DETAIL =
  'T-ADM-04 blocked-property override is not authorized (no sanctions override)';

export const DECIDE_CASE_UNAVAILABLE_DETAIL =
  'T-ADM-04 decideCase cannot record a decision: case decision store is not implemented (fail closed)';

export async function decideCase(
  ctx: Adm01CommandContext,
  input: Adm04Input,
): Promise<Result<Adm04Output, Problem>> {
  ctx.trace('decide_case_fail_closed', {
    unqualifiedRole: input.unqualifiedRole,
    overrideBlockedProperty: input.overrideBlockedProperty,
  });
  if (input.unqualifiedRole) {
    return err(problem('unauthorized', 403, false, DECIDE_CASE_UNQUALIFIED_DETAIL));
  }
  if (input.overrideBlockedProperty) {
    return err(problem('APPROVAL_REQUIRED', 409, false, DECIDE_CASE_OVERRIDE_DENIED_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, DECIDE_CASE_UNAVAILABLE_DETAIL));
}
