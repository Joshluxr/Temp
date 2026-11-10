/**
 * @kita/platform — check-core-evidence (T-CORE-01).
 *
 * Pure fail-closed checker. Missing review, composition mismatch, unsafe
 * bindings, unproven transaction/pool safety, and missing execution evidence
 * never accept core runtime. Never ok:true. Full T-CORE-01 remains HOLD.
 */

import type { Core01CommandContext, Core01Input, Core01Output } from '../contracts/src/core-evidence.ts';
import type { Problem, Result } from '../contracts/src/result.ts';
import { err, problem } from '../contracts/src/result.ts';

export async function checkCoreEvidence(
  _ctx: Core01CommandContext,
  input: Core01Input,
): Promise<Result<Core01Output, Problem>> {
  if (input.requiredReviewMissing === true) {
    return err(
      problem(
        'unauthorized',
        403,
        false,
        'T-CORE-01 supplied missing required architect or independent review blocks core evidence',
      ),
    );
  }
  if (input.compositionBoundaryMismatch === true) {
    return err(
      problem(
        'stale_or_conflicting_command',
        409,
        false,
        'T-CORE-01 supplied target/API/server-client composition boundary mismatch blocks core evidence',
      ),
    );
  }
  if (input.runtimeBindingsMissingOrUnsafe === true) {
    return err(
      problem(
        'invalid_request',
        400,
        false,
        'T-CORE-01 supplied missing or unsafe runtime bindings block core evidence',
      ),
    );
  }
  if (input.transactionOrPoolSafetyUnproven === true) {
    return err(
      problem(
        'invalid_request',
        400,
        false,
        'T-CORE-01 supplied unproven transaction or pool safety blocks core evidence',
      ),
    );
  }
  if (input.requiredEvidenceMissing === true) {
    return err(
      problem(
        'invalid_request',
        400,
        false,
        'T-CORE-01 supplied missing required core execution evidence blocks core evidence',
      ),
    );
  }
  return err(
    problem(
      'dependency_unavailable',
      503,
      true,
      'T-CORE-01 checkCoreEvidence cannot verify target/API/server-client boundaries, safe runtime bindings, pool isolation, serializable rollback/commit/retry/cleanup behavior, least-privilege roles or current independent review and execution evidence: full T-CORE-01 remains HOLD (fail closed)',
    ),
  );
}
