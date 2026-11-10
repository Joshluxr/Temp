/**
 * @kita/platform — check-integration-evidence (T-INTEGRATE-01).
 *
 * Pure fail-closed checker. Missing review, candidate mismatch/staleness,
 * missing implementation, skipped scenario, and unexplained financial break
 * never accept integration. Never ok:true. Full T-INTEGRATE-01 remains HOLD.
 */

import type {
  Integrate01CommandContext,
  Integrate01Input,
  Integrate01Output,
} from '../contracts/src/integration-evidence.ts';
import type { Problem, Result } from '../contracts/src/result.ts';
import { err, problem } from '../contracts/src/result.ts';

export async function checkIntegrationEvidence(
  _ctx: Integrate01CommandContext,
  input: Integrate01Input,
): Promise<Result<Integrate01Output, Problem>> {
  if (input.requiredReviewMissing === true) {
    return err(
      problem(
        'unauthorized',
        403,
        false,
        'T-INTEGRATE-01 supplied missing required architect or exact-head Sol integration review blocks integration evidence',
      ),
    );
  }
  if (input.candidateMismatch === true) {
    return err(
      problem(
        'stale_or_conflicting_command',
        409,
        false,
        'T-INTEGRATE-01 supplied candidate mismatch blocks integration evidence',
      ),
    );
  }
  if (input.candidateStale === true) {
    return err(
      problem(
        'stale_or_conflicting_command',
        409,
        false,
        'T-INTEGRATE-01 supplied stale candidate blocks integration evidence',
      ),
    );
  }
  if (input.requiredImplementationMissing === true) {
    return err(
      problem(
        'invalid_request',
        400,
        false,
        'T-INTEGRATE-01 supplied missing required implementation blocks integration evidence',
      ),
    );
  }
  if (input.requiredScenarioSkipped === true) {
    return err(
      problem(
        'invalid_request',
        400,
        false,
        'T-INTEGRATE-01 supplied skipped required scenario blocks integration evidence',
      ),
    );
  }
  if (input.unexplainedFinancialBreakPresent === true) {
    return err(
      problem(
        'invalid_request',
        400,
        false,
        'T-INTEGRATE-01 supplied unexplained financial break blocks integration evidence',
      ),
    );
  }
  return err(
    problem(
      'dependency_unavailable',
      503,
      true,
      'T-INTEGRATE-01 checkIntegrationEvidence cannot verify exact-candidate identity, freshness, review, implementation connectivity, scenario execution or financial-break disposition: full T-INTEGRATE-01 remains HOLD (fail closed)',
    ),
  );
}
