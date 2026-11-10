/**
 * @kita/contracts — T-EXT-03 business KYB types.
 * Additive only. Live KYB/payout authority is not granted by this checker.
 */

import type { UUID, WorkerContext } from './context.ts';
import type { WorkerIdentity } from './platform.ts';

export interface Ext03Input {
  readonly worker: WorkerIdentity;
  readonly businessId: UUID;
  readonly individualKycOnly: boolean;
  readonly kybPresent: boolean;
  readonly signatoriesPresent: boolean;
  readonly journalPosting?: never;
  readonly payoutAuthorization?: never;
}

export interface Ext03Output {
  readonly verifiedForPayout: true;
  readonly profileId: UUID;
  readonly traceEvents: readonly string[];
}

export interface Ext03ApprovalRequiredDetail {
  readonly code: 'APPROVAL_REQUIRED';
  readonly businessId: UUID;
  readonly reason: string;
}

export type Ext03FailureDetail = Ext03ApprovalRequiredDetail;

/**
 * Batch execution (T-EXT-04). Unauthorized execution, stale approval, limit
 * breach, paid-item retry, and uncertain submission never grant payout.
 * T-CORE-02, T-LEDGER-02, and DEP-12 remain HOLD.
 */
export interface Ext04Input {
  readonly unauthorizedBatchExecution: boolean;
  readonly approvalStale: boolean;
  readonly limitExceeded: boolean;
  readonly paidItemWouldBeRetried: boolean;
  readonly itemSubmissionUncertain: boolean;
}

export type Ext04Output = never;

export type Ext04CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration'>;
