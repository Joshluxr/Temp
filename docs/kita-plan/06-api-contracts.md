# F. API, command, event, and provider contracts

2026-11-09. [OpenAPI v1](openapi/kita-v1.yaml) is the machine contract; [operation index](evidence/operations.json) lists every operation. Feature IDs are provisional pending DEP-00. Regulatory/provider capabilities are unverified for Kita pending owner/counsel; schemas do not activate them.

## F1. Common rules

REST JSON over TLS. All money uses `{currency,minor:"50399"}`; rate numerator/denominator and displayed decimal values are strings. IDs are opaque UUIDs except vendor refs, which remain exact strings. Dates are RFC3339 UTC. Public estimate never returns an executable quote ID. Endpoint catalogs expose only approved capabilities for the requesting entity/residence/product; unknown origin-state permission fails closed.

Customer token audience is `kita-customer`; admin token audience `kita-admin`, physically separate BFF/origin. Cookie writes additionally require exact origin and CSRF token; mobile bearer writes do not use cookie CSRF. OIDC endpoints use their own nonce/state/PKCE validation. Each referenced object is checked for actor, book and purpose, even when an outer transfer is owned. Return404 for unowned customer objects; audit denied privileged actions. `Cache-Control: private,no-store` on all private responses, receipts and commands. No client may supply actor role, book ownership, paid status, rate, ledger account ID or provider credentials to a financial command.

Every mutation has `Idempotency-Key` (16–128 safe opaque characters, no PII), scoped `(book,actor,operation,key)` and canonical request hash. Store result and durable operation in transaction. Identical replay returns same result/status, including rejection where recorded; changed body returns409 `IDEMPOTENCY_MISMATCH`. Concurrent running command returns202/409 with existing operation ID according to endpoint response, never duplicate work. Financial key records are retained with financial evidence, not24-hour cache. Lookup `/v1/commands/{key}?operation=acceptTransfer` is scoped to actor and returns no other actor's data.

Versioned commands include `expectedVersion`; absent required version400, stale409 `VERSION_CONFLICT`. Cancellation/refund claim intake is an explicit exception: its version is advisory, and a stale display must not discard a valid request or reset its original receipt clock. Current-state checks still apply before executing any remedy. Admin approvals bind target version and payload. GET emits version field/ETag where supported; no generic PATCH to money state. Requests max256KiB unless explicitly approved upload/statement flow; files use scoped object upload then scan. Query pagination is opaque keyset `(createdAt,id)` with max100 and snapshot/as-of; transfer statements preserve deterministic ordering.

## F2. Errors and asynchronous semantics

Problem body: `type,title,status,code,requestId,retryable,operationId?,fieldErrors?`. Codes include `QUOTE_EXPIRED`, `QUOTE_ALREADY_ACCEPTED`, `RECIPIENT_VERSION_CHANGED`, `CAPABILITY_UNAVAILABLE`, `RATE_STALE`, `INSUFFICIENT_FUNDS`, `LIQUIDITY_UNAVAILABLE`, `FUNDING_PENDING`, `COMPLIANCE_HOLD`, `APPROVAL_REQUIRED`, `APPROVAL_STALE`, `PROVIDER_OUTCOME_UNKNOWN`, `IDEMPOTENCY_MISMATCH`, `VERSION_CONFLICT`, `LIMIT_EXCEEDED`, `POLICY_UNAVAILABLE`. Public detail does not disclose AML rules, raw provider errors, PII or stack traces.

201 transfer means accepted persisted instruction.202 operation means durable work queued; no claim of external completion. When quote/transfer command response is lost, retry same key or query operation. Network ambiguity is not an ordinary retryable business rejection. Read retry may back off; financial write retry uses identical key/payload only.429 includes Retry-After.503 on unavailable dependency preserves pending work and does not choose a fake alternative.

## F3. Critical request examples

```json
{
  "quoteId": "10000000-0000-4000-8000-000000000001",
  "recipientVersionId": "20000000-0000-4000-8000-000000000001",
  "purpose": "family_support",
  "sourceOfFunds": "salary",
  "consent": {
    "disclosureHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "termsVersion": "US-PH-2026-11-policy1",
    "locale": "en",
    "accepted": true
  }
}
```

`POST /v1/transfers` with stable key accepts only the server's quote; no amount/rate overrides. The response is the owned Transfer with immutable Quote terms, independent funding/compliance/payout/refund/dispute fields, and current allowed actions.

`POST /admin/v1/transfers/{id}/reroute-requests` contains expected version, new provider account ID, definitive nonacceptance evidence, reason code/text. It creates Approval; approver signs exact payload hash via `/approvals/{id}/decisions`. Execution revalidates before queuing new authority. An UNKNOWN prior attempt rejects the command even if the requester has finance privileges.

`POST /v1/transfers/{id}/refund-requests` specifies principal/fee/tax component claims; server calculates entitlement and remaining allocation, recognizes an obligation when owed, and issues an operation/case. Customer-requested values are claims, not authority to mint credit. Goodwill is a separate admin-approved template. All refund components carry the source currency.

## F4. Surface ownership and wiring

Public: content, corridor/payout catalogs and estimates. Identity: OIDC/session/contact/step-up, verification sessions and secure documents. Customer: recipients, drafts, quotes, acceptance, funding sessions, owned detail/timeline/SSE/receipt, cancellation/refund/error/support; wallet/rewards/alerts/schedules/bills/business endpoints behind independent product scope. Admin: queues, holds, inquiry, evidence, case/risk/filing decisions, approvals, config simulation/release, reveal/access/audit, journals, statements/breaks, treasury and reports/DLQ replay.

Every operation invokes one named domain handler in B/M; handlers call posting templates from E and algorithms from G. No admin endpoint exposes `complete`, `mark_paid_out`, `set_balance`, arbitrary journal lines, or generic transfer patch. Read projections return `allowedActions` for explanation; UI availability is not backend authorization. Supplemental operational tables/command functions are implemented before their feature can activate; core DDL does not grant broad runtime writes.

Customer SSE sends event UUID, aggregate version and redacted Event JSON, heartbeat15s; Last-Event-ID resumes from retained event cursor. If cursor is older than retention, return reset-required and fetch current state/history. Stream auth expires with session, revalidate periodically and on revocation. Reconnection never submits a new transfer. Mobile push carries opaque transfer ID and generic status, then authenticated fetch.

## F5. Internal domain event envelope

```json
{
  "event_id": "30000000-0000-4000-8000-000000000001",
  "event_type": "payout.recipient_credited",
  "schema_version": 1,
  "aggregate_type": "transfer",
  "aggregate_id": "40000000-0000-4000-8000-000000000001",
  "aggregate_version": "8",
  "book_id": "50000000-0000-4000-8000-000000000001",
  "occurred_at": "2026-11-09T12:00:00Z",
  "recorded_at": "2026-11-09T12:00:03Z",
  "correlation_id": "60000000-0000-4000-8000-000000000001",
  "causation_id": "70000000-0000-4000-8000-000000000001",
  "actor": {"type": "provider", "id": "provider-account-ref"},
  "payload": {"attempt_id": "80000000-0000-4000-8000-000000000001", "amount_minor": "2871000", "currency": "PHP", "evidence_id": "90000000-0000-4000-8000-000000000001"}
}
```

Internal envelope is not the public SSE schema. Consumers dedup `(consumer,event_id)` and detect aggregate gaps; financial consumers re-read authority rather than trusting a projection. Event types cover quote accepted, funding authorized/captured/settled/returned, eligibility held/cleared, FX executed/settled, payout accepted/debited/credited/rejected/returned, refund owed/debited/credited/failed, dispute opened/resolved, points earned/vested/redeemed/expired/reversed, config released, reconciliation break/resolved, evidence requested and security changes. Version payload schema, preserve old consumers during rolling deployments, and reject unknown financial schema versions into quarantine rather than treating fields as optional success.

## F6. Provider boundary and compatibility

Provider routes authenticate exact raw body or contracted mTLS/MAC. Generic OpenAPI webhook raw schema intentionally does not pretend every vendor uses the same signature or status codes. Adapter snapshots and contract tests define exact vendor formats; H requires those before activation. Store delivery identity and business-event identity separately. Incoming event mismatch in amount/currency/beneficiary/account is quarantined. HTTP2xx acknowledges durable receipt, not successful financial processing.

OpenAPI changes are reviewed for backward compatibility; generated TypeScript clients and runtime validators derive from the same schemas. Additive optional response fields are allowed; removing/renaming required fields or changing money types requires new API version or staged migration. Contract tests use the E/G fixtures and verify problem codes, pagination, cookies/CSRF, token audience, idempotent replay, state conflict, async recovery and unsigned callback handling. No generated client returns mock data when the server is unreachable.

## F7. Financial schema and integration acceptance

The [OpenAPI3.1 specification](https://spec.openapis.org/oas/v3.1.0.html) defines the document format. Schema validity does not prove financial or provider correctness. Validate all references, operation IDs, path parameters, examples, strict requests, security audiences and generated-client drift. The checked-in YAML is the contract to review; any generator must reproduce its reviewed schemas, including cancellation intake, explicit leg states, stablecoin units and conditional mandates, before its output may replace it.

Enforce G1's exact limits with arbitrary precision: money at most9000000000000000 minor units, positive principal/receive, nonnegative fees/tax/discount, rate numerator/denominator at most10^24. Currency and direction determine amount exponent; discount cannot exceed eligible fee. Illustrative E4 quote is50000USD principal+399fee=50399total, receiving2871000PHP. Exact-recipient PHP1000 at57.42 uses1742USD minor principal but delivers exactly100000PHP minor, with disclosed fractional rounding remainder. Fixtures are never live prices.

`createFundingSession` binds method, verified instrument/mandate and amount to accepted terms. All sessions/keys for one unresolved collection converge on its existing operation; a fresh request key must not authorize a second debit. ACH initiation produces no cash; card authorization produces no cash; capture remains receivable. Payout execution is a private worker/domain command under G5, not a client-controlled HTTP status setter. Admin inquiry/reroute/evidence operations cannot bypass that authority. Hold-before-dispatch wins; hold-after-dispatch records in-flight cancellation/inquiry. An unknown result retains authority and reservations until independent evidence resolves it.

Webhook `security: []` means there is no shared customer/workforce OpenAPI security scheme; it does **not** permit unauthenticated financial events. The mandatory `x-provider-authentication-required` extension and H's account-specific verifier govern this route. Verify exact raw bytes, account/environment, contracted timestamp/key/replay rules; preserve raw encrypted evidence and inbox before2xx. Same delivery ID/hash acknowledges existing; changed hash quarantines; distinct deliveries of one economic movement still produce one journal. Unknown codes remain quarantined. If an actual provider lacks authenticated callbacks, callbacks are inquiry hints and cannot directly become verified posting evidence. Generator/server configuration must explicitly install this ingress guard.

Treasury request is a discriminated union: fiat carries `Money`; stablecoin carries exact `atomicUnits`, issuer, contract, network, decimals and approved asset policy/allowlisted destination. Never encode token units using the fiat currency exponent. Stablecoin remains DEP-11 gated. Auto-conversion requires a funded source wallet, explicit minimum receive/net-rate, maximum source/fee/daily/total bounds, one execution and expiry at most30days under the initial policy; DEP-12 and wallet authority apply. Revocation serializes before reservation; an informational alert is not a spending mandate.

The current core SQL includes `money_operations`, wallet quotes, instruments/mandates, sessions, velocity buckets and accounting periods. T-CORE-02 completes scoped command functions and supporting constraints; T-LEDGER-02 completes approved-template/evidence/allocation/period enforcement; T-REWARD-01 constrains paired points and lot reservations. Refer to the latest E13 rather than assuming every HTTP operation is already implemented by a table definition. No broad runtime financial-table grants are acceptable.

## F8. Persistence and generated-client acceptance

[Backlog M2](13-backlog.md#m2-required-foundational-work-and-sql-follow-ons) specifies the remaining domain authority and schema controls. Core already contains sessions, instruments, mandates, rate snapshots, notification preferences, money operations and wallet quotes; full device/report/document access lifecycle records and scoped command functions still require implementation. No endpoint activates merely because its table exists. Never fabricate a remittance recipient to satisfy wallet-only activity.

Generate clients from the frozen reviewed OpenAPI hash. Verify every request/response example and compile web/native clients before contract freeze. The initial construction scripts are retired to prevent overwriting reviewed refinements. Changes require a compatibility diff, updated examples and validation on one unchanged snapshot.
