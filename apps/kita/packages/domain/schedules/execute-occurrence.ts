/**
 * @kita/domain — execute-occurrence (T-TX-10).
 *
 * Pure fail-closed checker. DST retry produces one authorized occurrence.
 * Never ok:true. Never execute. T-CORE-02 remains HOLD.
 */

import type { Tx10CommandContext, Tx10Input, Tx10Output } from '../../contracts/src/schedules.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const EXECUTE_OCCURRENCE_DST_DETAIL =
  'DST retry produces one authorized occurrence.';

export const EXECUTE_OCCURRENCE_UNAVAILABLE_DETAIL =
  'T-TX-10 executeOccurrence cannot complete: schedules store is not implemented (fail closed); T-CORE-02 HOLD';

export async function executeOccurrence(
  ctx: Tx10CommandContext,
  input: Tx10Input,
): Promise<Result<Tx10Output, Problem>> {
  ctx.trace('execute_occurrence_fail_closed', {
    dstRetryWouldCreateSecondOccurrence: input.dstRetryWouldCreateSecondOccurrence,
  });
  if (input.dstRetryWouldCreateSecondOccurrence) {
    return err(problem('LIMIT_EXCEEDED', 409, false, EXECUTE_OCCURRENCE_DST_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, EXECUTE_OCCURRENCE_UNAVAILABLE_DETAIL));
}
