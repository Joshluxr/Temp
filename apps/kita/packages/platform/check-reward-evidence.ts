/**
 * @kita/platform — check-reward-evidence (T-REWARD-01).
 *
 * Pure fail-closed checker. Missing review, identity/payload mismatch,
 * unproven conservation/lot safety, unproven reversal/provision/atomicity,
 * and missing execution evidence never accept rewards. Never ok:true.
 * Full T-REWARD-01 remains HOLD. No postPoints.
 */

import type {
  Reward01CommandContext,
  Reward01Input,
  Reward01Output,
} from '../contracts/src/reward-evidence.ts';
import type { Problem, Result } from '../contracts/src/result.ts';
import { err, problem } from '../contracts/src/result.ts';

export async function checkRewardEvidence(
  _ctx: Reward01CommandContext,
  input: Reward01Input,
): Promise<Result<Reward01Output, Problem>> {
  if (input.requiredReviewMissing === true) {
    return err(
      problem(
        'unauthorized',
        403,
        false,
        'T-REWARD-01 supplied missing required architect, Finance, Controller or independent review blocks reward evidence',
      ),
    );
  }
  if (input.rewardIdentityOrPayloadMismatch === true) {
    return err(
      problem(
        'stale_or_conflicting_command',
        409,
        false,
        'T-REWARD-01 supplied reward identity or immutable payload mismatch blocks reward evidence',
      ),
    );
  }
  if (input.pointsConservationOrLotSafetyUnproven === true) {
    return err(
      problem(
        'invalid_request',
        400,
        false,
        'T-REWARD-01 supplied unproven paired noncash point conservation, lot availability or reservation safety blocks reward evidence',
      ),
    );
  }
  if (input.reversalProvisionOrAtomicitySafetyUnproven === true) {
    return err(
      problem(
        'invalid_request',
        400,
        false,
        'T-REWARD-01 supplied unproven cumulative reversal, approved provision or atomic reward safety blocks reward evidence',
      ),
    );
  }
  if (input.requiredEvidenceMissing === true) {
    return err(
      problem(
        'invalid_request',
        400,
        false,
        'T-REWARD-01 supplied missing required reward execution evidence blocks reward evidence',
      ),
    );
  }
  return err(
    problem(
      'dependency_unavailable',
      503,
      true,
      'T-REWARD-01 checkRewardEvidence cannot verify source/rule/lot identity or replay, paired zero-sum noncash units, nonnegative available/reserved lots, FIFO or expiry safety, cumulative reversal limits or noncash reward debt, approved P1/provision policy, atomic reward and provision effects, independent reconstruction or current Finance/Controller review and execution evidence: full T-REWARD-01, T-LEDGER-02, T-FIN-01 and T-CORE-02 remain HOLD (fail closed)',
    ),
  );
}
