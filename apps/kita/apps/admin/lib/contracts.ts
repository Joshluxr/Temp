export type SessionAudience = 'kita-customer' | 'kita-admin';

export const ADMIN_AUDIENCE: SessionAudience = 'kita-admin';

export const MINOR_RE = /^(0|[1-9][0-9]{0,15})$/;
export const MAJOR_RE = /^[1-9][0-9]*$/;
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const CURRENCY_RE = /^[A-Z]{3}$/;
export const IDEMPOTENCY_KEY_RE = /^[A-Za-z0-9_-]{16,128}$/;

export interface Money {
  readonly currency: string;
  readonly minor: string;
}

export interface ProblemFieldError {
  readonly field: string;
  readonly code: string;
}

export interface Problem {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly code: string;
  readonly requestId: string;
  readonly retryable: boolean;
  readonly detail?: string;
  readonly operationId?: string;
  readonly fieldErrors?: readonly ProblemFieldError[];
}

export interface PageMeta {
  readonly items: readonly unknown[];
  readonly asOf: string;
  readonly nextCursor?: string;
}

export interface AllowedAction {
  readonly action: string;
  readonly allowed: boolean;
  readonly reasonCode?: string;
}

export const TRANSFER_CUSTOMER_STATES = [
  'action_required',
  'under_review',
  'awaiting_funding',
  'processing',
  'delivered',
  'cancelled',
  'refund_pending',
  'refunded',
  'returned',
] as const;
export type TransferCustomerStatus = (typeof TRANSFER_CUSTOMER_STATES)[number];

export const LEG_STATES = [
  'not_started',
  'queued',
  'submitting',
  'pending',
  'authorized',
  'captured',
  'settled',
  'unknown',
  'rejected',
  'cancelled',
  'returned',
  'accepted',
  'paid',
  'partially_returned',
] as const;
export type LegState = (typeof LEG_STATES)[number];

export const COMPLIANCE_STATES = ['pending', 'review', 'cleared', 'blocked'] as const;
export type ComplianceState = (typeof COMPLIANCE_STATES)[number];

export const REFUND_STATES = [
  'none',
  'requested',
  'owed',
  'pending',
  'unknown',
  'partial',
  'paid',
  'returned',
] as const;
export type RefundState = (typeof REFUND_STATES)[number];

export const DISPUTE_STATES = ['none', 'open', 'evidence_due', 'won', 'lost', 'closed'] as const;
export type DisputeState = (typeof DISPUTE_STATES)[number];

export const FX_STATES = [
  'not_started',
  'queued',
  'submitting',
  'accepted',
  'settled',
  'unknown',
  'rejected',
  'cancelled',
] as const;
export type FxState = (typeof FX_STATES)[number];

export const RECONCILIATION_STATES = ['pending', 'matched', 'break_open'] as const;
export type ReconciliationState = (typeof RECONCILIATION_STATES)[number];

export const CASE_STATES = [
  'open',
  'investigating',
  'awaiting_customer',
  'awaiting_provider',
  'resolved',
  'closed',
] as const;
export type CaseState = (typeof CASE_STATES)[number];

export interface TransferView {
  readonly id: string;
  readonly reference: string;
  readonly version: string;
  readonly customerStatus: TransferCustomerStatus;
  readonly fundingState: LegState;
  readonly payoutState: LegState;
  readonly complianceState: ComplianceState;
  readonly refundState: RefundState;
  readonly disputeState: DisputeState;
  readonly fxState: FxState;
  readonly reconciliationState: ReconciliationState;
  readonly acceptedAt?: string;
  readonly deliveredAt?: string;
  readonly allowedActions: readonly AllowedAction[];
}

export interface CaseView {
  readonly id: string;
  readonly version: string;
  readonly kind: string;
  readonly state: CaseState;
  readonly receivedAt: string;
  readonly dueAt: string;
  readonly publicSummary: string;
  readonly requiredActions: readonly string[];
}

export interface AuditEventView {
  readonly id: string;
  readonly actorRef: string;
  readonly action: string;
  readonly targetRef: string;
  readonly recordedAt: string;
  readonly payloadHash: string;
  readonly eventHash: string;
  readonly approvalId?: string;
}

export interface TransferList {
  readonly items: readonly TransferView[];
  readonly asOf: string;
  readonly nextCursor?: string;
}

export interface CaseList {
  readonly items: readonly CaseView[];
  readonly asOf: string;
  readonly nextCursor?: string;
}

export interface AuditEventList {
  readonly items: readonly AuditEventView[];
  readonly asOf: string;
  readonly nextCursor?: string;
}

export interface ListQuery {
  readonly cursor?: string;
  readonly limit?: number;
  readonly status?: string;
  readonly reference?: string;
  readonly provider?: string;
  readonly corridor?: string;
  readonly assignee?: string;
}
