/**
 * @kita/domain — reveal-pii (T-ADM-09).
 *
 * Pure fail-closed checker. Step-up, reason, and expiry are enforced.
 * Never ok:true. Never return unmasked PII or an export URL. Never trace PII.
 */

import type { Adm01CommandContext, Adm09Input, Adm09Output } from '../../contracts/src/admin.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const REVEAL_PII_POLICY_DETAIL =
  'T-ADM-09 PII reveal requires fresh step-up, purpose/reason, and unexpired grant';

export const REVEAL_PII_UNAVAILABLE_DETAIL =
  'T-ADM-09 revealPii cannot issue a timed grant: PII reveal store is not implemented (fail closed)';

export async function revealPii(
  ctx: Adm01CommandContext,
  input: Adm09Input,
): Promise<Result<Adm09Output, Problem>> {
  ctx.trace('reveal_pii_fail_closed', {
    missingStepUp: input.missingStepUp,
    missingReason: input.missingReason,
    expired: input.expired,
  });
  if (input.missingStepUp || input.missingReason || input.expired) {
    return err(problem('unauthorized', 403, false, REVEAL_PII_POLICY_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, REVEAL_PII_UNAVAILABLE_DETAIL));
}
