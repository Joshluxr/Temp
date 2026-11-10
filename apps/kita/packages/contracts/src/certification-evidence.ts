/**
 * @kita/contracts — T-CERT-01 supplied-blocker types.
 * Additive only. No sandbox run, provider call, or G3 decision.
 */

import type { WorkerContext } from './context.ts';

/**
 * Certification evidence (T-CERT-01). Missing acknowledgment/review, scope
 * mismatch, stale evidence, missing sandbox/SDK/device proof, and unsupported
 * cases claimed passed never certify. Full T-CERT-01 remains HOLD.
 */
export interface Cert01Input {
  readonly requiredAcknowledgmentOrReviewMissing: boolean;
  readonly scopeMismatch: boolean;
  readonly evidenceStale: boolean;
  readonly requiredSandboxEvidenceMissing: boolean;
  readonly requiredSdkDeviceEvidenceMissing: boolean;
  readonly unsupportedCaseClaimedPassed: boolean;
}

export type Cert01Output = never;

export type Cert01CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration'>;
