/**
 * @kita/domain — quarantine-upload (T-KYC-03).
 *
 * Pure fail-closed checker. Infected uploads never reach an analyst viewer.
 * Scan pipeline is not implemented. Never ok:true. Never an access URL.
 */

import type { Kyc03Input, Kyc03Output } from '../../contracts/src/compliance.ts';
import type { Problem, Result, WorkerContext } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const QUARANTINE_UPLOAD_INFECTED_DETAIL =
  'T-KYC-03 infected upload never reaches analyst viewer';

export const QUARANTINE_UPLOAD_UNAVAILABLE_DETAIL =
  'T-KYC-03 quarantineUpload cannot grant scanned access: malware scan pipeline is not implemented (fail closed)';

export async function quarantineUpload(
  ctx: WorkerContext,
  input: Kyc03Input,
): Promise<Result<Kyc03Output, Problem>> {
  ctx.trace('quarantine_upload_fail_closed', {
    workId: String(ctx.workId),
    attemptGeneration: ctx.attemptGeneration,
    infectedOrMalicious: input.infectedOrMalicious,
  });
  if (input.infectedOrMalicious) {
    return err(problem('SECURITY_FAILURE', 409, false, QUARANTINE_UPLOAD_INFECTED_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, QUARANTINE_UPLOAD_UNAVAILABLE_DETAIL));
}
