/**
 * @kita/domain — append-support-message (T-TX-08).
 *
 * Pure fail-closed checker. Wrong account cannot read or attach case evidence.
 * Never ok:true.
 */

import type { Tx08CommandContext, Tx08Input, Tx08Output } from '../../contracts/src/transfers.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const APPEND_SUPPORT_MESSAGE_SCOPED_DETAIL =
  'T-TX-08 wrong account cannot read or attach case evidence';

export const APPEND_SUPPORT_MESSAGE_UNAVAILABLE_DETAIL =
  'T-TX-08 appendSupportMessage cannot complete: case/document store is not implemented (fail closed)';

export async function appendSupportMessage(
  ctx: Tx08CommandContext,
  input: Tx08Input,
): Promise<Result<Tx08Output, Problem>> {
  ctx.trace('append_support_message_fail_closed', {
    wrongAccountOrCrossCaseAttachment: input.wrongAccountOrCrossCaseAttachment,
  });
  if (input.wrongAccountOrCrossCaseAttachment) {
    return err(problem('unauthorized', 403, false, APPEND_SUPPORT_MESSAGE_SCOPED_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, APPEND_SUPPORT_MESSAGE_UNAVAILABLE_DETAIL));
}
