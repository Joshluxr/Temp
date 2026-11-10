/**
 * @kita/contracts — T-REWARD-01 supplied-blocker types.
 * Additive only. No points ledger, posting, or stores.
 */

import type { WorkerContext } from './context.ts';

/**
 * Reward evidence (T-REWARD-01). Missing review, identity/payload mismatch,
 * unproven conservation/lot safety, unproven reversal/provision/atomicity,
 * and missing execution evidence never accept rewards. Full T-REWARD-01 remains HOLD.
 */
export interface Reward01Input {
  readonly requiredReviewMissing: boolean;
  readonly rewardIdentityOrPayloadMismatch: boolean;
  readonly pointsConservationOrLotSafetyUnproven: boolean;
  readonly reversalProvisionOrAtomicitySafetyUnproven: boolean;
  readonly requiredEvidenceMissing: boolean;
}

export type Reward01Output = never;

export type Reward01CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration'>;
