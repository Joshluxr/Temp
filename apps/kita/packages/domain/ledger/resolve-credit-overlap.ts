/**
 * @kita/domain — resolve-credit-overlap (T-FIN-08).
 *
 * Pure fail-closed checker. No second automatic customer credit for the same
 * entitlement. Never ok:true. Never credit. T-TX-06 remains HOLD.
 */

import type { Fin08CommandContext, Fin08Input, Fin08Output } from '../../contracts/src/ledger.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const RESOLVE_CREDIT_OVERLAP_SECOND_CREDIT_DETAIL =
  'No second automatic customer credit for the same entitlement.';

export const RESOLVE_CREDIT_OVERLAP_UNAVAILABLE_DETAIL =
  'T-FIN-08 resolveCreditOverlap cannot complete: refund/dispute store is not implemented (fail closed); T-TX-06 HOLD';

export async function resolveCreditOverlap(
  ctx: Fin08CommandContext,
  input: Fin08Input,
): Promise<Result<Fin08Output, Problem>> {
  ctx.trace('resolve_credit_overlap_fail_closed', {
    secondAutomaticCreditSameEntitlement: input.secondAutomaticCreditSameEntitlement,
  });
  if (input.secondAutomaticCreditSameEntitlement) {
    return err(problem('POLICY_UNAVAILABLE', 409, false, RESOLVE_CREDIT_OVERLAP_SECOND_CREDIT_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, RESOLVE_CREDIT_OVERLAP_UNAVAILABLE_DETAIL));
}
