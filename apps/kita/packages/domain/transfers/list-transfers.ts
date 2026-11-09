/**
 * @kita/domain — list-transfers (T-TX-03).
 *
 * Pure fail-closed checker. Stable cursor cannot expose another customer records.
 * Never ok:true. Do not fabricate transfer history.
 */

import type { Tx03Input, Tx03Output, Tx08CommandContext } from '../../contracts/src/transfers.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const LIST_TRANSFERS_SCOPED_DETAIL =
  'T-TX-03 stable cursor cannot expose another customer records';

export const LIST_TRANSFERS_UNAVAILABLE_DETAIL =
  'T-TX-03 listTransfers cannot complete: transfer history store is not implemented (fail closed); T-TX-02 HOLD';

export async function listTransfers(
  ctx: Tx08CommandContext,
  input: Tx03Input,
): Promise<Result<Tx03Output, Problem>> {
  ctx.trace('list_transfers_fail_closed', {
    cursorExposesOtherCustomer: input.cursorExposesOtherCustomer,
  });
  if (input.cursorExposesOtherCustomer) {
    return err(problem('unauthorized', 403, false, LIST_TRANSFERS_SCOPED_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, LIST_TRANSFERS_UNAVAILABLE_DETAIL));
}
