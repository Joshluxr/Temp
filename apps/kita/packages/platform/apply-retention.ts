/**
 * @kita/platform — apply-retention (T-PLAT-09).
 *
 * Always ok:false. legalHoldActive → POLICY_UNAVAILABLE 409 (do not delete).
 * No hold → 503 dependency_unavailable (workers/PII keys not implemented).
 * No documents/cases writes, journals, money, executeCommand, or KMS.
 */

import type { Plat09Input, Plat09Output, Problem, Result, WorkerContext } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const APPLY_RETENTION_HOLD_DETAIL =
  'T-PLAT-09 legal hold is active: required records must be preserved; deletion is blocked';

export const APPLY_RETENTION_UNAVAILABLE_DETAIL =
  'T-PLAT-09 applyRetention cannot complete deletion or export: retention workers and PII key lifecycle are not implemented (fail closed)';

export async function applyRetention(
  ctx: WorkerContext,
  input: Plat09Input,
): Promise<Result<Plat09Output, Problem>> {
  ctx.trace('apply_retention_fail_closed', {
    workId: String(ctx.workId),
    attemptGeneration: ctx.attemptGeneration,
    legalHoldActive: input.legalHoldActive,
  });
  if (input.legalHoldActive) {
    return err(problem('POLICY_UNAVAILABLE', 409, false, APPLY_RETENTION_HOLD_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, APPLY_RETENTION_UNAVAILABLE_DETAIL));
}
