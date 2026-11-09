/**
 * @kita/domain — respond-to-rfi (T-TX-09).
 *
 * Pure fail-closed checker. Confidential risk details absent from public projection.
 * Never ok:true. Error responses must not include confidential risk details.
 */

import type { Tx08CommandContext, Tx09Input, Tx09Output } from '../../contracts/src/transfers.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const RESPOND_TO_RFI_RESTRICTED_DETAIL =
  'T-TX-09 confidential risk details are absent from the public projection';

export const RESPOND_TO_RFI_UNAVAILABLE_DETAIL =
  'T-TX-09 respondToRfi cannot complete: case/RFI store is not implemented (fail closed)';

export async function respondToRfi(
  ctx: Tx08CommandContext,
  input: Tx09Input,
): Promise<Result<Tx09Output, Problem>> {
  ctx.trace('respond_to_rfi_fail_closed', {
    confidentialRiskInPublicProjection: input.confidentialRiskInPublicProjection,
  });
  if (input.confidentialRiskInPublicProjection) {
    return err(problem('unauthorized', 403, false, RESPOND_TO_RFI_RESTRICTED_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, RESPOND_TO_RFI_UNAVAILABLE_DETAIL));
}
