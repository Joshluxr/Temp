/**
 * @kita/contracts — T-GA-01 supplied-blocker types.
 * Additive only. No launch, production, or G1-G6 closure.
 */

import type { WorkerContext } from './context.ts';

/**
 * Launch evidence (T-GA-01). Missing review, identity/scope mismatch,
 * unproven pilot exit/reconciliation, unproven staged exposure/ops safety,
 * and missing execution evidence never accept launch. Full T-GA-01 remains HOLD.
 */
export interface Ga01Input {
  readonly requiredReviewMissing: boolean;
  readonly launchIdentityOrScopeMismatch: boolean;
  readonly pilotExitOrReconciliationUnproven: boolean;
  readonly stagedExposureOrOperationalSafetyUnproven: boolean;
  readonly requiredEvidenceMissing: boolean;
}

export type Ga01Output = never;

export type Ga01CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration'>;
