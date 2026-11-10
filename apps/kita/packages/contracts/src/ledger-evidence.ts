/**
 * @kita/contracts — T-FIN-01 supplied-blocker types.
 * Additive only. No posting, journals, or stores.
 */

import type { WorkerContext } from './context.ts';

/**
 * Ledger evidence (T-FIN-01). Missing review, identity/payload mismatch,
 * unproven journal integrity, unproven posting/period safety, and missing
 * execution evidence never accept a ledger. Full T-FIN-01 remains HOLD.
 */
export interface Fin01Input {
  readonly requiredReviewMissing: boolean;
  readonly ledgerIdentityOrPayloadMismatch: boolean;
  readonly journalIntegritySafetyUnproven: boolean;
  readonly postingPolicyOrPeriodSafetyUnproven: boolean;
  readonly requiredEvidenceMissing: boolean;
}

export type Fin01Output = never;

export type Fin01CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration'>;
