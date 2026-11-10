/**
 * @kita/contracts — T-ADM-01 staff authorization types.
 * Additive only. Default-deny. No owner auto-admin.
 */

import type { UUID, WorkerContext } from './context.ts';

export type Adm01Audience = 'customer' | 'staff';

export interface Adm01Input {
  readonly audience: Adm01Audience;
  readonly unrelatedEntity: boolean;
  readonly personId?: UUID;
  readonly journalPosting?: never;
  readonly moneyMutation?: never;
}

export interface Adm01Output {
  readonly staffSessionIssued: true;
  readonly canMutateMoney: true;
  readonly traceEvents: readonly string[];
}

export type Adm01CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration' | 'trace'>;

/**
 * Set hold (T-ADM-03). Hold after dispatch must never be treated as
 * pre-dispatch cancellation. Holds store is T-CORE-02 (HOLD).
 */
export interface Adm03Input {
  readonly holdAfterDispatchWouldBeTreatedAsPreDispatchCancel: boolean;
  readonly journalPosting?: never;
  readonly preDispatchCancel?: never;
}

export interface Adm03Output {
  readonly holdRecorded: true;
  readonly treatedAsPreDispatchCancel: true;
  readonly traceEvents: readonly string[];
}

export type Adm03CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration' | 'trace'>;

/**
 * Ops queue (T-ADM-02). Projections never confer mutation rights.
 */
export interface Adm02Input {
  readonly staffAuthorized: boolean;
  readonly cursor?: string;
  readonly journalPosting?: never;
  readonly mutationRights?: never;
}

export interface Adm02Output {
  readonly items: readonly unknown[];
  readonly mutationRights: true;
  readonly traceEvents: readonly string[];
}

/**
 * Manual case decision (T-ADM-04). Unqualified roles cannot override blocked-property.
 */
export interface Adm04Input {
  readonly unqualifiedRole: boolean;
  readonly overrideBlockedProperty: boolean;
  readonly caseId?: UUID;
  readonly journalPosting?: never;
  readonly sanctionsOverride?: never;
}

export interface Adm04Output {
  readonly decisionRecorded: true;
  readonly blockedPropertyOverridden: true;
  readonly traceEvents: readonly string[];
}

/**
 * Maker-checker (T-ADM-05). Second login of the same person cannot approve.
 */
export interface Adm05Input {
  readonly samePersonSecondLogin: boolean;
  readonly requesterPersonId?: UUID;
  readonly checkerPersonId?: UUID;
  readonly journalPosting?: never;
  readonly commandAuthority?: never;
}

export interface Adm05Output {
  readonly approved: true;
  readonly commandAuthorityGranted: true;
  readonly traceEvents: readonly string[];
}

/**
 * Manual evidence (T-ADM-07). Cannot set paid without verified evidence and reviewer.
 */
export interface Adm07Input {
  readonly missingVerifiedEvidence: boolean;
  readonly missingReviewer: boolean;
  readonly journalPosting?: never;
  readonly markPaid?: never;
}

export interface Adm07Output {
  readonly paid: true;
  readonly evidenceId: UUID;
  readonly traceEvents: readonly string[];
}

/**
 * PII reveal (T-ADM-09). Step-up, reason, and expiry required. Never return unmasked PII.
 */
export interface Adm09Input {
  readonly missingStepUp: boolean;
  readonly missingReason: boolean;
  readonly expired: boolean;
  readonly piiSample?: string;
  readonly journalPosting?: never;
  readonly unmaskedReveal?: never;
}

export interface Adm09Output {
  readonly unmaskedPii: string;
  readonly exportUrl: string;
  readonly traceEvents: readonly string[];
}

/**
 * Staff grants (T-ADM-10). Revoked approver cannot execute; no financial self-grant.
 */
export interface Adm10Input {
  readonly revokedApprover: boolean;
  readonly financialSelfGrant: boolean;
  readonly journalPosting?: never;
  readonly executeQueuedRequest?: never;
}

export interface Adm10Output {
  readonly grantActive: true;
  readonly queuedExecutionAllowed: true;
  readonly traceEvents: readonly string[];
}

/**
 * Tamper-evident audit (T-ADM-11). Never claim verified anchors without WORM archive.
 */
export interface Adm11Input {
  readonly archiveUnavailable: boolean;
  readonly chainMismatch: boolean;
  readonly journalPosting?: never;
  readonly verifiedAnchorClaim?: never;
}

export interface Adm11Output {
  readonly anchorsVerified: true;
  readonly independentArchiveOk: true;
  readonly traceEvents: readonly string[];
}

/**
 * Emergency route pause (T-ADM-12). Never persist a live pause; never claim production stop.
 */
export interface Adm12Input {
  readonly reenableWithoutApproval: boolean;
  readonly journalPosting?: never;
  readonly persistPause?: never;
}

export interface Adm12Output {
  readonly pausePersisted: true;
  readonly newCommandsStoppedInProduction: true;
  readonly traceEvents: readonly string[];
}
