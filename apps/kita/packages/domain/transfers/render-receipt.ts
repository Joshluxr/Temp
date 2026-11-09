/**
 * @kita/domain — render-receipt (T-TX-04).
 *
 * Pure fail-closed checker. Old receipt unchanged after pricing update.
 * Never ok:true. Never rewrite an issued receipt.
 */

import type { Tx04Input, Tx04Output, Tx08CommandContext } from '../../contracts/src/transfers.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const RENDER_RECEIPT_IMMUTABLE_DETAIL =
  'T-TX-04 old receipt unchanged after pricing update';

export const RENDER_RECEIPT_UNAVAILABLE_DETAIL =
  'T-TX-04 renderReceipt cannot complete: receipt store is not implemented (fail closed); T-TX-01 HOLD';

export async function renderReceipt(
  ctx: Tx08CommandContext,
  input: Tx04Input,
): Promise<Result<Tx04Output, Problem>> {
  ctx.trace('render_receipt_fail_closed', {
    rewriteIssuedReceiptAfterPricingUpdate: input.rewriteIssuedReceiptAfterPricingUpdate,
  });
  if (input.rewriteIssuedReceiptAfterPricingUpdate) {
    return err(problem('POLICY_UNAVAILABLE', 409, false, RENDER_RECEIPT_IMMUTABLE_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, RENDER_RECEIPT_UNAVAILABLE_DETAIL));
}
