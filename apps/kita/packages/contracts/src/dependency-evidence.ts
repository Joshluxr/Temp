/**
 * @kita/contracts — T-DEPEND-01 supplied-blocker types.
 * Additive only. No activation-policy change, enablement, or G1-G6 decision.
 */

import type { WorkerContext } from './context.ts';

/**
 * Dependency evidence (T-DEPEND-01). Missing approval/review, scope mismatch,
 * stale/revoked evidence, rejected dependency, and missing evidence never
 * enable a capability. Full T-DEPEND-01 remains HOLD.
 */
export interface Depend01Input {
  readonly requiredApprovalOrReviewMissing: boolean;
  readonly scopeMismatch: boolean;
  readonly evidenceStaleOrRevoked: boolean;
  readonly dependencyRejected: boolean;
  readonly requiredEvidenceMissing: boolean;
}

export type Depend01Output = never;

export type Depend01CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration'>;
