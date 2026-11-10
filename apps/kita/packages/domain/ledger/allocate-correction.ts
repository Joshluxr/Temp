/**
 * @kita/domain — allocate-correction (T-FIN-02).
 *
 * Pure fail-closed checker. Cumulative partial fees must sum exactly on final
 * refund. Never ok:true. Never edit the original journal. T-FIN-01 remains HOLD.
 */

import type { Fin02CommandContext, Fin02Input, Fin02Output } from '../../contracts/src/ledger.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const ALLOCATE_CORRECTION_FEE_SUM_DETAIL =
  'Cumulative partial fees must sum exactly on final refund.';

export const ALLOCATE_CORRECTION_UNAVAILABLE_DETAIL =
  'T-FIN-02 allocateCorrection cannot complete: journals store is not implemented (fail closed); T-FIN-01 HOLD';

export async function allocateCorrection(
  ctx: Fin02CommandContext,
  input: Fin02Input,
): Promise<Result<Fin02Output, Problem>> {
  ctx.trace('allocate_correction_fail_closed', {
    cumulativePartialFeesDoNotSumOnFinalRefund: input.cumulativePartialFeesDoNotSumOnFinalRefund,
  });
  if (input.cumulativePartialFeesDoNotSumOnFinalRefund) {
    return err(problem('LIMIT_EXCEEDED', 409, false, ALLOCATE_CORRECTION_FEE_SUM_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, ALLOCATE_CORRECTION_UNAVAILABLE_DETAIL));
}
