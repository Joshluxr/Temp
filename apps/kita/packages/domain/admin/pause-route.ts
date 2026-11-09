/**
 * @kita/domain — pause-route (T-ADM-12).
 *
 * Pure fail-closed checker. Never persist a route pause or reenable.
 * Never claim new commands are stopped in production. Never ok:true.
 */

import type { Adm01CommandContext, Adm12Input, Adm12Output } from '../../contracts/src/admin.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const PAUSE_ROUTE_REENABLE_DENIED_DETAIL =
  'T-ADM-12 reenable without independent approval is not authorized';

export const PAUSE_ROUTE_UNAVAILABLE_DETAIL =
  'T-ADM-12 pauseRoute cannot persist a pause: capabilities/holds store and T-CORE-02 are not implemented (fail closed)';

export async function pauseRoute(
  ctx: Adm01CommandContext,
  input: Adm12Input,
): Promise<Result<Adm12Output, Problem>> {
  ctx.trace('pause_route_fail_closed', {
    reenableWithoutApproval: input.reenableWithoutApproval,
  });
  if (input.reenableWithoutApproval) {
    return err(problem('APPROVAL_REQUIRED', 409, false, PAUSE_ROUTE_REENABLE_DENIED_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, PAUSE_ROUTE_UNAVAILABLE_DETAIL));
}
