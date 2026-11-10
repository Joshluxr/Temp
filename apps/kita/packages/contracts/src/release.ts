/**
 * @kita/contracts — T-RELEASE-01 supplied-blocker types.
 * Additive only. No gate collection, candidate comparison, or activation.
 */

import type { WorkerContext } from './context.ts';

/**
 * Release evidence (T-RELEASE-01). Missing approver/caps/proofs, candidate
 * mismatch, stale evidence, and invalidated provider evidence never assemble
 * a release. Full T-RELEASE-01 remains HOLD.
 */
export interface Release01Input {
  readonly requiredApproverMissing: boolean;
  readonly requiredCapsMissing: boolean;
  readonly gateEvidenceMissing: boolean;
  readonly candidateMismatch: boolean;
  readonly gateEvidenceStale: boolean;
  readonly providerEvidenceInvalidated: boolean;
}

export type Release01Output = never;

export type Release01CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration'>;
