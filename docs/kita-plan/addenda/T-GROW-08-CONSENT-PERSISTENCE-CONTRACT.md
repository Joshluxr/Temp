# T-GROW-08 consent-persistence contract v1

Normative identifier: `T-GROW-08/consent-persistence/v1`.

This document transcribes the Sol BATCH-OK contract frozen in [NEXT-BATCH.md](NEXT-BATCH.md). Companion types live in `apps/kita/packages/contracts/src/communication-consent-persistence.ts` as type-only exports. SQL and application implementation remain HOLD.

Money closed. Never `ok:true`, including internal receipts and replays. No `executeCommand`. Session bind HOLD. Identity/KYC success HOLD. No G1–G6.

## 1. Scope and existing surfaces

The store records a customer's explicit, versioned replacement of communication preferences and its governing consent history. It does not dispatch notifications and does not represent delivery, financial consent, customer authentication, session binding, or KYC completion.

Marketing opt-out must remain effective at any later delivery gate. Necessary lawful service/security notices are governed separately. Recording `marketingEmail`, `marketingSms`, or `marketingPush` as true never grants a sending capability. `servicePush=false` affects optional push preference only and cannot suppress necessary lawful notices. No notification, outbox item, or provider attempt is created or changed by this store.

At this head:

- `Grow08Input` contains only `marketingCampaignDespiteOptOut`.
- `Grow07CommandContext` contains only `workId`, `attemptGeneration`, and `trace`.
- `applyCommunicationConsent` is a fail-closed checker.
- `Grow08Output` claims campaign sending and service-notice suppression.

None of those is a persistence input, authority source, or permitted return shape. Leave those types, the checker, and TEST-GROW-08 unchanged. This contract does not widen a worker context or retrofit a success branch.

The public wire remains frozen `PUT /v1/notification-preferences`, operation `updateNotificationPreferences`, and `NotificationPreferences` in [OPENAPI-FREEZE.md](OPENAPI-FREEZE.md) / `docs/kita-plan/openapi/kita-v1.yaml` (SHA-256 `f8f98d45c4c09098412da2504ed140211471859b3dee2be1d27be724d65eb49c`). This internal contract creates no HTTP endpoint, request field, response extension, or alias. The frozen schema requires a positive decimal `expectedVersion` and defines no version-zero creation or unsubscribe-token input. Therefore v1 is **update-only**: a missing preference row returns unavailable without creating a default row, consent, or session. First-row provisioning, anonymous/token unsubscribe, and public wiring need separate reviewed authorization. This contract does not close T-GROW-08.

## 2. Concrete inputs and normalization

`ConsentPreferenceChange` is a full replacement, never a partial patch. All fields are readonly.

| Field | Required contract |
|---|---|
| `locale` | Required, exactly `en` or `fil`. |
| `marketingEmail`, `marketingSms`, `marketingPush`, `servicePush` | Four required booleans describing requested preferences, never authority/evidence verdicts. |
| `timeZone` | Required exact IANA zone identifier accepted by the server's installed zone database; no host/default-zone fallback. |
| `quietHoursStart`, `quietHoursEnd` | Both absent, or both exact 24-hour `HH:mm`; reject a lone value or equal endpoints. Crossing midnight is allowed. Absence normalizes to two nulls in the stored snapshot/hash. |
| `expectedVersion` | Required canonical decimal string, positive and within PostgreSQL bigint range; compare and increment without conversion to a JavaScript number. Reject an update that would overflow. |

Unknown fields, malformed values, and missing required fields are invalid requests.

`NormalizedConsentPreferenceChange` has the same required fields with both quiet-hour fields explicitly present as string-or-null; the pair must be either two valid strings or two nulls. That normalized type is used for evidence binding and hashing. Quiet hours describe local wall-clock intervals in `timeZone`. This batch performs no scheduling or service-notice classification. No arbitrary topic/category map, extra consent flag, or caller-supplied document hash is accepted.

`ConsentPersistenceRequest` has `operation: 'updateNotificationPreferences'`, `idempotencyKey` matching `^[A-Za-z0-9_-]{16,128}$`, `instructionEvidenceRef`, and `change: ConsentPreferenceChange`.

`ConsentPersistenceContext` has only a server-provided `authorityRef` and redacted `correlationId`. The two evidence references are opaque, non-bearer internal references, not public request additions. Their brands provide no runtime authentication. No actor/customer/book selector, role, session object, `verified`, `owned`, `consentValid`, or similar authority boolean belongs in the request.

## 3. Trusted evidence provenance and lifecycle

The only acceptable authority source for v1 is the server's read-only verifier of an already bound customer session, after genuine possession verification under the frozen `customerBearer` or `customerSession` plus CSRF/origin rules. Admin audience, OIDC claim objects, decoded tokens, raw session IDs, contact verification, client assertions, and worker metadata do not substitute.

The verifier must resolve `authorityRef` from server-controlled evidence, not trust a caller-constructed structural type. Its evidence binds the exact issuer/verifier identity and version, audience `kita-customer`, purpose `notification-preferences.write`, session ID, server-selected book, customer, and verification/expiry times. Unavailable verifier or unverifiable provenance returns unavailable before any store write. This defines a consumer requirement; it does not implement a verifier or approve an issuer.

`instructionEvidenceRef` must resolve to an immutable server-controlled customer-instruction record produced only after that authority check. The record binds its issuer/version, authority/session reference, customer/book, operation, idempotency key, exact normalized change including expected version, governing document reference/version/hash/locale, server-observed instruction time, and expiry. The governing document is an immutable server-controlled communication-preference document in the same book and locale, not client text or a transfer consent. Opt-in requires an explicit affirmative instruction for the requested channel; withdrawal records the withdrawal and must never be described as marketing acceptance. No prechecked/default consent, inferred consent, or record with just `verified=true` is sufficient.

For a new attempt, require instruction time <= verification time <= transaction time < evidence expiry, with expiry no later than five minutes after the instruction time and no later than session expiry. Recheck current session revocation/expiry, ownership, and document applicability at the serialized write decision. A changed payload, version, key, purpose, audience, customer, book, or governing document cannot reuse the instruction evidence. The evidence is single-use, consumed atomically with its terminal owned write decision. Consumption binds the evidence reference to the scoped key and request hash. A second key cannot consume it again. Exact replay reads the stored outcome after fresh current authority/ownership checks and does not require the original instruction to remain fresh or consume it again.

There is no installed trusted issuer or executable resolution path in this batch. Define the record fields and required lookup semantics only. Do not issue, sign, seed, fabricate, or backfill customer/session/KYC evidence, implement token handling, or add a resolver that returns a positive verdict to unlock persistence.

## 4. Authoritative customer/book ownership

Future resolution must use current authoritative rows: the possession-verified session identifies `kita.auth_sessions.id`; require audience `kita-customer`, non-null `customer_id`, null `staff_subject`, no revocation, and an unexpired session. Join that `customer_id` to `kita.customers.id`, and that row's `book_id` to `kita.books.id`. The book must equal the trusted server-selected book. Derive actor identity as that customer ID; never derive it from `workId`, a supplied subject string, or a caller-selected ID. A foreign/missing customer or book is an ownership rejection without exposing the foreign object.

In the same serialized decision, require the existing preference row's customer to be that customer, and its governing `consents` row to have the same `(customer_id, book_id)` and communication-preference purpose. New consent, instruction evidence, receipt, and audit must carry the same pair. A session table row alone does not prove possession; a foreign key alone does not establish authenticated authority. Customer status is not KYC proof and is never changed here. Closed customers/books reject new writes; other customer statuses confer no financial permissions. New writes also require a separately approved non-money preference-write scope for the book; absent scope or a disabled book returns unavailable. This batch enables no scope or book. Recovery of an already recorded outcome still requires current authenticated ownership and conveys no new write authority.

Existing `notification_preferences` has a customer-only primary key, a global `consent_id` foreign key, and no `book_id`; these alone do not enforce the required same-customer/book consent link. Future schema/authority review must enforce that invariant and immutable customer/book ownership in storage. The instruction-consumption and scoped receipt invariants also need dedicated storage authority; generic `evidence.verified` and the existing DDL do not provide it. Record these as implementation prerequisites, without DDL, migration edits, or grants in this batch.

The refusal service's login/OID binding is confined to its fixed refusal scope in a disabled book. It is expressly unusable as customer authority or as a preference-store principal. No owner-login bypass, superuser runtime connection, broad table grant, role switch, or seeded session is permitted as a substitute.

## 5. Stored fields and atomic effects

`ConsentPreferenceSnapshot` is the normalized locale, time zone, four preference booleans, and two nullable quiet-hour endpoints, plus the positive decimal `version` and governing `consentId`. The logical record is owned by the derived `(bookId, customerId)`. Map locale/time zone/version/consent to `notification_preferences`; its JSON preferences object contains only the four named booleans and two quiet-hour values, with no arbitrary extension fields.

Each committed update appends one immutable `consents` row with server-generated ID, derived book/customer, `transfer_id=NULL`, `kind='communication_preferences'`, server-resolved `document_version`/`document_hash`, the instruction locale/time, and an opaque verified session reference in `session_ref`. Never store a raw session/token/cookie there. A false marketing preference records withdrawal, not acceptance. Link the new preference version to this exact consent, preserve the previous consent, and increment the version exactly once. An identical replacement under a new valid key/version still records a new explicit instruction and version; exact replay never does.

The logical scoped receipt stores `writeId`, book/customer/actor, operation, idempotency key, canonical request hash, instruction evidence reference, terminal disposition, original fixed outcome, and database-assigned `recordedAt`. A committed `ConsentWriteReceipt` additionally requires `consentId`, `previousVersion`, new `version`, the complete normalized preference snapshot, governing document reference/version/hash, and audit event ID. Its `recordedAt` is the stored decision timestamp, exposed only after commit confirmation, not a claimed exact COMMIT timestamp. UUID identifiers remain opaque; versions and audit IDs use decimal strings. A terminal `ConsentRejectionReceipt` contains its write ID, scoped key/hash/evidence reference, fixed error, audit ID, and recorded time, and no new preference snapshot or consent ID. These are internal store receipts, never session credentials or public command-success receipts.

One transaction must cover the preference comparison/update, append-only consent, instruction consumption, terminal receipt, and immutable audit event. Audit includes the derived owner/actor, purpose, opaque session/evidence/document refs, before/after versions, canonical request hash, disposition, and redacted correlation ID. Preserve the per-book locked hash-chain requirement in `09-admin-security.md`; trace output is not durable audit. An owned version-conflict decision records only its rejection receipt, audit, and evidence consumption, atomically; it creates no consent or preference change. Evidence-reuse conflict has `recorded:false`, creates no receipt/audit, and leaves the original consumption and outcome unchanged. Pre-authority or invalid-evidence rejection writes no customer-store record. No external call occurs inside the transaction.

No preference, consent, evidence consumption, or terminal receipt may survive a confirmed rollback independently of the others. A receipt is committed only after database commit is confirmed; returning from an INSERT or observing a trace does not establish commitment. Missing baseline preference/consent, authority, document, audit/storage primitive, or restricted connection fails closed with no fabricated replacement. The future persistence interface must operate through directly authenticated, narrowly scoped authority; designing grants/functions or adapting the existing refusal function is outside this contract batch.

Store only the listed fields and opaque references/digests. Keep destinations, message bodies, raw subject/credential data, tokens, cookies, PAN/CVV, secrets, full document text, and raw exception/configuration objects out of rows, receipts, logs, and evidence. Treat references, preference snapshots, and digests as private customer data with scoped access and approved retention/legal-hold rules; do not invent a retention duration or erase deduplication records to permit replay.

## 6. Idempotency, concurrency, and recovery

Use scope `(bookId, customerId-as-actor, 'updateNotificationPreferences', idempotencyKey)`. Compute the request hash server-side as lowercase SHA-256 over UTF-8 canonical JSON, with stable key ordering, containing exactly `{contractVersion, operation, bookId, customerId, instructionEvidenceRef, change}`. `contractVersion` is `T-GROW-08/consent-persistence/v1`; `change` contains the normalized fields above including expected version and both nullable quiet-hour values. The immutable instruction reference binds the governing document. Exclude trace/correlation data, current authority/session refresh metadata, and attempt times, so a freshly authenticated session for the same owner can recover an earlier result. No caller-supplied hash is authoritative.

After current authority/ownership checks, serialize by scoped key and target customer preference; serialize single-use instruction consumption and the audit anchor as well, in a documented stable lock order. Resolve an existing scoped receipt before applying current-version, instruction-freshness, or current write-enable checks for a new attempt. Same scope/hash returns the original terminal receipt/error with a replay marker and zero new durable effects. Changed hash returns `IDEMPOTENCY_MISMATCH` and never overwrites the original record. Fresh current authentication cannot expand the original owner scope. Another customer's/book's key is never observable.

For a new key, validate all instruction/document/write-scope requirements, compare `expectedVersion` with the locked current version, then make one atomic terminal decision. Stale or future version returns a durable `VERSION_CONFLICT`; retrying that key cannot later become a write after the row changes. Concurrent identical calls yield one terminal decision and replays; different valid keys against the same version yield at most one preference update. Reused evidence under a different key is a conflict. Authorization/shape failures and unavailable dependencies before a terminal decision have no terminal receipt; they are not claimed as durably rejected. A mismatch against an existing key does not create or alter its receipt.

A lost connection or ambiguous COMMIT yields `unconfirmed`, never `committed`, `rolled_back`, or a fresh-key retry instruction. Recovery uses the identical key/hash and fresh current authority, reads the scoped terminal record through independent restricted authority, and establishes transaction settlement before any further attempt. Preserve an existing committed result even if release/close later fails, while retaining the cleanup failure as separate redacted evidence. Before any implementation handoff, specify bounded settlement/lock timeout handling and prove rollback/cleanup for every started operation; no retry-after-timeout may assume rollback.

## 7. Outcomes with literal `ok:false`

`ConsentPersistenceOutcome` is a closed discriminated union. Every arm has literal `ok:false`, a required fixed-shape error, and a `persistence.state` from the table below. No arm is wrapped in `Result<ConsentWriteReceipt>` or returned through `ok()`. No outcome contains financial/session/delivery success flags. Error details are fixed and credential-free; identifiers/snapshots appear only in the authorized internal receipts specified above.

| `persistence.state` | Required meaning and error |
|---|---|
| `committed` | Confirmed preference-store commit only; requires the complete `ConsentWriteReceipt` and `replayed` boolean. Both first return and exact replay retain `CAPABILITY_UNAVAILABLE`, status 503, `retryable:false`, detail `Command execution is unavailable.` No command or delivery success is implied. |
| `conflict` | `VERSION_CONFLICT` / 409 / false / `Preference version conflicts.` requires `recorded:true`, the terminal `ConsentRejectionReceipt` and `replayed` boolean. `IDEMPOTENCY_MISMATCH` / 409 / false / `Idempotency key conflicts.` and `stale_or_conflicting_command` / 409 / false / `Instruction evidence was already consumed.` have `recorded:false` and no receipt. No committed preference receipt in any conflict arm. |
| `rejected` | `invalid_request` / 400 / false / `Invalid preference request.`; `unauthenticated` / 401 / false / `Customer authentication required.`; `unauthorized` / 403 / false / `Preference authority denied.`; or `not_found` / 404 / false / `Owned preference resource unavailable.` These pre-write rejections have `recorded:false` and no receipt. Missing/unowned customer resources share the same outward detail. |
| `unavailable` | Missing verifier, governing document, baseline row or storage dependency before any possible write: `dependency_unavailable` / 503 / true / `Consent persistence dependency unavailable.` Disabled/unapproved write scope: `CAPABILITY_UNAVAILABLE` / 503 / false / `Consent persistence is unavailable.` A dependency failure after a confirmed rollback also uses this state only with zero surviving effects. No receipt or durable-effect claim. |
| `unconfirmed` | `dependency_unavailable` / 503 / false / `Consent persistence is unconfirmed; recover using the same key.` No receipt, rollback assertion, or fabricated operation ID. Distinct from known unavailability; recovery must settle the original attempt. |

Missing/invalid session possession is `unauthenticated`; a proven wrong audience/purpose, expired instruction, tampered instruction binding, or closed customer/book is `unauthorized`. Missing/unowned customer, book, or referenced customer-owned evidence is `not_found` without disclosing existence. An unavailable verifier/source or an inconsistent baseline consent link is `unavailable`; it never becomes trusted evidence. A terminal rejection replay returns its original fixed error/disposition, not a newly evaluated verdict. Neither a persisted refusal nor `persistence.state='committed'` opens any held capability. These internal persistence distinctions are not additions to the frozen public Problem or NotificationPreferences response. The existing `applyCommunicationConsent` behavior remains unchanged, including its current 409/503 envelopes.

## 8. Required review and later implementation gate

The contract deliverables must cross-reference the exact existing schema/context/OpenAPI sources, list the unavailable authority producer and storage gaps, and encode all input, evidence, ownership, snapshot, receipt, and outcome types above without runtime behavior. No `unknown`/open record may erase a normative field, no optional evidence may bypass a check, and no boolean checker is an acceptable deliverable. Review documentation/type agreement and compatibility against the frozen wire. Contract acceptance establishes specification completeness only, with no claim of persisted customer data or TEST-GROW-08 closure.

SQL/application implementation requires a new reviewed handoff after this contract exists, naming an exact source base and finite file allowlist. It must provide genuine trusted authority or explicitly keep customer writes unavailable; choose the restricted persistence authority and supplemental constraints/receipt/consumption storage; settle audit locking, timeout, and failure-cleanup details; and disposition the refusal acceptance findings retained in NEXT-BATCH.md. No automatic second phase, migrations, application wiring, or evidence seeding follows from this BATCH-OK.

That later handoff must require independent committed-row/consent/receipt/audit checks, exact replay and changed-body conflict, stale/future version, evidence expiry/consumption/reuse, revoked/foreign session and cross-book/customer/document/consent failures, missing baseline/dependency, concurrent same-key and competing-version calls, rollback at every write boundary, lost-COMMIT recovery, cleanup-failure retention, and restricted-login/privilege evidence. Rejections must demonstrate zero unauthorized preference effects. Tests must distinguish actual database persistence from an `ok:false` envelope or checker verdict. Delivery/service-notice behavior remains a separate connected-flow gate.

## Cross-references

- Frozen OpenAPI: [OPENAPI-FREEZE.md](OPENAPI-FREEZE.md)
- T-CORE-02 hold: [T-CORE-02-BATCH.md](T-CORE-02-BATCH.md)
- Identity review: [../SOL-IDENTITY-REVIEW.md](../SOL-IDENTITY-REVIEW.md)
- Existing fail-closed checker: `apps/kita/packages/domain/notifications/apply-communication-consent.ts`
- Existing Grow08 types: `apps/kita/packages/contracts/src/notifications.ts`
- Core DDL `notification_preferences` / `consents` / `auth_sessions`: `apps/kita/packages/database/migrations/001_core.sql`

## Unavailable at this head

- Trusted customer-session evidence producer / verifier implementation
- Instruction-evidence issuer
- Same-customer/book preference+consent storage enforcement
- Instruction consumption and scoped receipt storage
- Preference-write book scope enablement
- SQL/application persistence of this contract
