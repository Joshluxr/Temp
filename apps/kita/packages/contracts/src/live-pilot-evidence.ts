/**
 * @kita/contracts — T-LIVE-01 supplied-blocker types.
 * Additive only. No live traffic, bank/provider calls, or money.
 */

import type { WorkerContext } from './context.ts';

/**
 * Live pilot evidence (T-LIVE-01). Missing review, identity/scope mismatch,
 * unproven caps/stop safety, unproven reconciliation/remedy, and missing
 * execution evidence never accept a live pilot. Full T-LIVE-01 remains HOLD.
 */
export interface Live01Input {
  readonly requiredReviewMissing: boolean;
  readonly pilotIdentityOrScopeMismatch: boolean;
  readonly pilotCapsOrStopSafetyUnproven: boolean;
  readonly reconciliationOrRemedySafetyUnproven: boolean;
  readonly requiredEvidenceMissing: boolean;
}

export type Live01Output = never;

export type Live01CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration'>;
