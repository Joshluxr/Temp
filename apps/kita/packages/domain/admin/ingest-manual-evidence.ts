/**
 * @kita/domain — ingest-manual-evidence (T-ADM-07).
 *
 * Pure fail-closed checker. No manual paid result without verified evidence
 * and reviewer. Never ok:true. Never mark paid.
 */

import type { Adm01CommandContext, Adm07Input, Adm07Output } from '../../contracts/src/admin.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const INGEST_MANUAL_EVIDENCE_REQUIRED_DETAIL =
  'T-ADM-07 no manual paid result without verified evidence and reviewer';

export const INGEST_MANUAL_EVIDENCE_UNAVAILABLE_DETAIL =
  'T-ADM-07 ingestManualEvidence cannot mark paid: evidence mapping/T-PLAT-04 live ingest is not implemented (fail closed)';

export async function ingestManualEvidence(
  ctx: Adm01CommandContext,
  input: Adm07Input,
): Promise<Result<Adm07Output, Problem>> {
  ctx.trace('ingest_manual_evidence_fail_closed', {
    missingVerifiedEvidence: input.missingVerifiedEvidence,
    missingReviewer: input.missingReviewer,
  });
  if (input.missingVerifiedEvidence || input.missingReviewer) {
    return err(problem('APPROVAL_REQUIRED', 409, false, INGEST_MANUAL_EVIDENCE_REQUIRED_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, INGEST_MANUAL_EVIDENCE_UNAVAILABLE_DETAIL));
}
