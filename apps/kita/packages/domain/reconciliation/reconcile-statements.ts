/**
 * @kita/domain — reconcile-statements (T-FIN-03).
 *
 * Pure fail-closed checker. Three-way mismatch cannot force a balanced book.
 * Never ok:true. Never post a reconciling journal. T-FIN-01 remains HOLD.
 */

import type { Fin03CommandContext, Fin03Input, Fin03Output } from '../../contracts/src/reconciliation.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const RECONCILE_STATEMENTS_MISMATCH_DETAIL =
  'Three-way mismatch cannot force a balanced book.';

export const RECONCILE_STATEMENTS_UNAVAILABLE_DETAIL =
  'T-FIN-03 reconcileStatements cannot complete: ledger/journals store is not implemented (fail closed); T-FIN-01 HOLD';

export async function reconcileStatements(
  ctx: Fin03CommandContext,
  input: Fin03Input,
): Promise<Result<Fin03Output, Problem>> {
  ctx.trace('reconcile_statements_fail_closed', {
    threeWayMismatchWouldForceBalance: input.threeWayMismatchWouldForceBalance,
  });
  if (input.threeWayMismatchWouldForceBalance) {
    return err(problem('VERSION_CONFLICT', 409, false, RECONCILE_STATEMENTS_MISMATCH_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, RECONCILE_STATEMENTS_UNAVAILABLE_DETAIL));
}
