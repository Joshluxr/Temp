/**
 * @kita/contracts — T-INTEGRATE-01 supplied-blocker types.
 * Additive only. No wiring, candidate inspection, or G1/G2 decision.
 */

import type { WorkerContext } from './context.ts';

/**
 * Integration evidence (T-INTEGRATE-01). Missing review, candidate mismatch
 * or staleness, missing implementation, skipped scenario, and unexplained
 * financial break never accept integration. Full T-INTEGRATE-01 remains HOLD.
 */
export interface Integrate01Input {
  readonly requiredReviewMissing: boolean;
  readonly candidateMismatch: boolean;
  readonly candidateStale: boolean;
  readonly requiredImplementationMissing: boolean;
  readonly requiredScenarioSkipped: boolean;
  readonly unexplainedFinancialBreakPresent: boolean;
}

export type Integrate01Output = never;

export type Integrate01CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration'>;
