/**
 * @kita/domain — rescreen-delta (T-KYC-05).
 *
 * Pure fail-closed checker. A new list hit stops queued payout before dispatch.
 * Live delta cursor / T-PLAT-05 is not implemented. Never ok:true.
 */

import type { Kyc05Input, Kyc05Output } from '../../contracts/src/compliance.ts';
import type { Problem, Result, WorkerContext } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const RESCREEN_DELTA_HIT_DETAIL =
  'T-KYC-05 new list hit stops queued payout before dispatch';

export const RESCREEN_DELTA_UNAVAILABLE_DETAIL =
  'T-KYC-05 rescreenDelta cannot clear a subject: live list-delta cursor/T-PLAT-05 is not implemented (fail closed)';

export async function rescreenDelta(
  ctx: WorkerContext,
  input: Kyc05Input,
): Promise<Result<Kyc05Output, Problem>> {
  ctx.trace('rescreen_delta_fail_closed', {
    workId: String(ctx.workId),
    attemptGeneration: ctx.attemptGeneration,
    newListHit: input.newListHit,
  });
  if (input.newListHit) {
    return err(problem('COMPLIANCE_HOLD', 409, false, RESCREEN_DELTA_HIT_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, RESCREEN_DELTA_UNAVAILABLE_DETAIL));
}
