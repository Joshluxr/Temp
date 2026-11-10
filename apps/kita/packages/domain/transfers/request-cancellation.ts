/**
 * @kita/domain — request-cancellation (T-TX-05).
 *
 * Pure fail-closed checker. Receipt timestamp and actual delivery determine
 * eligible remedy. Never ok:true. Never rewrite the clock. T-TX-06 remains HOLD.
 */

import type { Tx05CommandContext, Tx05Input, Tx05Output } from '../../contracts/src/transfers.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const REQUEST_CANCELLATION_TIMESTAMP_DETAIL =
  'Receipt timestamp and actual delivery determine eligible remedy.';

export const REQUEST_CANCELLATION_UNAVAILABLE_DETAIL =
  'T-TX-05 requestCancellation cannot complete: cases/holds store is not implemented (fail closed); T-TX-06 HOLD';

export async function requestCancellation(
  ctx: Tx05CommandContext,
  input: Tx05Input,
): Promise<Result<Tx05Output, Problem>> {
  ctx.trace('request_cancellation_fail_closed', {
    rewrittenReceiptTimestampWouldChangeEligibleRemedy:
      input.rewrittenReceiptTimestampWouldChangeEligibleRemedy,
  });
  if (input.rewrittenReceiptTimestampWouldChangeEligibleRemedy) {
    return err(problem('POLICY_UNAVAILABLE', 409, false, REQUEST_CANCELLATION_TIMESTAMP_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, REQUEST_CANCELLATION_UNAVAILABLE_DETAIL));
}
