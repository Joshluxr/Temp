/**
 * @kita/contracts — frozen shared EVENT envelope and registries (T-CONTRACT-01).
 *
 * Authority: docs/kita-plan/06-api-contracts.md §F5 (internal domain event
 * envelope), §G4 attempt state machines in 07-algorithms.md, the
 * `attempt_edges` seed in docs/kita-plan/sql/001_core.sql, and the Event
 * component of the frozen OpenAPI document. This file is a TYPE + REGISTRY
 * surface only: no outbox publisher, no consumer inbox, no reducer logic
 * (those are T-CORE-02/T-LEDGER-02 work) and no journal posting.
 *
 * Rules encoded here (§F5):
 * - The internal envelope is NOT the public SSE schema; SSE carries the
 *   OpenAPI `Event` component with redacted payload.
 * - Consumers dedup on (consumer, event_id) and detect aggregate gaps.
 * - Unknown financial schema versions go to quarantine, never optional success.
 */

import type { UUID, Instant } from './context.ts';

/* ------------------------------------------------------------------ *
 * Internal envelope (wire JSON keys are snake_case per §F5)
 * ------------------------------------------------------------------ */

export type EventActorType = 'customer' | 'staff' | 'system' | 'worker' | 'provider';

export interface EventActor {
  readonly type: EventActorType;
  /** Opaque actor id, or an exact vendor reference string for provider actors. */
  readonly id: string;
}

/**
 * Frozen internal domain event envelope. `payload` is validated against the
 * per-event-type schema registered under its (event_type, schema_version);
 * unknown financial versions quarantine rather than treating fields as
 * optional success (§F5).
 */
export interface DomainEvent<TPayload = Readonly<Record<string, unknown>>> {
  readonly event_id: UUID;
  readonly event_type: DomainEventType;
  readonly schema_version: number;
  readonly aggregate_type: EventAggregateType;
  readonly aggregate_id: UUID;
  /** Decimal string; monotonic per aggregate (§F5 example "8"). */
  readonly aggregate_version: string;
  readonly book_id: UUID;
  readonly occurred_at: Instant;
  readonly recorded_at: Instant;
  readonly correlation_id: UUID;
  readonly causation_id?: UUID;
  readonly actor: EventActor;
  readonly payload: TPayload;
}

export type EventAggregateType =
  | 'transfer'
  | 'funding_attempt'
  | 'fx_trade'
  | 'payout_attempt'
  | 'refund_attempt'
  | 'dispute'
  | 'wallet'
  | 'points_account'
  | 'configuration'
  | 'reconciliation'
  | 'evidence'
  | 'security';

/* ------------------------------------------------------------------ *
 * Frozen event-type registry (§F5 coverage list, concrete names)
 * ------------------------------------------------------------------ */

/**
 * Every internal event_type workers may emit or consume. Adding a type
 * requires a reviewed contract-freeze change; consumers must fail closed on
 * unknown types (quarantine), not treat them as optional success.
 */
export const DOMAIN_EVENT_TYPES: readonly DomainEventType[] = [
  // quote lifecycle
  'quote.accepted',
  // funding leg
  'funding.authorized',
  'funding.captured',
  'funding.settled',
  'funding.returned',
  // eligibility / holds
  'eligibility.held',
  'eligibility.cleared',
  // FX leg
  'fx.executed',
  'fx.settled',
  // payout leg
  'payout.accepted',
  'payout.debited',
  'payout.credited',
  'payout.rejected',
  'payout.returned',
  // refund leg
  'refund.owed',
  'refund.debited',
  'refund.credited',
  'refund.failed',
  // disputes
  'dispute.opened',
  'dispute.resolved',
  // points / rewards
  'points.earned',
  'points.vested',
  'points.redeemed',
  'points.expired',
  'points.reversed',
  // configuration
  'config.released',
  // reconciliation
  'reconciliation.break_opened',
  'reconciliation.break_resolved',
  // evidence
  'evidence.requested',
  // security changes
  'security.session_revoked',
  'security.credentials_changed',
  'security.privilege_granted',
] as const;

export type DomainEventType = (typeof DOMAIN_EVENT_TYPES)[number];

/** Current frozen schema version per event type; bump additively with review. */
export const DOMAIN_EVENT_SCHEMA_VERSIONS: Readonly<Record<DomainEventType, number>> = Object.fromEntries(
  DOMAIN_EVENT_TYPES.map((t) => [t, 1]),
) as Record<DomainEventType, number>;

/* ------------------------------------------------------------------ *
 * Attempt legs and state machines (§G4 / attempt_edges seed)
 * ------------------------------------------------------------------ */

export type AttemptLeg = 'funding' | 'fx' | 'payout' | 'refund';

export type FundingState =
  | 'queued' | 'submitting' | 'pending' | 'authorized' | 'captured' | 'settled'
  | 'returned' | 'rejected' | 'cancelled' | 'unknown';
export type FxState = 'queued' | 'submitting' | 'accepted' | 'settled' | 'rejected' | 'cancelled' | 'unknown';
export type PayoutState =
  | 'queued' | 'submitting' | 'accepted' | 'pending' | 'paid' | 'partially_returned'
  | 'returned' | 'rejected' | 'cancelled' | 'unknown';
export type RefundState =
  | 'queued' | 'submitting' | 'pending' | 'paid' | 'returned' | 'rejected' | 'cancelled' | 'unknown';

/**
 * One legal transition of an attempt state machine. `evidenceRequired` mirrors
 * attempt_edges.evidence_required: the transition needs NEW verified evidence
 * bound to the attempt (guard_attempt_transition() rejects it otherwise).
 * Reaching `unknown` is evidence-free by design (transport ambiguity is a fact
 * about our observation, not a provider attestation).
 */
export interface AttemptEdge {
  readonly leg: AttemptLeg;
  readonly from: string;
  readonly to: string;
  readonly evidenceRequired: boolean;
}

/**
 * Verbatim mirror of the attempt_edges seed in docs/kita-plan/sql/001_core.sql
 * (explicit VALUES plus the CROSS JOIN exception block). The DB trigger remains
 * the authority; this registry exists so reducers, adapters and tests share one
 * frozen vocabulary instead of private state lists.
 */
export const ATTEMPT_EDGES: readonly AttemptEdge[] = [
  // funding
  { leg: 'funding', from: 'queued', to: 'submitting', evidenceRequired: false },
  { leg: 'funding', from: 'submitting', to: 'pending', evidenceRequired: true },
  { leg: 'funding', from: 'submitting', to: 'unknown', evidenceRequired: false },
  { leg: 'funding', from: 'pending', to: 'authorized', evidenceRequired: true },
  { leg: 'funding', from: 'authorized', to: 'captured', evidenceRequired: true },
  { leg: 'funding', from: 'pending', to: 'settled', evidenceRequired: true },
  { leg: 'funding', from: 'captured', to: 'settled', evidenceRequired: true },
  { leg: 'funding', from: 'settled', to: 'returned', evidenceRequired: true },
  { leg: 'funding', from: 'captured', to: 'returned', evidenceRequired: true },
  // fx
  { leg: 'fx', from: 'queued', to: 'submitting', evidenceRequired: false },
  { leg: 'fx', from: 'submitting', to: 'accepted', evidenceRequired: true },
  { leg: 'fx', from: 'accepted', to: 'settled', evidenceRequired: true },
  { leg: 'fx', from: 'submitting', to: 'unknown', evidenceRequired: false },
  // payout
  { leg: 'payout', from: 'queued', to: 'submitting', evidenceRequired: false },
  { leg: 'payout', from: 'submitting', to: 'accepted', evidenceRequired: true },
  { leg: 'payout', from: 'submitting', to: 'unknown', evidenceRequired: false },
  { leg: 'payout', from: 'accepted', to: 'paid', evidenceRequired: true },
  { leg: 'payout', from: 'accepted', to: 'pending', evidenceRequired: true },
  { leg: 'payout', from: 'pending', to: 'paid', evidenceRequired: true },
  { leg: 'payout', from: 'paid', to: 'partially_returned', evidenceRequired: true },
  { leg: 'payout', from: 'paid', to: 'returned', evidenceRequired: true },
  { leg: 'payout', from: 'partially_returned', to: 'returned', evidenceRequired: true },
  // refund
  { leg: 'refund', from: 'queued', to: 'submitting', evidenceRequired: false },
  { leg: 'refund', from: 'submitting', to: 'pending', evidenceRequired: true },
  { leg: 'refund', from: 'submitting', to: 'unknown', evidenceRequired: false },
  { leg: 'refund', from: 'pending', to: 'paid', evidenceRequired: true },
  { leg: 'refund', from: 'paid', to: 'returned', evidenceRequired: true },
  // exception transitions: definitive non-acceptance always requires evidence
  ...(['funding', 'fx', 'payout', 'refund'] as const).flatMap((leg) =>
    (['submitting', 'pending', 'unknown', 'accepted', 'authorized'] as const).flatMap((from) => [
      { leg, from, to: 'rejected', evidenceRequired: true } as AttemptEdge,
      { leg, from, to: 'cancelled', evidenceRequired: true } as AttemptEdge,
    ]),
  ),
];

export function isLegalAttemptTransition(leg: AttemptLeg, from: string, to: string): boolean {
  return ATTEMPT_EDGES.some((e) => e.leg === leg && e.from === from && e.to === to);
}

export function attemptTransitionRequiresEvidence(leg: AttemptLeg, from: string, to: string): boolean {
  const edge = ATTEMPT_EDGES.find((e) => e.leg === leg && e.from === from && e.to === to);
  if (!edge) throw new Error(`illegal attempt transition: ${leg} ${from}->${to}`);
  return edge.evidenceRequired;
}
