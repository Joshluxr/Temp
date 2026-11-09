/**
 * @kita/contracts — T-EXT-03 business KYB types.
 * Additive only. Live KYB/payout authority is not granted by this checker.
 */

import type { UUID } from './context.ts';
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
