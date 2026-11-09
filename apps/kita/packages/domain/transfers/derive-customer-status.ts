/**
 * @kita/domain — derive-customer-status (T-TX-02).
 *
 * Pure fail-closed projection checker. Late return preserves paid history.
 * Never ok:true. Never authorize money from a projection. T-TX-01 remains HOLD.
 */

import type { Tx02Input, Tx02Output, Tx08CommandContext } from '../../contracts/src/transfers.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const DERIVE_CUSTOMER_STATUS_HISTORY_DETAIL =
  'T-TX-02 late return preserves paid history';

export const DERIVE_CUSTOMER_STATUS_UNAVAILABLE_DETAIL =
  'T-TX-02 deriveCustomerStatus cannot complete: transfer_events store is not implemented (fail closed); T-TX-01 HOLD';

export async function deriveCustomerStatus(
  ctx: Tx08CommandContext,
  input: Tx02Input,
): Promise<Result<Tx02Output, Problem>> {
  ctx.trace('derive_customer_status_fail_closed', {
    lateReturnErasesPaidHistory: input.lateReturnErasesPaidHistory,
  });
  if (input.lateReturnErasesPaidHistory) {
    return err(problem('POLICY_UNAVAILABLE', 409, false, DERIVE_CUSTOMER_STATUS_HISTORY_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, DERIVE_CUSTOMER_STATUS_UNAVAILABLE_DETAIL));
}
