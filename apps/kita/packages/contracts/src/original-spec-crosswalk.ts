/**
 * @kita/contracts — T-SCOPE-01 supplied-blocker original-spec types.
 * Additive only. No source recovery, crosswalk generation, or coverage claim.
 */

import type { WorkerContext } from './context.ts';

/**
 * Original-spec crosswalk (T-SCOPE-01). Missing review, missing original spec,
 * duplicates, conflicts, and unmapped requirements/scenarios never accept
 * scope. Full T-SCOPE-01 remains HOLD.
 */
export interface Scope01Input {
  readonly requiredReviewMissing: boolean;
  readonly originalSpecMissing: boolean;
  readonly duplicateOriginalRequirementPresent: boolean;
  readonly crosswalkConflictPresent: boolean;
  readonly unmappedOriginalRequirementPresent: boolean;
  readonly unmappedRequiredScenarioPresent: boolean;
}

export type Scope01Output = never;

export type Scope01CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration'>;
