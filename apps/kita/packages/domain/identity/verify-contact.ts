/**
 * @kita/domain — verify-contact (T-AUTH-01).
 *
 * Pure fail-closed checker. Unverified contact cannot authorize transfer.
 * Never ok:true. Never treat a contact as financial authorization.
 */

import type { Auth01CommandContext, Auth01Input, Auth01Output } from '../../contracts/src/identity.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const VERIFY_CONTACT_UNVERIFIED_DETAIL =
  'T-AUTH-01 unverified contact cannot authorize transfer';

export const VERIFY_CONTACT_UNAVAILABLE_DETAIL =
  'T-AUTH-01 verifyContact cannot complete verification: identity store/T-IDENTITY-01 live verification is not implemented (fail closed)';

export async function verifyContact(
  ctx: Auth01CommandContext,
  input: Auth01Input,
): Promise<Result<Auth01Output, Problem>> {
  ctx.trace('verify_contact_fail_closed', {
    contactVerified: input.contactVerified,
  });
  if (!input.contactVerified) {
    return err(problem('unauthorized', 403, false, VERIFY_CONTACT_UNVERIFIED_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, VERIFY_CONTACT_UNAVAILABLE_DETAIL));
}
