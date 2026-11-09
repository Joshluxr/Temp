/**
 * @kita/domain — exchange-mobile-code (T-AUTH-07).
 *
 * Pure fail-closed checker. Expired key or hostile deep link requires safe reauthentication.
 * Never ok:true. Never issue a mobile session or treat biometric unlock as KYC evidence.
 */

import type { Auth01CommandContext, Auth07Input, Auth07Output } from '../../contracts/src/identity.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const EXCHANGE_MOBILE_CODE_HOSTILE_DETAIL =
  'T-AUTH-07 expired key or hostile deep link requires safe reauthentication';

export const EXCHANGE_MOBILE_CODE_UNAVAILABLE_DETAIL =
  'T-AUTH-07 exchangeMobileCode cannot complete: mobile session store is not implemented (fail closed)';

export async function exchangeMobileCode(
  ctx: Auth01CommandContext,
  input: Auth07Input,
): Promise<Result<Auth07Output, Problem>> {
  ctx.trace('exchange_mobile_code_fail_closed', {
    expiredKeyOrHostileDeepLink: input.expiredKeyOrHostileDeepLink,
  });
  if (input.expiredKeyOrHostileDeepLink) {
    return err(problem('unauthorized', 403, false, EXCHANGE_MOBILE_CODE_HOSTILE_DETAIL));
  }
  return err(problem('CAPABILITY_UNAVAILABLE', 503, true, EXCHANGE_MOBILE_CODE_UNAVAILABLE_DETAIL));
}
