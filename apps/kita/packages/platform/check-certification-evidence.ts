/**
 * @kita/platform — check-certification-evidence (T-CERT-01).
 *
 * Pure fail-closed checker. Missing acknowledgment/review, scope mismatch,
 * stale evidence, missing sandbox/SDK/device proof, and unsupported cases
 * claimed passed never certify. Never ok:true. Full T-CERT-01 remains HOLD.
 */

import type {
  Cert01CommandContext,
  Cert01Input,
  Cert01Output,
} from '../contracts/src/certification-evidence.ts';
import type { Problem, Result } from '../contracts/src/result.ts';
import { err, problem } from '../contracts/src/result.ts';

export async function checkCertificationEvidence(
  _ctx: Cert01CommandContext,
  input: Cert01Input,
): Promise<Result<Cert01Output, Problem>> {
  if (input.requiredAcknowledgmentOrReviewMissing === true) {
    return err(
      problem(
        'unauthorized',
        403,
        false,
        'T-CERT-01 supplied missing required provider acknowledgment or certification review blocks certification evidence',
      ),
    );
  }
  if (input.scopeMismatch === true) {
    return err(
      problem(
        'stale_or_conflicting_command',
        409,
        false,
        'T-CERT-01 supplied certification scope mismatch blocks certification evidence',
      ),
    );
  }
  if (input.evidenceStale === true) {
    return err(
      problem(
        'stale_or_conflicting_command',
        409,
        false,
        'T-CERT-01 supplied stale certification evidence blocks certification evidence',
      ),
    );
  }
  if (input.requiredSandboxEvidenceMissing === true) {
    return err(
      problem(
        'invalid_request',
        400,
        false,
        'T-CERT-01 supplied missing required real sandbox evidence blocks certification evidence',
      ),
    );
  }
  if (input.requiredSdkDeviceEvidenceMissing === true) {
    return err(
      problem(
        'invalid_request',
        400,
        false,
        'T-CERT-01 supplied missing required SDK or device evidence blocks certification evidence',
      ),
    );
  }
  if (input.unsupportedCaseClaimedPassed === true) {
    return err(
      problem(
        'invalid_request',
        400,
        false,
        'T-CERT-01 supplied unsupported certification case claimed passed blocks certification evidence',
      ),
    );
  }
  return err(
    problem(
      'dependency_unavailable',
      503,
      true,
      'T-CERT-01 checkCertificationEvidence cannot verify scoped candidate/provider/account/method identity, freshness, required acknowledgment or review, real sandbox evidence, SDK/device proof or unsupported-case restrictions: full T-CERT-01 remains HOLD (fail closed)',
    ),
  );
}
