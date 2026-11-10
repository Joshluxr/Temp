/**
 * @kita/contracts — T-CORE-02 supplied-blocker types.
 * Additive only. No executeCommand, money_operations, or stores.
 */

import type { WorkerContext } from './context.ts';

/**
 * Durable command evidence (T-CORE-02). Missing review, identity/payload
 * mismatch, unproven authority, unproven hold/limit safety, and missing
 * execution evidence never accept durable commands. Full T-CORE-02 remains HOLD.
 */
export interface Core02Input {
  readonly requiredReviewMissing: boolean;
  readonly commandIdentityOrPayloadMismatch: boolean;
  readonly durableAuthoritySafetyUnproven: boolean;
  readonly subjectHoldOrLimitSafetyUnproven: boolean;
  readonly requiredEvidenceMissing: boolean;
}

export type Core02Output = never;

export type Core02CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration'>;
