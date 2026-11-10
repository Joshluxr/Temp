/**
 * @kita/contracts — T-CORE-01 supplied-blocker types.
 * Additive only. No pool, transaction, or runtime binding inspection.
 */

import type { WorkerContext } from './context.ts';

/**
 * Core evidence (T-CORE-01). Missing review, composition mismatch, unsafe
 * bindings, unproven transaction/pool safety, and missing execution evidence
 * never accept core runtime. Full T-CORE-01 remains HOLD.
 */
export interface Core01Input {
  readonly requiredReviewMissing: boolean;
  readonly compositionBoundaryMismatch: boolean;
  readonly runtimeBindingsMissingOrUnsafe: boolean;
  readonly transactionOrPoolSafetyUnproven: boolean;
  readonly requiredEvidenceMissing: boolean;
}

export type Core01Output = never;

export type Core01CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration'>;
