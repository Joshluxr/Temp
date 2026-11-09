/**
 * @kita/domain — authorize-staff (T-ADM-01).
 *
 * Pure fail-closed checker. Customer tokens and unrelated entities are denied.
 * Workforce SSO is not implemented. Never ok:true. No owner auto-admin.
 */

import type { Adm01CommandContext, Adm01Input, Adm01Output } from '../../contracts/src/admin.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const AUTHORIZE_STAFF_CUSTOMER_DENIED_DETAIL =
  'T-ADM-01 customer token denied for staff authorization';

export const AUTHORIZE_STAFF_UNRELATED_ENTITY_DETAIL =
  'T-ADM-01 unrelated entity denied';

export const AUTHORIZE_STAFF_UNAVAILABLE_DETAIL =
  'T-ADM-01 authorizeStaff cannot issue a staff session: workforce SSO/OIDC is not implemented (fail closed)';

export async function authorizeStaff(
  ctx: Adm01CommandContext,
  input: Adm01Input,
): Promise<Result<Adm01Output, Problem>> {
  ctx.trace('authorize_staff_fail_closed', {
    audience: input.audience,
    unrelatedEntity: input.unrelatedEntity,
  });
  if (input.audience === 'customer') {
    return err(problem('unauthorized', 403, false, AUTHORIZE_STAFF_CUSTOMER_DENIED_DETAIL));
  }
  if (input.unrelatedEntity) {
    return err(problem('unauthorized', 403, false, AUTHORIZE_STAFF_UNRELATED_ENTITY_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, AUTHORIZE_STAFF_UNAVAILABLE_DETAIL));
}
