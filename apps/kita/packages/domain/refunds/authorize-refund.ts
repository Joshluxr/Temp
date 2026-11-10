/**
 * @kita/domain — authorize-refund (T-TX-06).
 *
 * Pure fail-closed checker. Concurrent partial refunds cannot exceed
 * entitlement. Never ok:true. Never refund. T-LEDGER-02 remains HOLD.
 */

import type { Tx06CommandContext, Tx06Input, Tx06Output } from '../../contracts/src/refunds.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const AUTHORIZE_REFUND_EXCEED_DETAIL =
  'Concurrent partial refunds cannot exceed entitlement.';

export const AUTHORIZE_REFUND_UNAVAILABLE_DETAIL =
  'T-TX-06 authorizeRefund cannot complete: refund store is not implemented (fail closed); T-LEDGER-02 HOLD';

export async function authorizeRefund(
  ctx: Tx06CommandContext,
  input: Tx06Input,
): Promise<Result<Tx06Output, Problem>> {
  ctx.trace('authorize_refund_fail_closed', {
    concurrentPartialRefundsWouldExceedEntitlement: input.concurrentPartialRefundsWouldExceedEntitlement,
  });
  if (input.concurrentPartialRefundsWouldExceedEntitlement) {
    return err(problem('LIMIT_EXCEEDED', 409, false, AUTHORIZE_REFUND_EXCEED_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, AUTHORIZE_REFUND_UNAVAILABLE_DETAIL));
}
