/**
 * @kita/domain — apply-bill-posting (T-PAY-06).
 *
 * Pure fail-closed checker. Aggregator accepted does not mark bill paid.
 * Never ok:true. Never post a payout.
 */

import type { Pay06CommandContext, Pay06Input, Pay06Output } from '../../contracts/src/payouts.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const APPLY_BILL_POSTING_AGGREGATOR_DETAIL =
  'T-PAY-06 aggregator accepted does not mark bill paid';

export const APPLY_BILL_POSTING_UNAVAILABLE_DETAIL =
  'T-PAY-06 applyBillPosting cannot complete: bill_payments/posting-proof store is not implemented (fail closed)';

export async function applyBillPosting(
  ctx: Pay06CommandContext,
  input: Pay06Input,
): Promise<Result<Pay06Output, Problem>> {
  ctx.trace('apply_bill_posting_fail_closed', {
    aggregatorAcceptedMarksBillPaid: input.aggregatorAcceptedMarksBillPaid,
  });
  if (input.aggregatorAcceptedMarksBillPaid) {
    return err(problem('CAPABILITY_UNAVAILABLE', 409, false, APPLY_BILL_POSTING_AGGREGATOR_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, APPLY_BILL_POSTING_UNAVAILABLE_DETAIL));
}
