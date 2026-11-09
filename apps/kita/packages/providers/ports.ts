/**
 * @kita/providers — frozen canonical provider PORT contracts (T-CONTRACT-01).
 *
 * Authority: docs/kita-plan/08-providers.md §H2 (port table + result union),
 * 06-api-contracts.md §F6 (provider boundary), and 13-backlog.md
 * T-CONTRACT-01 / T-ADAPTER-01. This file is the port TYPE surface only:
 * transport, evidence verification implementations and capability catalogs
 * are T-ADAPTER-01 work; concrete vendor adapters remain DISABLED gates in
 * @kita/domain/providers until their DEP certification passes.
 *
 * Invariants encoded here (§H2/§F6/F7):
 * - Every adapter result is exactly Confirmed | Pending | Rejected | Unknown
 *   | Unsupported. Network/transport failure maps to Unknown, NEVER Rejected.
 * - Rejected carries definitiveNonacceptance: true — a guess of rejection is
 *   not representable in this type.
 * - HTTP 2xx acknowledges durable receipt of a callback, not successful
 *   financial processing; unauthenticated callbacks are inquiry hints only.
 * - Transport auth material never appears in evidence or logs.
 */

import type { CommandMoney, CommandRate } from '../contracts/src/commands.ts';

/* ------------------------------------------------------------------ *
 * Canonical outcome union (§H2) — single source of truth
 * ------------------------------------------------------------------ */

export type ProviderOutcome<TEvidence = ProviderEvidence> =
  | { readonly kind: 'Confirmed'; readonly evidence: TEvidence }
  | { readonly kind: 'Pending'; readonly providerRef: string; readonly nextInquiryAt: string }
  | { readonly kind: 'Rejected'; readonly code: string; readonly definitiveNonacceptance: true }
  | { readonly kind: 'Unknown'; readonly reference: string }
  | { readonly kind: 'Unsupported'; readonly capability: string };

/** Outcome kinds the union permits; anything outside this list fails mapping. */
export const PROVIDER_OUTCOME_KINDS: readonly ProviderOutcomeKind[] = [
  'Confirmed',
  'Pending',
  'Rejected',
  'Unknown',
  'Unsupported',
] as const;

export type ProviderOutcomeKind = (typeof PROVIDER_OUTCOME_KINDS)[number];

/** Persisted identity of one piece of provider-supplied evidence (§F5 payload refs). */
export interface ProviderEvidence {
  /** kita.evidence.id — verified flag is set by the evidence pipeline, not the adapter. */
  readonly evidenceId: string;
  readonly externalEventId: string;
  readonly bodyHash: string;
}

/* ------------------------------------------------------------------ *
 * Shared request/reference shapes
 * ------------------------------------------------------------------ */

/** Immutable outbound request identity; hash persisted with the attempt (§H2). */
export interface ImmutableProviderRequest<TPayload = Readonly<Record<string, unknown>>> {
  readonly providerAccountId: string;
  readonly environment: 'sandbox' | 'production';
  readonly operation: string;
  readonly idempotencyReference: string;
  readonly payload: TPayload;
}

export interface ProviderReference {
  readonly providerAccountId: string;
  readonly externalRef: string;
}

/** Callback verification verdict. `Hint` = unauthenticated: inquiry-only, never posting evidence (§F7). */
export type WebhookVerification =
  | { readonly kind: 'Verified'; readonly deliveryId: string; readonly rawHash: string }
  | { readonly kind: 'Duplicate'; readonly deliveryId: string }
  | { readonly kind: 'Quarantined'; readonly reason: 'signature' | 'replay' | 'account' | 'schema' | 'payload-mismatch' }
  | { readonly kind: 'Hint'; readonly reason: 'unauthenticated_callback' };

/* ------------------------------------------------------------------ *
 * Ports (§H2 table, method-for-method)
 * ------------------------------------------------------------------ */

export interface FundingPort {
  createHostedSession(
    input: { readonly customer: string; readonly instrumentType: string; readonly returnUri: string },
  ): Promise<ProviderOutcome>;
  createMandate(input: { readonly termsHash: string; readonly consent: Readonly<Record<string, unknown>> }): Promise<ProviderOutcome>;
  verifyOwnership(reference: ProviderReference): Promise<ProviderOutcome>;
  authorize(input: { readonly reference: string; readonly amount: CommandMoney; readonly token: string }): Promise<ProviderOutcome>;
  capture(input: { readonly reference: string; readonly amount: CommandMoney }): Promise<ProviderOutcome>;
  void(input: { readonly reference: string }): Promise<ProviderOutcome>;
  collect(input: { readonly reference: string; readonly amount: CommandMoney; readonly token: string }): Promise<ProviderOutcome>;
  inquire(reference: ProviderReference): Promise<ProviderOutcome>;
  refund(input: { readonly originalRef: string; readonly reference: string; readonly amount: CommandMoney }): Promise<ProviderOutcome>;
  fetchStatements(cursor?: string): Promise<ProviderOutcome>;
  verifyWebhook(raw: Uint8Array, headers: Headers): Promise<WebhookVerification>;
}

export interface FxPort {
  getIndicativeRate(pair: string): Promise<ProviderOutcome<CommandRate>>;
  firmQuote(input: { readonly pair: string; readonly amount: CommandMoney; readonly valueDate: string }): Promise<ProviderOutcome>;
  execute(input: { readonly quoteRef: string; readonly reference: string }): Promise<ProviderOutcome>;
  inquireTrade(reference: ProviderReference): Promise<ProviderOutcome>;
  balances(): Promise<ProviderOutcome>;
  fetchStatements(cursor?: string): Promise<ProviderOutcome>;
}

export interface PayoutPort {
  capabilities(): Promise<ProviderOutcome>;
  catalog(): Promise<ProviderOutcome>;
  validateRecipient(snapshot: Readonly<Record<string, unknown>>): Promise<ProviderOutcome>;
  quote(input: { readonly corridor: string; readonly destinationAmount: CommandMoney }): Promise<ProviderOutcome>;
  create(request: ImmutableProviderRequest): Promise<ProviderOutcome>;
  confirm(input: { readonly transactionRef: string }): Promise<ProviderOutcome>;
  inquireByExternalReference(reference: ProviderReference): Promise<ProviderOutcome>;
  cancel(input: { readonly transactionRef: string }): Promise<ProviderOutcome>;
  returns(cursor?: string): Promise<ProviderOutcome>;
  balances(): Promise<ProviderOutcome>;
  fetchStatements(cursor?: string): Promise<ProviderOutcome>;
  verifyWebhook(raw: Uint8Array, headers: Headers): Promise<WebhookVerification>;
}

export interface IdentityPort {
  createSession(input: { readonly subject: string; readonly policy: string; readonly returnUri: string }): Promise<ProviderOutcome>;
  getDecision(sessionRef: string): Promise<ProviderOutcome>;
  getEvidence(sessionRef: string): Promise<ProviderOutcome>;
  requestAdditionalEvidence(sessionRef: string): Promise<ProviderOutcome>;
  deleteEligibleData(subjectRef: string): Promise<ProviderOutcome>;
  verifyWebhook(raw: Uint8Array, headers: Headers): Promise<WebhookVerification>;
}

export interface ScreeningPort {
  screen(input: { readonly subject: string; readonly lists: readonly string[]; readonly policyVersion: string }): Promise<ProviderOutcome>;
  subscribeMonitoring(subjectRef: string): Promise<ProviderOutcome>;
  listDeltas(cursor?: string): Promise<ProviderOutcome>;
  getCaseEvidence(caseRef: string): Promise<ProviderOutcome>;
  unsubscribe(subjectRef: string): Promise<ProviderOutcome>;
}

export interface NotificationsPort {
  send(input: {
    readonly templateVersion: string;
    readonly destinationToken: string;
    readonly locale: string;
    readonly parameters: Readonly<Record<string, string>>;
    readonly eventKey: string;
  }): Promise<ProviderOutcome>;
  status(deliveryRef: string): Promise<ProviderOutcome>;
  parseDelivery(raw: Readonly<Record<string, unknown>>): ProviderOutcome;
}

/* ------------------------------------------------------------------ *
 * Outcome mapping safety (§H2: network errors cannot return Rejected)
 * ------------------------------------------------------------------ */

/**
 * Fail-closed mapper for adapter implementations: converts a thrown transport
 * error into Unknown (never Rejected, never a manufactured success). Adapters
 * must route every exception through this before returning.
 */
export function outcomeFromTransportFailure(reference: string, _cause: unknown): ProviderOutcome<never> {
  return { kind: 'Unknown', reference };
}
