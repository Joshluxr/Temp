/**
 * @kita/contracts — T-LEDGER-02 supplied-blocker types.
 * Additive only. No posting, journals, or stores.
 */

import type { WorkerContext } from './context.ts';

/**
 * Posting authority evidence (T-LEDGER-02). Missing review, identity/payload
 * mismatch, unproven template/period safety, unproven correction/atomicity,
 * and missing execution evidence never accept posting. Full T-LEDGER-02 remains HOLD.
 */
export interface Ledger02Input {
  readonly requiredReviewMissing: boolean;
  readonly postingIdentityOrPayloadMismatch: boolean;
  readonly templateEvidenceOrPeriodSafetyUnproven: boolean;
  readonly correctionAllocationOrAtomicitySafetyUnproven: boolean;
  readonly requiredEvidenceMissing: boolean;
}

export type Ledger02Output = never;

export type Ledger02CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration'>;
