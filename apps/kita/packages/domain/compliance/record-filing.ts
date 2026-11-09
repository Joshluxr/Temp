/**
 * @kita/domain — record-filing (T-KYC-07).
 *
 * Pure fail-closed checker. Support cannot read AML filings or confidential
 * rationale. Case ACL/filing store is not implemented. Never ok:true.
 * Never echo filing body into problems or traces.
 */

import type { Kyc07Input, Kyc07Output } from '../../contracts/src/compliance.ts';
import type { Problem, Result, WorkerContext } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const RECORD_FILING_SUPPORT_DENIED_DETAIL =
  'T-KYC-07 support cannot read AML filing or confidential rationale';

export const RECORD_FILING_UNAVAILABLE_DETAIL =
  'T-KYC-07 recordFiling cannot store or return a filing: case ACL/filing store is not implemented (fail closed)';

export async function recordFiling(
  ctx: WorkerContext,
  input: Kyc07Input,
): Promise<Result<Kyc07Output, Problem>> {
  ctx.trace('record_filing_fail_closed', {
    workId: String(ctx.workId),
    attemptGeneration: ctx.attemptGeneration,
    actorRole: input.actorRole,
  });
  if (input.actorRole === 'support') {
    return err(problem('unauthorized', 403, false, RECORD_FILING_SUPPORT_DENIED_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, RECORD_FILING_UNAVAILABLE_DETAIL));
}
