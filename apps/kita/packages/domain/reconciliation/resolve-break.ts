/**
 * @kita/domain — resolve-break (T-FIN-04).
 *
 * Pure fail-closed checker. Force match is impossible; correction must link
 * an approved journal. Never ok:true. Never force-match. T-FIN-01 remains HOLD.
 */

import type { Fin04CommandContext, Fin04Input, Fin04Output } from '../../contracts/src/reconciliation.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const RESOLVE_BREAK_FORCE_MATCH_DETAIL =
  'Force match is impossible; correction must link an approved journal.';

export const RESOLVE_BREAK_UNAVAILABLE_DETAIL =
  'T-FIN-04 resolveBreak cannot complete: ledger/journals store is not implemented (fail closed); T-FIN-01 HOLD';

export async function resolveBreak(
  ctx: Fin04CommandContext,
  input: Fin04Input,
): Promise<Result<Fin04Output, Problem>> {
  ctx.trace('resolve_break_fail_closed', {
    forceMatchWithoutApprovedJournal: input.forceMatchWithoutApprovedJournal,
  });
  if (input.forceMatchWithoutApprovedJournal) {
    return err(problem('POLICY_UNAVAILABLE', 409, false, RESOLVE_BREAK_FORCE_MATCH_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, RESOLVE_BREAK_UNAVAILABLE_DETAIL));
}
