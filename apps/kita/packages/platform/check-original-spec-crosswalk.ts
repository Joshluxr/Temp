/**
 * @kita/platform — check-original-spec-crosswalk (T-SCOPE-01).
 *
 * Pure fail-closed checker. Missing review, missing original spec, duplicates,
 * conflicts, and unmapped requirements/scenarios never accept scope.
 * Never ok:true. Full T-SCOPE-01 remains HOLD.
 */

import type {
  Scope01CommandContext,
  Scope01Input,
  Scope01Output,
} from '../contracts/src/original-spec-crosswalk.ts';
import type { Problem, Result } from '../contracts/src/result.ts';
import { err, problem } from '../contracts/src/result.ts';

export async function checkOriginalSpecCrosswalk(
  _ctx: Scope01CommandContext,
  input: Scope01Input,
): Promise<Result<Scope01Output, Problem>> {
  if (input.requiredReviewMissing) {
    return err(
      problem(
        'unauthorized',
        403,
        false,
        'T-SCOPE-01 supplied missing required Product or Sol scope review blocks original-spec crosswalk',
      ),
    );
  }
  if (input.originalSpecMissing) {
    return err(
      problem(
        'dependency_unavailable',
        503,
        true,
        'T-SCOPE-01 supplied missing original specification blocks original-spec crosswalk',
      ),
    );
  }
  if (input.duplicateOriginalRequirementPresent) {
    return err(
      problem(
        'stale_or_conflicting_command',
        409,
        false,
        'T-SCOPE-01 supplied duplicate original requirement blocks original-spec crosswalk',
      ),
    );
  }
  if (input.crosswalkConflictPresent) {
    return err(
      problem(
        'stale_or_conflicting_command',
        409,
        false,
        'T-SCOPE-01 supplied conflicting mapping blocks original-spec crosswalk',
      ),
    );
  }
  if (input.unmappedOriginalRequirementPresent) {
    return err(
      problem(
        'invalid_request',
        400,
        false,
        'T-SCOPE-01 supplied unmapped original requirement blocks original-spec crosswalk',
      ),
    );
  }
  if (input.unmappedRequiredScenarioPresent) {
    return err(
      problem(
        'invalid_request',
        400,
        false,
        'T-SCOPE-01 supplied unmapped required scenario blocks original-spec crosswalk',
      ),
    );
  }
  return err(
    problem(
      'dependency_unavailable',
      503,
      true,
      'T-SCOPE-01 checkOriginalSpecCrosswalk cannot verify original sources, unique mappings, conflicts, requirement or scenario coverage, source hashes or Product/Sol review: full T-SCOPE-01 remains HOLD (fail closed)',
    ),
  );
}
