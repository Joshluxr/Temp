/**
 * @kita/domain — close-period (T-FIN-07).
 *
 * Pure fail-closed checker. Closed period cannot receive unauthorized
 * backdated posting. Never ok:true. Never post. T-FIN-01 remains HOLD.
 */

import type { Fin07CommandContext, Fin07Input, Fin07Output } from '../../contracts/src/ledger.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const CLOSE_PERIOD_BACKDATE_DETAIL =
  'Closed period cannot receive unauthorized backdated posting.';

export const CLOSE_PERIOD_UNAVAILABLE_DETAIL =
  'T-FIN-07 closePeriod cannot complete: ledger period store is not implemented (fail closed); T-FIN-01 HOLD';

export async function closePeriod(
  ctx: Fin07CommandContext,
  input: Fin07Input,
): Promise<Result<Fin07Output, Problem>> {
  ctx.trace('close_period_fail_closed', {
    unauthorizedBackdatedPostingIntoClosedPeriod: input.unauthorizedBackdatedPostingIntoClosedPeriod,
  });
  if (input.unauthorizedBackdatedPostingIntoClosedPeriod) {
    return err(problem('POLICY_UNAVAILABLE', 409, false, CLOSE_PERIOD_BACKDATE_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, CLOSE_PERIOD_UNAVAILABLE_DETAIL));
}
