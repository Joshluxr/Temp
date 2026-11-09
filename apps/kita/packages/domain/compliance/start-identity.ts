/**
 * @kita/domain — start-identity (T-KYC-01).
 *
 * Pure fail-closed checker. Capture callback alone never approves a customer.
 * Hosted session / T-ADAPTER-01 is not implemented. Never ok:true.
 */

import type { Kyc01Input, Kyc01Output } from '../../contracts/src/compliance.ts';
import type { Problem, Result, WorkerContext } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const START_IDENTITY_CALLBACK_NOT_APPROVAL_DETAIL =
  'T-KYC-01 capture callback alone never approves a customer';

export const START_IDENTITY_UNAVAILABLE_DETAIL =
  'T-KYC-01 startIdentity cannot open a hosted capture session: T-ADAPTER-01 is not implemented (fail closed)';

export async function startIdentity(
  ctx: WorkerContext,
  input: Kyc01Input,
): Promise<Result<Kyc01Output, Problem>> {
  ctx.trace('start_identity_fail_closed', {
    workId: String(ctx.workId),
    attemptGeneration: ctx.attemptGeneration,
    captureCallbackReceived: input.captureCallbackReceived,
  });
  if (input.captureCallbackReceived) {
    return err(problem('COMPLIANCE_HOLD', 409, false, START_IDENTITY_CALLBACK_NOT_APPROVAL_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, START_IDENTITY_UNAVAILABLE_DETAIL));
}
