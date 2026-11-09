/**
 * @kita/contracts — T-KYC-04 screening types.
 * Additive only. Unavailable or stale lists cannot silently pass.
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
