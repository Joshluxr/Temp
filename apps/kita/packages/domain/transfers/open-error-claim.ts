/**
 * @kita/domain — open-error-claim (T-TX-07).
 *
 * Pure fail-closed clock checker. Support handoff never resets original statutory clock.
 * Never ok:true. Never grant a refund.
 */

import type { Tx07Input, Tx07Output, Tx08CommandContext } from '../../contracts/src/transfers.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const OPEN_ERROR_CLAIM_CLOCK_DETAIL =
  'T-TX-07 support handoff never resets original statutory clock';

export const OPEN_ERROR_CLAIM_UNAVAILABLE_DETAIL =
  'T-TX-07 openErrorClaim cannot complete: case/calendar store is not implemented (fail closed)';

export async function openErrorClaim(
  ctx: Tx08CommandContext,
  input: Tx07Input,
): Promise<Result<Tx07Output, Problem>> {
  ctx.trace('open_error_claim_fail_closed', {
    supportHandoffResetsStatutoryClock: input.supportHandoffResetsStatutoryClock,
  });
  if (input.supportHandoffResetsStatutoryClock) {
    return err(problem('POLICY_UNAVAILABLE', 409, false, OPEN_ERROR_CLAIM_CLOCK_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, OPEN_ERROR_CLAIM_UNAVAILABLE_DETAIL));
}
