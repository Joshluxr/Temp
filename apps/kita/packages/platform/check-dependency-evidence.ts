/**
 * @kita/platform — check-dependency-evidence (T-DEPEND-01).
 *
 * Pure fail-closed checker. Missing approval/review, scope mismatch,
 * stale/revoked evidence, rejected dependency, and missing evidence never
 * enable a capability. Never ok:true. Full T-DEPEND-01 remains HOLD.
 */

import type {
  Depend01CommandContext,
  Depend01Input,
  Depend01Output,
} from '../contracts/src/dependency-evidence.ts';
import type { Problem, Result } from '../contracts/src/result.ts';
import { err, problem } from '../contracts/src/result.ts';

export async function checkDependencyEvidence(
  _ctx: Depend01CommandContext,
  input: Depend01Input,
): Promise<Result<Depend01Output, Problem>> {
  if (input.requiredApprovalOrReviewMissing === true) {
    return err(
      problem(
        'unauthorized',
        403,
        false,
        'T-DEPEND-01 supplied missing required owner/counsel/Finance approval or independent review blocks dependency evidence',
      ),
    );
  }
  if (input.scopeMismatch === true) {
    return err(
      problem(
        'stale_or_conflicting_command',
        409,
        false,
        'T-DEPEND-01 supplied dependency scope mismatch blocks dependency evidence',
      ),
    );
  }
  if (input.evidenceStaleOrRevoked === true) {
    return err(
      problem(
        'stale_or_conflicting_command',
        409,
        false,
        'T-DEPEND-01 supplied stale, expired or revoked dependency evidence blocks dependency evidence',
      ),
    );
  }
  if (input.dependencyRejected === true) {
    return err(
      problem(
        'invalid_request',
        400,
        false,
        'T-DEPEND-01 supplied rejected dependency blocks dependency evidence',
      ),
    );
  }
  if (input.requiredEvidenceMissing === true) {
    return err(
      problem(
        'invalid_request',
        400,
        false,
        'T-DEPEND-01 supplied missing required dependency evidence blocks dependency evidence',
      ),
    );
  }
  return err(
    problem(
      'dependency_unavailable',
      503,
      true,
      'T-DEPEND-01 checkDependencyEvidence cannot verify DEP-00-15 applicability, scoped evidence, current owner/counsel/Finance approvals or independent review, freshness, rejection status or activation conditions: full T-DEPEND-01 remains HOLD (fail closed)',
    ),
  );
}
