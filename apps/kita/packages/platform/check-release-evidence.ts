/**
 * @kita/platform — check-release-evidence (T-RELEASE-01).
 *
 * Pure fail-closed checker. Missing approver/caps/proofs, candidate mismatch,
 * stale evidence, and invalidated provider evidence never assemble a release.
 * Never ok:true. Full T-RELEASE-01 remains HOLD.
 */

import type {
  Release01CommandContext,
  Release01Input,
  Release01Output,
} from '../contracts/src/release.ts';
import type { Problem, Result } from '../contracts/src/result.ts';
import { err, problem } from '../contracts/src/result.ts';

export async function checkReleaseEvidence(
  _ctx: Release01CommandContext,
  input: Release01Input,
): Promise<Result<Release01Output, Problem>> {
  if (input.requiredApproverMissing) {
    return err(
      problem(
        'unauthorized',
        403,
        false,
        'T-RELEASE-01 supplied missing required approver blocks release evidence',
      ),
    );
  }
  if (input.requiredCapsMissing) {
    return err(
      problem(
        'unauthorized',
        403,
        false,
        'T-RELEASE-01 supplied missing required caps blocks release evidence',
      ),
    );
  }
  if (input.gateEvidenceMissing) {
    return err(
      problem(
        'invalid_request',
        400,
        false,
        'T-RELEASE-01 supplied missing gate evidence blocks release evidence',
      ),
    );
  }
  if (input.candidateMismatch) {
    return err(
      problem(
        'stale_or_conflicting_command',
        409,
        false,
        'T-RELEASE-01 supplied candidate mismatch blocks release evidence',
      ),
    );
  }
  if (input.gateEvidenceStale) {
    return err(
      problem(
        'stale_or_conflicting_command',
        409,
        false,
        'T-RELEASE-01 supplied stale gate evidence blocks release evidence',
      ),
    );
  }
  if (input.providerEvidenceInvalidated) {
    return err(
      problem(
        'stale_or_conflicting_command',
        409,
        false,
        'T-RELEASE-01 supplied provider evidence invalidation blocks release evidence',
      ),
    );
  }
  return err(
    problem(
      'dependency_unavailable',
      503,
      true,
      'T-RELEASE-01 checkReleaseEvidence cannot verify exact-candidate proofs, freshness, approvals, caps or provider validity: full T-RELEASE-01 remains HOLD (fail closed)',
    ),
  );
}
