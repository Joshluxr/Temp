/**
 * @kita/contracts — T-KYC-01 capture and T-KYC-04 screening types.
 * Additive only. Capture callbacks never approve. Stale lists cannot pass.
 */

import type { UUID } from './context.ts';
import type { WorkerIdentity } from './platform.ts';

export interface Kyc04Input {
  readonly worker: WorkerIdentity;
  readonly subjectId: UUID;
  readonly listUnavailable: boolean;
  readonly listStale: boolean;
  readonly listVersion?: string;
  readonly policyVersion?: string;
  readonly journalPosting?: never;
  readonly payoutClearance?: never;
}

export interface Kyc04Output {
  readonly outcome: 'clear';
  readonly allowsPayout: true;
  readonly traceEvents: readonly string[];
}

export interface Kyc04ComplianceHoldDetail {
  readonly code: 'COMPLIANCE_HOLD';
  readonly subjectId: UUID;
  readonly reason: string;
}

export type Kyc04FailureDetail = Kyc04ComplianceHoldDetail;

/**
 * Hosted identity capture (T-KYC-01). Capture callback alone never approves.
 */
export interface Kyc01Input {
  readonly worker: WorkerIdentity;
  readonly subjectId: UUID;
  readonly captureCallbackReceived: boolean;
  readonly journalPosting?: never;
  readonly customerApproval?: never;
}

export interface Kyc01Output {
  readonly approved: true;
  readonly sessionId: UUID;
  readonly traceEvents: readonly string[];
}

export interface Kyc01CaptureNotApprovalDetail {
  readonly code: 'COMPLIANCE_HOLD' | 'CAPABILITY_UNAVAILABLE';
  readonly subjectId: UUID;
  readonly reason: string;
}

export type Kyc01FailureDetail = Kyc01CaptureNotApprovalDetail;
