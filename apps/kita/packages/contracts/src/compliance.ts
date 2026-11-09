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

/**
 * Provider identity decision (T-KYC-02). Later adverse evidence blocks new payout.
 */
export interface Kyc02Input {
  readonly worker: WorkerIdentity;
  readonly subjectId: UUID;
  readonly laterAdverseDecision: boolean;
  readonly evidenceLocator?: string;
  readonly journalPosting?: never;
  readonly payoutAuthorization?: never;
}

export interface Kyc02Output {
  readonly eligibleForNewPayout: true;
  readonly decisionId: UUID;
  readonly traceEvents: readonly string[];
}

export interface Kyc02AdverseHoldDetail {
  readonly code: 'COMPLIANCE_HOLD';
  readonly subjectId: UUID;
  readonly reason: string;
}

export type Kyc02FailureDetail = Kyc02AdverseHoldDetail;

/**
 * Document quarantine (T-KYC-03). Infected uploads never reach an analyst viewer.
 */
export interface Kyc03Input {
  readonly worker: WorkerIdentity;
  readonly documentId: UUID;
  readonly infectedOrMalicious: boolean;
  readonly checksum?: string;
  readonly mimeType?: string;
  readonly journalPosting?: never;
  readonly analystAccessUrl?: never;
}

export interface Kyc03Output {
  readonly analystViewerGranted: true;
  readonly accessUrl: string;
  readonly traceEvents: readonly string[];
}

export interface Kyc03InfectedRejectedDetail {
  readonly code: 'SECURITY_FAILURE' | 'invalid_request';
  readonly documentId: UUID;
  readonly reason: string;
}

export type Kyc03FailureDetail = Kyc03InfectedRejectedDetail;

/**
 * List-delta rescreen (T-KYC-05). A new list hit stops queued payout before dispatch.
 */
export interface Kyc05Input {
  readonly worker: WorkerIdentity;
  readonly subjectId: UUID;
  readonly newListHit: boolean;
  readonly listDeltaCursor?: string;
  readonly journalPosting?: never;
  readonly payoutDispatch?: never;
}

export interface Kyc05Output {
  readonly dispatched: true;
  readonly holdId: UUID;
  readonly traceEvents: readonly string[];
}

export interface Kyc05ListHitHoldDetail {
  readonly code: 'COMPLIANCE_HOLD';
  readonly subjectId: UUID;
  readonly reason: string;
}

export type Kyc05FailureDetail = Kyc05ListHitHoldDetail;

/**
 * Risk / velocity / EDD (T-KYC-06). Concurrent transfers cannot exceed aggregate limit.
 */
export interface Kyc06Input {
  readonly worker: WorkerIdentity;
  readonly subjectId: UUID;
  readonly wouldExceedAggregateLimit: boolean;
  readonly tier?: string;
  readonly journalPosting?: never;
  readonly limitReservation?: never;
}

export interface Kyc06Output {
  readonly authorized: true;
  readonly reserved: true;
  readonly traceEvents: readonly string[];
}

export interface Kyc06LimitExceededDetail {
  readonly code: 'LIMIT_EXCEEDED';
  readonly subjectId: UUID;
  readonly reason: string;
}

export type Kyc06FailureDetail = Kyc06LimitExceededDetail;
