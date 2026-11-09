/**
 * @kita/domain — list-sessions (T-AUTH-05).
 *
 * Pure fail-closed checker. Revoked device cannot refresh token.
 * Never ok:true. Never refresh a token or keep SSE alive.
 */

import type { Auth01CommandContext, Auth05Input, Auth05Output } from '../../contracts/src/identity.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const LIST_SESSIONS_REVOKED_DETAIL =
  'T-AUTH-05 revoked device cannot refresh token';

export const LIST_SESSIONS_UNAVAILABLE_DETAIL =
  'T-AUTH-05 listSessions cannot complete: session inventory store is not implemented (fail closed)';

export async function listSessions(
  ctx: Auth01CommandContext,
  input: Auth05Input,
): Promise<Result<Auth05Output, Problem>> {
  ctx.trace('list_sessions_fail_closed', {
    deviceRevoked: input.deviceRevoked,
  });
  if (input.deviceRevoked) {
    return err(problem('unauthorized', 403, false, LIST_SESSIONS_REVOKED_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, LIST_SESSIONS_UNAVAILABLE_DETAIL));
}
