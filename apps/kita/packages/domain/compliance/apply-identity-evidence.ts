/**
 * @kita/domain — apply-identity-evidence (T-KYC-02).
 *
 * Pure fail-closed checker. Later adverse decisions block new payout.
 * Live identity decision store is not implemented. Never ok:true.
 */

import type { Kyc02Input, Kyc02Output } from '../../contracts/src/compliance.ts';
import type { Problem, Result, WorkerContext } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const APPLY_IDENTITY_ADVERSE_DETAIL =
  'T-KYC-02 later adverse identity decision blocks new payout';

export const APPLY_IDENTITY_UNAVAILABLE_DETAIL =
  'T-KYC-02 applyIdentityEvidence cannot record a decision: identity store/T-KYC-01 live provider is not implemented (fail closed)';

export async function applyIdentityEvidence(
  ctx: WorkerContext,
  input: Kyc02Input,
): Promise<Result<Kyc02Output, Problem>> {
  ctx.trace('apply_identity_evidence_fail_closed', {
    workId: String(ctx.workId),
    attemptGeneration: ctx.attemptGeneration,
    laterAdverseDecision: input.laterAdverseDecision,
  });
  if (input.laterAdverseDecision) {
    return err(problem('COMPLIANCE_HOLD', 409, false, APPLY_IDENTITY_ADVERSE_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, APPLY_IDENTITY_UNAVAILABLE_DETAIL));
}
