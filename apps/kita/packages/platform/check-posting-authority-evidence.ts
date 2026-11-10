/**
 * @kita/platform — check-posting-authority-evidence (T-LEDGER-02).
 *
 * Pure fail-closed checker. Missing review, identity/payload mismatch,
 * unproven template/period safety, unproven correction/atomicity, and missing
 * execution evidence never accept posting. Never ok:true.
 * Full T-LEDGER-02 remains HOLD. No postBusinessEvent or closePeriod.
 */

import type {
  Ledger02CommandContext,
  Ledger02Input,
  Ledger02Output,
} from '../contracts/src/posting-authority-evidence.ts';
import type { Problem, Result } from '../contracts/src/result.ts';
import { err, problem } from '../contracts/src/result.ts';

export async function checkPostingAuthorityEvidence(
  _ctx: Ledger02CommandContext,
  input: Ledger02Input,
): Promise<Result<Ledger02Output, Problem>> {
  if (input.requiredReviewMissing === true) {
    return err(
      problem(
        'unauthorized',
        403,
        false,
        'T-LEDGER-02 supplied missing required architect, Controller or independent review blocks posting authority evidence',
      ),
    );
  }
  if (input.postingIdentityOrPayloadMismatch === true) {
    return err(
      problem(
        'stale_or_conflicting_command',
        409,
        false,
        'T-LEDGER-02 supplied posting identity or immutable payload mismatch blocks posting authority evidence',
      ),
    );
  }
  if (input.templateEvidenceOrPeriodSafetyUnproven === true) {
    return err(
      problem(
        'invalid_request',
        400,
        false,
        'T-LEDGER-02 supplied unproven approved template, active evidence or period safety blocks posting authority evidence',
      ),
    );
  }
  if (input.correctionAllocationOrAtomicitySafetyUnproven === true) {
    return err(
      problem(
        'invalid_request',
        400,
        false,
        'T-LEDGER-02 supplied unproven correction allocation, nonnegative balance or atomic posting safety blocks posting authority evidence',
      ),
    );
  }
  if (input.requiredEvidenceMissing === true) {
    return err(
      problem(
        'invalid_request',
        400,
        false,
        'T-LEDGER-02 supplied missing required posting authority execution evidence blocks posting authority evidence',
      ),
    );
  }
  return err(
    problem(
      'dependency_unavailable',
      503,
      true,
      'T-LEDGER-02 checkPostingAuthorityEvidence cannot verify scoped event identity or replay, approved templates and active evidence, open nonoverlapping periods, balanced immutable journals, nonnegative balances or cumulative correction/allocation limits, event-key serialization or atomic posting, independent reconstruction or current Controller review and execution evidence: full T-LEDGER-02, T-FIN-01 and T-CORE-02 remain HOLD (fail closed)',
    ),
  );
}
