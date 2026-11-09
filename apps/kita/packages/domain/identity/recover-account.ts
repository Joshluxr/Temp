/**
 * @kita/domain — recover-account (T-AUTH-04).
 *
 * Pure fail-closed checker. Recovery cannot bypass new-destination hold.
 * Never ok:true. Never issue a recovered session or lift a new-destination hold.
 */

import type { Auth01CommandContext, Auth04Input, Auth04Output } from '../../contracts/src/identity.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const RECOVER_ACCOUNT_HOLD_DETAIL =
  'T-AUTH-04 recovery cannot bypass new-destination hold';

export const RECOVER_ACCOUNT_UNAVAILABLE_DETAIL =
  'T-AUTH-04 recoverAccount cannot complete: recovery/hold store is not implemented (fail closed)';

export async function recoverAccount(
  ctx: Auth01CommandContext,
  input: Auth04Input,
): Promise<Result<Auth04Output, Problem>> {
  ctx.trace('recover_account_fail_closed', {
    bypassNewDestinationHold: input.bypassNewDestinationHold,
  });
  if (input.bypassNewDestinationHold) {
    return err(problem('COMPLIANCE_HOLD', 409, false, RECOVER_ACCOUNT_HOLD_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, RECOVER_ACCOUNT_UNAVAILABLE_DETAIL));
}
