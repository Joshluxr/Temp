/**
 * @kita/domain — accept-transfer (T-TX-01).
 *
 * Pure fail-closed checker. Double tap and different keys on one quote create
 * one transfer, never two. Never ok:true. Never delivery. T-CORE-02 remains HOLD.
 */

import type { Tx01CommandContext, Tx01Input, Tx01Output } from '../../contracts/src/transfers.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const ACCEPT_TRANSFER_IDEMPOTENCY_DETAIL =
  'Double tap and different keys on one quote create one transfer.';

export const ACCEPT_TRANSFER_UNAVAILABLE_DETAIL =
  'T-TX-01 acceptTransfer cannot complete: command_keys/transfers store is not implemented (fail closed); T-CORE-02 HOLD';

export async function acceptTransfer(
  ctx: Tx01CommandContext,
  input: Tx01Input,
): Promise<Result<Tx01Output, Problem>> {
  ctx.trace('accept_transfer_fail_closed', {
    doubleTapOrDifferentKeysWouldCreateSecondTransfer:
      input.doubleTapOrDifferentKeysWouldCreateSecondTransfer,
  });
  if (input.doubleTapOrDifferentKeysWouldCreateSecondTransfer) {
    return err(problem('IDEMPOTENCY_MISMATCH', 409, false, ACCEPT_TRANSFER_IDEMPOTENCY_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, ACCEPT_TRANSFER_UNAVAILABLE_DETAIL));
}
