/**
 * @kita/domain — execute-batch (T-EXT-04).
 *
 * Pure fail-closed checker. Stale approval, paid-item retry, and uncertain
 * submission never pay out. Never ok:true. T-CORE-02, T-LEDGER-02, and
 * DEP-12 remain HOLD.
 */

import type { Ext04CommandContext, Ext04Input, Ext04Output } from '../../contracts/src/business.ts';
import type { Problem, Result } from '../../contracts/src/result.ts';
import { err, problem } from '../../contracts/src/result.ts';

export const EXECUTE_BATCH_UNAUTHORIZED_DETAIL =
  'T-EXT-04 batch execution is not authorized';

export const EXECUTE_BATCH_STALE_DETAIL =
  'T-EXT-04 batch approval is stale or no longer binds the ordered items and currency totals';

export const EXECUTE_BATCH_LIMIT_DETAIL =
  'T-EXT-04 supplied item or aggregate limit breach blocks batch execution';

export const EXECUTE_BATCH_PAID_RETRY_DETAIL =
  'T-EXT-04 a paid batch item cannot be retried';

export const EXECUTE_BATCH_UNCERTAIN_DETAIL =
  'T-EXT-04 item submission remains uncertain; no retry is authorized';

export const EXECUTE_BATCH_UNAVAILABLE_DETAIL =
  'T-EXT-04 executeBatch cannot persist batch or item state or grant payout authority: T-CORE-02 and T-LEDGER-02 remain HOLD; DEP-12 is not cleared (fail closed)';

export async function executeBatch(
  _ctx: Ext04CommandContext,
  input: Ext04Input,
): Promise<Result<Ext04Output, Problem>> {
  if (input.unauthorizedBatchExecution) {
    return err(problem('unauthorized', 403, false, EXECUTE_BATCH_UNAUTHORIZED_DETAIL));
  }
  if (input.approvalStale) {
    return err(problem('APPROVAL_STALE', 409, false, EXECUTE_BATCH_STALE_DETAIL));
  }
  if (input.limitExceeded) {
    return err(problem('LIMIT_EXCEEDED', 409, false, EXECUTE_BATCH_LIMIT_DETAIL));
  }
  if (input.paidItemWouldBeRetried) {
    return err(problem('stale_or_conflicting_command', 409, false, EXECUTE_BATCH_PAID_RETRY_DETAIL));
  }
  if (input.itemSubmissionUncertain) {
    return err(problem('PROVIDER_OUTCOME_UNKNOWN', 409, false, EXECUTE_BATCH_UNCERTAIN_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, EXECUTE_BATCH_UNAVAILABLE_DETAIL));
}
