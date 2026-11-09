/**
 * Frozen-contract types mirrored from docs/kita-plan/openapi/kita-v1.yaml
 * (version `1.0.0-plan.2026-11-09`). This is a hand-mirror of the reviewed
 * planning snapshot, not generated output: T-PLAT-01 replaces this file with
 * `packages/contracts/src/generated.ts` once the generator reproduces the
 * reviewed schemas (F8). Wire shapes only — no runtime validation, no state
 * machines, no money arithmetic.
 *
 * Money on the WIRE is `{currency, minor}` with `minor` as a canonical decimal
 * STRING (F1). The @kita/domain `Money` value object models the SQL column as
 * `bigint`; conversion happens at this boundary via the pure helpers below.
 */

import type { Money as DomainMoney } from "@kita/domain";

/* ------------------------------------------------------------------ */
/* Money                                                               */
/* ------------------------------------------------------------------ */

/** components/schemas/Money — `minor` matches ^(0|[1-9][0-9]{0,15})$. */
export interface WireMoney {
  readonly currency: string;
  readonly minor: string;
}

const MINOR_RE = /^(0|[1-9][0-9]{0,15})$/;
const CURRENCY_RE = /^[A-Z]{3}$/;

/**
 * Contract F7 limit, expressed exactly as the spec's inclusive maximum so no
 * precision is lost through a JS number literal.
 */
const MAX_MINOR_UNITS = BigInt("9000000000000000");

/** Structural wire-money check: shape + F7 magnitude bound. */
export function isWireMoney(value: unknown): value is WireMoney {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.currency === "string" &&
    CURRENCY_RE.test(record.currency) &&
    typeof record.minor === "string" &&
    MINOR_RE.test(record.minor) &&
    BigInt(record.minor) <= MAX_MINOR_UNITS
  );
}

/**
 * Wire -> domain value object. Presentational only: @kita/domain ships zero
 * money-moving logic until T-CORE-02/T-LEDGER-02 after the contract freeze.
 */
export function toDomainMoney(money: WireMoney): DomainMoney {
  return { currency: money.currency, minor: BigInt(money.minor) };
}

/* ------------------------------------------------------------------ */
/* Problem + async semantics                                           */
/* ------------------------------------------------------------------ */

/** components/schemas/Problem (F2). Public detail never leaks AML rules, raw provider errors, PII or stacks. */
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

export interface ProblemFieldError {
  readonly field: string;
  readonly code: string;
}

/* ------------------------------------------------------------------ */
/* Quote                                                               */
/* ------------------------------------------------------------------ */

/** components/schemas/Quote — immutable terms captured at quote creation. */
export interface Quote {
  readonly id: string;
  readonly recipientVersionId: string;
  readonly principal: WireMoney;
  readonly grossFee: WireMoney;
  readonly discount: WireMoney;
  readonly tax: WireMoney;
  readonly total: WireMoney;
  readonly receive: WireMoney;
  readonly rateNumerator: string;
  readonly rateDenominator: string;
  readonly displayRate: string;
  readonly effectiveRate: string;
  readonly referenceRate?: string;
  readonly referenceAsOf?: string;
  readonly roundingAdjustmentDestinationMinor?: string;
  readonly pricingVersion: string;
  readonly routeId: string;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly fundingDeadline: string;
  readonly availabilityAt: string;
  readonly deliveryRange: QuoteDeliveryRange;
  readonly disclosureHash: string;
  readonly disclosureVersion: string;
  readonly bindingPolicy: string;
}

export interface QuoteDeliveryRange {
  readonly earliest: string;
  readonly latest: string;
  readonly conditions: readonly string[];
}

/* ------------------------------------------------------------------ */
/* Transfer                                                            */
/* ------------------------------------------------------------------ */

/** components/schemas/Transfer — independent legs; customerStatus is a server projection, never an optimistic client state (D2). */
export interface Transfer {
  readonly id: string;
  readonly reference: string;
  readonly version: string;
  readonly quote: Quote;
  readonly customerStatus: TransferCustomerStatus;
  readonly fundingState: TransferLegState;
  readonly payoutState: TransferPayoutState;
  readonly complianceState: TransferComplianceState;
  readonly refundState: TransferRefundState;
  readonly disputeState: TransferDisputeState;
  readonly fxState?: TransferFxState;
  readonly reconciliationState?: TransferReconciliationState;
  readonly acceptedAt: string;
  readonly deliveredAt?: string;
  readonly allowedActions?: readonly AllowedAction[];
}

export type TransferCustomerStatus =
  | "action_required"
  | "under_review"
  | "awaiting_funding"
  | "processing"
  | "delivered"
  | "cancelled"
  | "refund_pending"
  | "refunded"
  | "returned";

export type TransferLegState =
  | "not_started"
  | "queued"
  | "submitting"
  | "pending"
  | "authorized"
  | "captured"
  | "settled"
  | "unknown"
  | "rejected"
  | "cancelled"
  | "returned";

export type TransferPayoutState =
  | "not_started"
  | "queued"
  | "submitting"
  | "accepted"
  | "pending"
  | "unknown"
  | "paid"
  | "rejected"
  | "cancelled"
  | "partially_returned"
  | "returned";

export type TransferComplianceState = "pending" | "review" | "cleared" | "blocked";

export type TransferRefundState =
  | "none"
  | "requested"
  | "owed"
  | "pending"
  | "unknown"
  | "partial"
  | "paid"
  | "returned";

export type TransferDisputeState = "none" | "open" | "evidence_due" | "won" | "lost" | "closed";

export type TransferFxState =
  | "not_started"
  | "queued"
  | "submitting"
  | "accepted"
  | "settled"
  | "unknown"
  | "rejected"
  | "cancelled";

export type TransferReconciliationState = "pending" | "matched" | "break_open";

/** Server-eligibility hint only — "UI availability is not backend authorization" (F4). */
export interface AllowedAction {
  readonly action: string;
  readonly allowed: boolean;
  readonly reasonCode?: string;
}

/* ------------------------------------------------------------------ */
/* Timeline events                                                     */
/* ------------------------------------------------------------------ */

/** components/schemas/Event — public redacted projection, NOT the internal F5 envelope. */
export interface Event {
  readonly id: string;
  readonly type: string;
  readonly aggregateId: string;
  readonly aggregateVersion: string;
  readonly occurredAt: string;
  readonly recordedAt: string;
  readonly schemaVersion: number;
  readonly messageCode: string;
  readonly amount?: WireMoney;
  readonly operationId?: string;
}

/** Keyset pagination `(createdAt,id)`, max 100, with as-of snapshot (F1). */
export interface EventList {
  readonly items: readonly Event[];
  readonly asOf: string;
  readonly nextCursor?: string;
}

/* ------------------------------------------------------------------ */
/* Notification preferences                                            */
/* ------------------------------------------------------------------ */

/** components/schemas/NotificationPreferences — PUT-only in the frozen contract (see CONTRACT-GAPS.md). */
export interface NotificationPreferences {
  readonly locale: NotificationLocale;
  readonly marketingEmail: boolean;
  readonly marketingSms: boolean;
  readonly marketingPush: boolean;
  readonly servicePush: boolean;
  readonly timeZone: string;
  readonly expectedVersion: string;
  readonly quietHoursStart?: string;
  readonly quietHoursEnd?: string;
}

export type NotificationLocale = "en" | "fil";

const TIME_PATTERN = /^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/;
const VERSION_RE = /^[1-9][0-9]*$/;

/** Shape check for locally persisted preference drafts; the server remains authority. */
export function isNotificationPreferences(value: unknown): value is NotificationPreferences {
  if (typeof value !== "object" || value === null) return false;
  const r = value as Record<string, unknown>;
  const flagsOk =
    typeof r.marketingEmail === "boolean" &&
    typeof r.marketingSms === "boolean" &&
    typeof r.marketingPush === "boolean" &&
    typeof r.servicePush === "boolean";
  const quietOk =
    (r.quietHoursStart === undefined ||
      (typeof r.quietHoursStart === "string" && TIME_PATTERN.test(r.quietHoursStart))) &&
    (r.quietHoursEnd === undefined ||
      (typeof r.quietHoursEnd === "string" && TIME_PATTERN.test(r.quietHoursEnd)));
  return (
    flagsOk &&
    quietOk &&
    (r.locale === "en" || r.locale === "fil") &&
    typeof r.timeZone === "string" &&
    typeof r.expectedVersion === "string" &&
    VERSION_RE.test(r.expectedVersion)
  );
}

/* ------------------------------------------------------------------ */
/* Auth tokens                                                         */
/* ------------------------------------------------------------------ */

/** components/schemas/MobileTokens — bearer material; store in expo-secure-store only. */
export interface MobileTokens {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly tokenType: "Bearer";
  readonly expiresIn: number;
  readonly sessionId: string;
}
