/**
 * @kita/domain — repeat-transfer (T-REC-04).
 *
 * Pure fail-closed checker. Repeat must obtain a new quote and never replay
 * an old payment. Draft store / T-QUOTE-08 is not implemented. Never ok:true.
 */

import type { Rec01CommandContext, Rec04Input, Rec04Output } from '../../contracts/src/recipients.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const REPEAT_TRANSFER_REPLAY_DETAIL =
  'T-REC-04 repeat must obtain a new quote and never replay the old payment';

export const REPEAT_TRANSFER_UNAVAILABLE_DETAIL =
  'T-REC-04 repeatTransfer cannot create a payable draft: T-QUOTE-08/draft store is not implemented (fail closed)';

export async function repeatTransfer(
  ctx: Rec01CommandContext,
  input: Rec04Input,
): Promise<Result<Rec04Output, Problem>> {
  ctx.trace('repeat_transfer_fail_closed', {
    actorId: String(ctx.actorId),
    reuseOldPayment: input.reuseOldPayment,
  });
  if (input.reuseOldPayment) {
    return err(problem('CAPABILITY_UNAVAILABLE', 409, false, REPEAT_TRANSFER_REPLAY_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, REPEAT_TRANSFER_UNAVAILABLE_DETAIL));
}
