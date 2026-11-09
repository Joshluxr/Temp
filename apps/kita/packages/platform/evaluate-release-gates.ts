/**
 * @kita/platform — evaluate-release-gates (T-PLAT-10).
 *
 * Always fail closed. Never ok:true. Never claim there is no financial break.
 * Missing evidence → invalid_request. Failing evidence → SECURITY_FAILURE.
 * All-present evidence still 503 dependency_unavailable (DEP-15 not live).
 * No DB, money, executeCommand, or live gate runners.
 */

import type {
  Plat10EvidenceManifest,
  Plat10Input,
  Plat10Output,
  Problem,
  Result,
  WorkerContext,
} from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const EVALUATE_RELEASE_GATES_UNAVAILABLE_DETAIL =
  'T-PLAT-10 evaluateReleaseGates cannot attest launch safety: DEP-15 live gates are not implemented (fail closed)';

const AXES: readonly (keyof Plat10EvidenceManifest)[] = [
  'security',
  'load',
  'accessibility',
  'financial',
];

export async function evaluateReleaseGates(
  ctx: WorkerContext,
  input: Plat10Input,
): Promise<Result<Plat10Output, Problem>> {
  ctx.trace('evaluate_release_gates_fail_closed', {
    workId: String(ctx.workId),
    attemptGeneration: ctx.attemptGeneration,
  });

  for (const axis of AXES) {
    if (input.evidence[axis] === 'missing') {
      return err(
        problem(
          'invalid_request',
          400,
          false,
          `T-PLAT-10 blocking: ${axis} evidence missing`,
        ),
      );
    }
  }
  for (const axis of AXES) {
    if (input.evidence[axis] === 'failing') {
      return err(
        problem(
          'SECURITY_FAILURE',
          409,
          false,
          `T-PLAT-10 blocking: ${axis} evidence failing`,
        ),
      );
    }
  }
  return err(problem('dependency_unavailable', 503, true, EVALUATE_RELEASE_GATES_UNAVAILABLE_DETAIL));
}
