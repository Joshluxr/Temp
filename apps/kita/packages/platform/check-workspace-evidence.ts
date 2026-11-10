/**
 * @kita/platform — check-workspace-evidence (T-BASE-01).
 *
 * Pure fail-closed checker. Archive overlap, unrelated root overlap, path
 * traversal, batch mismatch, and handoff hash mismatch never accept a
 * workspace. Never ok:true. Full T-BASE-01 remains HOLD.
 */

import type { Base01CommandContext, Base01Input, Base01Output } from '../contracts/src/workspace.ts';
import type { Problem, Result } from '../contracts/src/result.ts';
import { err, problem } from '../contracts/src/result.ts';

export async function checkWorkspaceEvidence(
  _ctx: Base01CommandContext,
  input: Base01Input,
): Promise<Result<Base01Output, Problem>> {
  if (input.sourceArchiveOverlapPresent) {
    return err(
      problem(
        'unauthorized',
        403,
        false,
        'T-BASE-01 supplied source archive overlap blocks workspace evidence',
      ),
    );
  }
  if (input.unrelatedRootOverlapPresent) {
    return err(
      problem(
        'unauthorized',
        403,
        false,
        'T-BASE-01 supplied unrelated root overlap blocks workspace evidence',
      ),
    );
  }
  if (input.pathTraversalPresent) {
    return err(
      problem(
        'invalid_request',
        400,
        false,
        'T-BASE-01 supplied path traversal blocks workspace evidence',
      ),
    );
  }
  if (input.batchScopeMismatch) {
    return err(
      problem(
        'unauthorized',
        403,
        false,
        'T-BASE-01 supplied batch scope mismatch blocks workspace evidence',
      ),
    );
  }
  if (input.handoffHashMismatch) {
    return err(
      problem(
        'stale_or_conflicting_command',
        409,
        false,
        'T-BASE-01 supplied handoff hash mismatch blocks workspace evidence',
      ),
    );
  }
  return err(
    problem(
      'dependency_unavailable',
      503,
      true,
      'T-BASE-01 checkWorkspaceEvidence cannot verify workspace isolation, path safety, batch boundaries or handoff hashes: full T-BASE-01 remains HOLD (fail closed)',
    ),
  );
}
