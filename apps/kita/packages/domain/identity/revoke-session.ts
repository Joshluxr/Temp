/**
 * @kita/domain — revoke-session (T-AUTH-02).
 *
 * Pure fail-closed checker. Revoked token cannot continue a financial command.
 * Never ok:true. Never issue a live session.
 */

import type { Auth01CommandContext, Auth02Input, Auth02Output } from '../../contracts/src/identity.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const REVOKE_SESSION_REVOKED_DETAIL =
  'T-AUTH-02 revoked token cannot continue financial command';

export const REVOKE_SESSION_UNAVAILABLE_DETAIL =
  'T-AUTH-02 revokeSession cannot complete: session store/OIDC is not implemented (fail closed)';

export async function revokeSession(
  ctx: Auth01CommandContext,
  input: Auth02Input,
): Promise<Result<Auth02Output, Problem>> {
  ctx.trace('revoke_session_fail_closed', {
    tokenRevoked: input.tokenRevoked,
  });
  if (input.tokenRevoked) {
    return err(problem('unauthorized', 403, false, REVOKE_SESSION_REVOKED_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, REVOKE_SESSION_UNAVAILABLE_DETAIL));
}
