/**
 * @kita/contracts — frozen shared COMMAND envelope (T-CONTRACT-01).
 *
 * Authority: docs/kita-plan/openapi/kita-v1.yaml (public wire contract, frozen
 * by addenda/OPENAPI-FREEZE.md), 06-api-contracts.md §F1–§F4, and
 * 13-backlog.md T-CONTRACT-01 / M2. This file is a frozen TYPE + REGISTRY
 * surface only. It executes nothing: no durable command storage, no subject
 * holds, no limit buckets, no financial work identities — those implementations
 * are T-CORE-02 and are NOT authorized by this task. No journal posting
 * (T-LEDGER-02) and no sandbox money paths (docs/FORBIDDEN-PRODUCTION-ENDPOINTS.md).
 *
 * Wire rules encoded here (§F1):
 * - Every mutation carries an Idempotency-Key scoped (book,actor,operation,key)
 *   plus a canonical request hash; identical replay returns the same result,
 *   changed body returns 409 IDEMPOTENCY_MISMATCH.
 * - Versioned commands carry expectedVersion; absent required version => 400,
 *   stale => 409 VERSION_CONFLICT. Cancellation/refund claim intake is the
 *   explicit advisory-version exception.
 * - Money on the wire is {currency, minor:"50399"} with minor a canonical
 *   decimal string; no client may supply actor role, book ownership, paid
 *   status, rate, ledger account ID or provider credentials to a financial
 *   command.
 */

import type { UUID, Instant } from './context.ts';
import type { ProblemCode } from './result.ts';

/* ------------------------------------------------------------------ *
 * Canonical value shapes (mirror of OpenAPI components, §F1)
 * ------------------------------------------------------------------ */

/** OpenAPI `Money`: nonnegative integer minor units as canonical decimal string. */
export interface CommandMoney {
  readonly currency: string;
  /** Canonical decimal string: ^(0|[1-9][0-9]{0,15})$; server enforces <=9e15 and capability limits. */
  readonly minor: string;
}

/** Rate as exact rational text; numerator/denominator <=10^24 (§G1). Never a JS number. */
export interface CommandRate {
  readonly numerator: string;
  readonly denominator: string;
}

/** Opaque idempotency key: 16–128 safe characters, no PII (§F1). */
export type IdempotencyKey = string;

const IDEMPOTENCY_KEY_RE = /^[A-Za-z0-9_-]{16,128}$/;

export function isValidIdempotencyKey(key: string): boolean {
  return IDEMPOTENCY_KEY_RE.test(key);
}

const CANONICAL_MINOR_RE = /^(0|[1-9][0-9]{0,15})$/;

/** Fail-closed shape check for wire money: canonical unsigned decimal string only. */
export function isCanonicalWireMoney(money: CommandMoney): boolean {
  return /^[A-Z]{3}$/.test(money.currency) && CANONICAL_MINOR_RE.test(money.minor);
}

/* ------------------------------------------------------------------ *
 * Envelope
 * ------------------------------------------------------------------ */

/**
 * The frozen envelope every HTTP mutation maps into before reaching a domain
 * handler (§F4: one named handler per operation). `payload` is validated by the
 * per-operation schema generated from the frozen OpenAPI document; this
 * envelope deliberately carries NO actor role, NO ledger account and NO
 * provider credentials.
 */
export interface CommandEnvelope<TPayload = Readonly<Record<string, unknown>>> {
  readonly operation: CommandOperationId;
  readonly idempotencyKey: IdempotencyKey;
  /** Required for versioned operations; see ADVISORY_VERSION_OPERATIONS. */
  readonly expectedVersion?: string;
  readonly bookId: UUID;
  readonly actorId: UUID;
  readonly correlationId: UUID;
  readonly causationId?: UUID;
  readonly issuedAt: Instant;
  readonly payload: TPayload;
}

/** Result stored durably with the command key (§F1: result + operation in one transaction). */
export interface CommandReceipt<TResponse = unknown> {
  readonly key: IdempotencyKey;
  readonly operation: CommandOperationId;
  readonly canonicalRequestHash: string;
  readonly status: 'pending' | 'succeeded' | 'failed' | 'unknown';
  readonly response?: TResponse;
  readonly problemCode?: ProblemCode;
  readonly recordedAt: Instant;
}

/* ------------------------------------------------------------------ *
 * Frozen operation registry
 * ------------------------------------------------------------------ */

/**
 * Every operationId defined by the frozen OpenAPI document
 * (docs/kita-plan/openapi/kita-v1.yaml; machine list:
 * docs/kita-plan/evidence/operations.json — 114 entries). Workers must not
 * invent private endpoints or backlog aliases as new operations
 * (addenda/OPENAPI-FREEZE.md). CI regenerates this list from the YAML and the
 * test suite fails closed on drift.
 */
export const COMMAND_OPERATIONS: readonly CommandOperationId[] = [
  /** POST /v1/transfers */
  'acceptTransfer',
  /** POST /admin/v1/transfers/{id}/cancellation-requests */
  'adminRequestCancellation',
  /** POST /admin/v1/transfers/{id}/refund-requests */
  'adminRequestRefund',
  /** POST /v1/recipients/{id}/archive */
  'archiveRecipient',
  /** POST /admin/v1/cases/{id}/assignments */
  'assignCase',
  /** POST /v1/auth/callbacks */
  'completeAuthorization',
  /** POST /v1/documents/{id}/completion */
  'completeDocumentUpload',
  /** POST /v1/auth/contact-confirmations */
  'confirmContact',
  /** POST /v1/funding-instruments */
  'confirmFundingInstrument',
  /** POST /admin/v1/adjustment-requests */
  'createAdjustmentRequest',
  /** POST /admin/v1/auth/sessions */
  'createAdminSession',
  /** POST /v1/auto-conversions */
  'createAutoConversion',
  /** POST /v1/batches */
  'createBatch',
  /** POST /v1/bill-payments */
  'createBillPayment',
  /** POST /v1/business-profiles */
  'createBusinessProfile',
  /** POST /admin/v1/configuration-releases */
  'createConfigRelease',
  /** POST /v1/auth/contact-verifications */
  'createContactVerification',
  /** POST /admin/v1/disputes/{id}/responses */
  'createDisputeResponse',
  /** POST /v1/document-uploads */
  'createDocumentUpload',
  /** POST /v1/drafts */
  'createDraft',
  /** POST /v1/transfers/{id}/error-claims */
  'createErrorClaim',
  /** POST /v1/estimates */
  'createEstimate',
  /** POST /v1/funding-instrument-sessions */
  'createFundingInstrumentSession',
  /** POST /v1/transfers/{id}/funding-sessions */
  'createFundingSession',
  /** POST /admin/v1/transfers/{id}/holds */
  'createHold',
  /** POST /v1/identity-sessions */
  'createIdentitySession',
  /** POST /v1/auth/mobile-sessions */
  'createMobileSession',
  /** POST /v1/quotes */
  'createQuote',
  /** POST /v1/rate-alerts */
  'createRateAlert',
  /** POST /v1/recipients */
  'createRecipient',
  /** POST /v1/recipients/{id}/versions */
  'createRecipientVersion',
  /** POST /v1/referrals */
  'createReferral',
  /** POST /admin/v1/report-exports */
  'createReportExport',
  /** POST /admin/v1/cases/{id}/risk-decisions */
  'createRiskDecision',
  /** POST /v1/schedules */
  'createSchedule',
  /** POST /admin/v1/cases/{id}/screening-reviews */
  'createScreeningReview',
  /** POST /v1/auth/step-ups */
  'createStepUp',
  /** POST /v1/support/cases */
  'createSupportCase',
  /** POST /v1/support/cases/{id}/messages */
  'createSupportMessage',
  /** POST /v1/wallets/conversions */
  'createWalletConversion',
  /** POST /v1/wallet-quotes */
  'createWalletQuote',
  /** POST /v1/wallets/topups */
  'createWalletTopup',
  /** POST /v1/wallets/transfers */
  'createWalletTransfer',
  /** POST /v1/wallets/withdrawals */
  'createWithdrawal',
  /** POST /admin/v1/approvals/{id}/decisions */
  'decideApproval',
  /** POST /admin/v1/cases/{id}/decisions */
  'decideCase',
  /** POST /admin/v1/approvals/{id}/executions */
  'executeApproval',
  /** GET /admin/v1/transfers/{id} */
  'getAdminTransfer',
  /** GET /v1/batches/{id} */
  'getBatch',
  /** GET /v1/support/cases/{id} */
  'getCase',
  /** GET /v1/commands/{key} */
  'getCommandResult',
  /** GET /v1/content/{slug} */
  'getContent',
  /** GET /v1/drafts/{id} */
  'getDraft',
  /** GET /v1/identity-status */
  'getIdentityStatus',
  /** GET /admin/v1/journals/{id} */
  'getJournal',
  /** GET /v1/operations/{id} */
  'getOperation',
  /** GET /v1/transfers/{id}/pickup-instructions */
  'getPickupInstructions',
  /** GET /v1/points */
  'getPoints',
  /** GET /v1/me */
  'getProfile',
  /** GET /v1/quotes/{id} */
  'getQuote',
  /** GET /v1/transfers/{id}/receipt */
  'getReceipt',
  /** GET /v1/transfers/{id} */
  'getTransfer',
  /** GET /v1/transfers/{id}/timeline */
  'getTransferTimeline',
  /** GET /admin/v1/treasury-positions */
  'getTreasuryPositions',
  /** POST /admin/v1/statements */
  'importStatement',
  /** POST /admin/v1/payout-attempts/{id}/status-inquiries */
  'inquireAttempt',
  /** GET /admin/v1/cases */
  'listAdminCases',
  /** GET /admin/v1/transfers */
  'listAdminTransfers',
  /** GET /admin/v1/approvals */
  'listApprovals',
  /** GET /admin/v1/audit-events */
  'listAuditEvents',
  /** GET /v1/billers */
  'listBillers',
  /** GET /admin/v1/reconciliation-breaks */
  'listBreaks',
  /** GET /admin/v1/configuration-versions */
  'listConfigVersions',
  /** GET /v1/corridors */
  'listCorridors',
  /** GET /v1/funding-instruments */
  'listFundingInstruments',
  /** GET /v1/corridors/{id}/payout-options */
  'listPayoutOptions',
  /** GET /v1/rate-alerts */
  'listRateAlerts',
  /** GET /v1/recipients */
  'listRecipients',
  /** GET /v1/reward-events */
  'listRewardEvents',
  /** GET /v1/schedules */
  'listSchedules',
  /** GET /v1/auth/sessions */
  'listSessions',
  /** GET /v1/transfers */
  'listTransfers',
  /** GET /v1/wallets */
  'listWallets',
  /** POST /v1/auth/logout */
  'logout',
  /** POST /v1/rate-alerts/{id}/pause */
  'pauseRateAlert',
  /** POST /admin/v1/routes/{id}/pauses */
  'pauseRoute',
  /** POST /webhooks/v1/{provider}/{accountId} */
  'receiveWebhook',
  /** POST /admin/v1/cases/{id}/filings */
  'recordRegulatoryFiling',
  /** POST /admin/v1/dead-letters/{id}/replays */
  'replayDeadLetter',
  /** POST /admin/v1/access-changes */
  'requestAccessChange',
  /** POST /v1/transfers/{id}/cancellation-requests */
  'requestCancellation',
  /** POST /v1/me/closure-requests */
  'requestClosure',
  /** POST /admin/v1/customers/{id}/pii-reveals */
  'requestPiiReveal',
  /** POST /v1/me/privacy-requests */
  'requestPrivacyAction',
  /** POST /v1/transfers/{id}/refund-requests */
  'requestRefund',
  /** POST /admin/v1/transfers/{id}/reroute-requests */
  'requestReroute',
  /** POST /admin/v1/routes/{id}/reenablement-requests */
  'requestRouteReenable',
  /** POST /admin/v1/treasury-movement-requests */
  'requestTreasuryMovement',
  /** POST /v1/points/reservations */
  'reservePoints',
  /** POST /admin/v1/reconciliation-breaks/{id}/resolutions */
  'resolveBreak',
  /** POST /admin/v1/holds/{id}/resolutions */
  'resolveHold',
  /** POST /v1/support/cases/{id}/responses */
  'respondCase',
  /** POST /v1/funding-instruments/{id}/revocations */
  'revokeFundingInstrument',
  /** POST /v1/schedules/{id}/revocations */
  'revokeSchedule',
  /** POST /v1/auth/sessions/{id}/revocations */
  'revokeSession',
  /** POST /admin/v1/pricing/simulations */
  'simulatePricing',
  /** POST /v1/auth/authorization-requests */
  'startAuthorization',
  /** POST /v1/auth/recovery */
  'startRecovery',
  /** GET /v1/transfers/{id}/events */
  'streamTransferEvents',
  /** POST /admin/v1/provider-evidence */
  'submitProviderEvidence',
  /** PUT /v1/drafts/{id} */
  'updateDraft',
  /** PUT /v1/notification-preferences */
  'updateNotificationPreferences',
  /** POST /v1/billers/{id}/validations */
  'validateBillAccount',
  /** POST /v1/promotions/validations */
  'validatePromotion',
] as const;

/** Advisory-version exceptions (§F1): stale display must not discard valid intake. */
export const ADVISORY_VERSION_OPERATIONS: readonly CommandOperationId[] = [
  'requestCancellation',
  'requestRefund',
] as const satisfies readonly CommandOperationId[];

export type CommandOperationId = (typeof COMMAND_OPERATIONS)[number];

/** True when the operation's expectedVersion is advisory (§F1 intake exception). */
export function isAdvisoryVersionOperation(operation: CommandOperationId): boolean {
  return (ADVISORY_VERSION_OPERATIONS as readonly string[]).includes(operation);
}

/* ------------------------------------------------------------------ *
 * Canonical request hashing
 * ------------------------------------------------------------------ */

/** Deterministic RFC8785-style stable stringify used for canonical hashes (§F1). */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const record = value as Readonly<Record<string, unknown>>;
  const keys = Object.keys(record).filter((k) => record[k] !== undefined).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(record[k])}`).join(',')}}`;
}
