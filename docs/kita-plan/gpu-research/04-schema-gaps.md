# 04 — Schema gaps: MySQL drizzle archive vs required ledger / holds / outbox / approvals

Date: 2026-11-09 · Method: static read of DDL + server code; **no database connection, no migration executed, no DDL authored here.** Research and verification only.

Consolidated from `_scratch/coder-04.md` (ledger half, 16-capability matrix), `coder-09.md` (workflows/holds/approvals/outbox, 14 missing tables), `coder-19.md` (dialect decision, bounded contexts, M0–M6 gates, `001_core.sql` defect list), `coder-16.md` (packaging root cause for the missing SQL). Paths relative to `docs/kita-sources/kimi-archive/app/` unless prefixed `docs/kita-plan/`.

---

## 1. The two dialects and which one is authoritative

| Dimension | Archive (`db/schema.ts`, 14 tables) | Plan (`docs/kita-plan/sql/001_core.sql`, 38,112 B, 165 physical lines, 65 CREATE statements) | Conflict |
|---|---|---|---|
| Engine | **MySQL** — `drizzle.config.ts:12 dialect:"mysql"`, `drizzle-orm/mysql-core`, `api/queries/connection.ts:1` `drizzle-orm/mysql2` `mode:"planetscale"` | **PostgreSQL 18** — `CREATE SCHEMA kita`, `bytea`, `timestamptz`, `numeric(38,0)`, `jsonb`, `gen_random_uuid()`, `txid_current()`, `pg_advisory_xact_lock`, `SECURITY DEFINER`, `CREATE CONSTRAINT TRIGGER … DEFERRABLE INITIALLY DEFERRED` | Direct |
| Deployable DDL | **none exists** (§2) | complete single-shot `BEGIN;…COMMIT;` | Yes |
| Money | `decimal(18,2)` / `decimal(20,2)` (`schema.ts:50-56,77-81,146`) | `bigint` minor units + `currencies.exponent CHECK(0..6)` | Representation change |
| Rates | `decimal(14,6)` | `rate_numerator`/`rate_denominator numeric(38,0)` rational pair | Decimal rate is lossy |
| IDs | mixed `serial` AUTO_INCREMENT + `varchar(36)` nanoid | `uuid` + `gen_random_uuid()`; bigint identity only for `audit_events` | Type widening |
| Timestamps | MySQL `timestamp`: **2038 ceiling**, session-timezone conversion, second precision by default | `timestamptz` + separate `posting_date` | Semantic change |
| Entity scoping | none — one global implicit entity | mandatory `book_id` with composite `(id,book_id)` FKs | Archive has no book concept |
| Constraints | **0 FK, 0 CHECK, 0 triggers**, 17 indexes | dozens of FK/CHECK + immutability/guard triggers + role grants | Yes |
| Enums | native MySQL `enum(...)` × 12 | `text CHECK(col IN (…))` | enum→check safe, reverse not |
| Write authority | app writes tables directly via Drizzle | runtime roles get **no** table DML; `post_journal()` is sole posting entry | Architectural inversion |
| Collation pinning | snapshot reports `charset:null`, `collate:null`, `engine:null` on all 14 tables | explicit | Unbounded deploy variable in archive |

Resolution already recorded in the plan, not invented here: `docs/kita-plan/README.md` **ADR-03** "replace MySQL persistence"; **ADR-14** "no production import of sandbox cash, KYC approvals, points, or provider references"; `docs/kita-plan/01-architecture.md:7,11`.

### coder-19 recommendation (verbatim conclusion)
**Move to PostgreSQL as the authoritative financial store; do not retain MySQL.** Decisive because three of `001_core.sql`'s strongest controls have **no MySQL equivalent**: `DEFERRABLE INITIALLY DEFERRED` constraint triggers (MySQL parses `DEFERRABLE` and silently ignores it under InnoDB), PL/pgSQL `SECURITY DEFINER` posting boundary with per-table `REVOKE`, and transaction-scoped advisory locks (`GET_LOCK()` is session-scoped only). Also relevant: JSONB+GIN, exclusion constraints, `SKIP LOCKED` for outbox claim without a second queue.

Honest costs stated by coder-19: re-targeting `drizzle-orm/mysql2` wiring; day-2 Postgres operations (vacuum/bloat on append-heavy journals, PgBouncer transaction-mode session-state trap, RDS Proxy pinning); correctness concentrating in DB triggers the team did not write and has not reviewed.

Strongest counterargument on record: the same invariants could be kept in TypeScript on MySQL where they are versioned, tested and diffable ("balance-before-commit + unique idempotency key"). Mitigation if Postgres is kept anyway: treat every trigger/function as a first-class reviewed artifact with dedicated property tests, and refuse any constraint that cannot also be reproduced in application code.

Second-order point: the dialect decision must not be entangled with the framework decision — even under Postgres the archive's Hono/tRPC/Drizzle API does not survive (`01-architecture.md:7` removes tRPC in favour of OpenAPI 3.1), and keeping Drizzle would not require keeping MySQL.

---

## 2. Blocker 0 — there is no source schema to migrate *from*

Actual contents of `db/migrations/`:

```
db/migrations/.gitkeep                     0 B
db/migrations/meta/_journal.json          228 B
db/migrations/meta/0000_snapshot.json  38,559 B
```

`_journal.json:9` declares `"tag": "0000_daily_archangel"` with `"dialect": "mysql"`, but **`0000_daily_archangel.sql` does not exist** (`find . -name "*.sql"` → empty).

Root cause, reproduced rather than assumed (coder-16): `.gitignore:33` contains `db/migrations/*.sql`, and

```
git check-ignore -v docs/kita-sources/kimi-archive/app/db/migrations/0000_daily_archangel.sql
→ app/.gitignore:33:db/migrations/*.sql
```

Consequences:
1. `npm run db:migrate` fails with ENOENT (drizzle-kit resolves the journal tag then opens a missing file). `npm run db:push` works because it diffs a live DB against `schema.ts` and ignores the journal — so the archive can only ever be provisioned by drift-diffing, which is not reproducible, not reviewable, and not CI-runnable from a clean checkout. Note the README itself prescribes `db:push`, implicitly conceding this.
2. Journal timestamp `when: 1794250115776` ≈ 2026-11-09 (the plan baseline date); journal `version:"7"` with snapshot `version:"5"` is a real drizzle-kit pairing, so a genuine `generate` run happened and its SQL output was lost or never committed.
3. No `0001_*`, no `meta/0001_snapshot.json` → exactly one snapshot-only generation, zero incremental history.
4. Chart of accounts bootstrapped by application code at first use (`core.ts:105-114 getOrCreateAccount`), not by reviewed migration. Account identity is a function of execution order.
5. Because the SQL was never written, charset/collation/engine were never pinned anywhere → non-deterministic deploys.

**Therefore: nobody can prove `schema.ts` ever matched a real database. There is no ground truth to migrate from.** coder-19's requirement stands: before any target migration, capture live source DDL (`SHOW CREATE TABLE` per table + data dictionary) and reconcile against `schema.ts`; until then every mapping below is provisional.

---

## 3. Structural findings common to every gap

| Finding | Evidence |
|---|---|
| `db/relations.ts` is `import {} from "./schema";` — **one line, zero relations declared** | entire file; only consumer `api/queries/connection.ts:4,6`, which spreads it into the schema map giving a false impression relations exist |
| Zero foreign keys | `grep -c ".references(" db/schema.ts` → 0; snapshot `foreignKeys:{}` on all 14 tables. Every cross-table ref (`transfers.userId`, `ledgerEntries.accountId`, `approvalRequests.requestedBy`) is a bare bigint/varchar |
| Zero CHECK constraints | snapshot `checks:{}` everywhere |
| Zero row locks | grep `FOR UPDATE` over `api/` → nothing |
| `version` columns decorative | present at `schema.ts:89,199`; incremented at `remittance-router.ts:224,286`, `admin-router.ts:88`, `:279`; **never appears in a WHERE predicate**; absent entirely from `ledger_transactions`, `ledger_entries`, `recipients`, `kyc_cases` |
| Unique indexes are collation-case-insensitive | `users.unionId`, `transfers.reference`, `ledger_transactions.idempotencyKey`, `configurations.configKey` UNIQUE with unspecified collation → `ABC`/`abc` collide |
| NULL-distinctness gap | `ledger_account_unique(ownerType,ownerId,name,currency)` (`schema.ts:125`) — MySQL treats NULLs as distinct, unlike the target's `UNIQUE NULLS NOT DISTINCT` |
| PII in plaintext | `recipients.accountReference varchar(255)` (`schema.ts:39`); display masks last-4 (`remittance-router.ts:124`) but the row does not |
| `updatedAt` ORM-side only | Drizzle `.$onUpdate(() => new Date())`, no `ON UPDATE CURRENT_TIMESTAMP` → any write bypassing Drizzle leaves it stale |
| Free-text state leakage | `transfers.pausedFromStatus varchar(32)` (`schema.ts:76`) is not the status enum; typo-prone resume target |
| Dead vocabulary | `ledger_transactions.status 'reversed'` (`schema.ts:132`) never written; `transfers.status 'requires_payment'` (`schema.ts:72`) never entered — wallet-insufficient transfers are rejected outright (`remittance-router.ts:177-179`) |

---

## 4. Required capabilities: present / partial / absent

Coder-04's 16-capability ledger matrix, consolidated (verdicts preserved; details cited inline).

| # | Capability | Verdict | Why |
|---|---|---|---|
| 1 | Immutable balanced double-entry journal | **PARTIAL — dangerously** | Structure exists (`ledger_transactions` header + `ledger_entries` with `direction enum('debit','credit')`). Balance rule lives **only in TypeScript**: `core.ts:131-142` requires ≥2 entries, buckets per currency in integer cents, throws `Unbalanced ${currency} ledger transaction`. Zero DB enforcement — any path skipping `recordLedger` writes an unbalanced journal and MySQL accepts it. Arithmetic uses JS floats (`Number(entry.amount)`, `Math.round(x*100)`). Entries remain mutable/deletable, so "immutable" fails outright |
| 2 | Running balance vs derived | **ABSENT** | No `account_balances`, no balance column, no materialized view. `walletBalance` reduces all entries in JS per read (`core.ts:327-337`). No O(1) availability check, no non-negative guard, no statement cut-off, no way to detect mutation of a historical entry |
| 3 | Fixed-point integer minor units | **ABSENT** | Pipeline is `decimal → string → float → string → decimal` (`core.ts:41-42,133,152`). No `currencies` table, so the minor-unit exponent (JPY=0 etc.) is encoded nowhere. `decimal(20,2)` range exceeds 2^53, so even a correct integer migration needs care |
| 4 | Currency + FX rate snapshot per transaction | **PARTIAL/mostly ABSENT** | `ledger_entries.currency varchar(3)` exists; but `transfers` and `quotes` have **no currency columns at all** — send vs receive inferred from convention. Rates are bare decimals, not rationals. No rate-source/snapshot identity links a transfer to the published print that produced its customer rate. `quoteId` has no FK so the authorizing quote can drift or vanish. No `disclosure_hash`, so what was shown to the customer is unprovable |
| 5 | Idempotency keys | **PARTIAL — archive's strongest control** | `ledger_transactions.idempotencyKey varchar(100) NOT NULL UNIQUE` (`schema.ts:133`) genuinely enforced; dedupe SELECT at `core.ts:128-130`. Gaps: read-then-write not insert-or-catch; **no request hash**, so a different payload reusing a key is silently answered with the first journal; covers only the ledger (transfers/events/provider calls/notifications unkeyed); unscoped namespace (no book/actor/operation); case-insensitive by collation |
| 6 | Holds / reservations (auth vs capture) | **ABSENT** | No `holds`, no `liquidity_reservations`, no authorization→capture lifecycle, no expiry, no partial capture. See §6 item 3 |
| 7 | Two-phase settlement | **ABSENT** | One flat status enum; `paid_out` and `completed` are adjacent labels, not evidenced phases. No `settled_at` distinct from `completedAt` (set opportunistically at `admin-router.ts:88`, `remittance-router.ts:286`). No `provider_attempts` leg model, so **"submitted but outcome unknown" — the most dangerous state in money movement — has no representation**. `remittance-router.ts:248` posts straight to `"External settlement cash"` at completion with no pending-settlement clearing step, i.e. the journal treats submission as finality. Makes ADR-07 ("ACH payout only after settlement evidence") unimplementable on this schema |
| 8 | Transactional outbox | **ABSENT** | No `outbox`, `consumer_inbox`, `published_at`, `lease_until`, `attempts`, aggregate identity. `transfer_events` is a UI activity log, not a delivery guarantee. Exactly-once economic effect is unachievable |
| 9 | Saga / workflow persistence | **ABSENT** | Workflow state = one enum column + free-text `pausedFromStatus`. No resumable step record, no compensation steps, no timer table, no lease/claim columns, no `attempt_edges` legal-transition table. Legality enforced only by if-chains in the routers; any future caller of `getDb().update(transfers)` bypasses everything |
| 10 | Reversal/refund linkage to original | **ABSENT** | Vocabulary exists (`status 'reversed'`, `entryType 'refund'`) but **no `reversal_of`, no `adjustment_of`**. Refunds are hand-written mirrored templates in `core.ts:255-289 fundingEntries(transfer, refund)` recomputed from the *current* transfer decimals, not from the original journal lines — if the two disagree (nothing prevents it) the refund amount is wrong and provably so. No partial refunds, no per-line allocation, no refund due-date |
| 11 | Void vs compensating-entry policy | **ABSENT** | `status enum('pending','posted','reversed')` implements no policy; nothing forbids editing a posted journal; no accounting-policy table mapping regime→`entryType` |
| 12 | Chart of accounts structure | **ABSENT** | `ledger_accounts` keyed by human-readable name string. No `code`, no hierarchy, no class taxonomy beyond a 4-value enum (missing `equity` and `expense`), no permitted-currency list, no opening balance, no active/closed flag, no book ownership, no statutory GL mapping. Emergent artifact of `getOrCreateAccount`. Already internally inconsistent: `"Loyalty rewards expense"` typed `asset` |
| 13 | Period close / locking | **ABSENT** | No periods table, no `posting_date` (only second-precision `effectiveAt timestamp` in a timezone-shifting column), no closed-book state, no locked-through date, no trial-balance snapshot, no backdating guard. An auditable monthly/annual close cannot be produced |
| 14 | Reconciliation vs provider payouts | **ABSENT** | No `statement_files`/`statement_lines`/`reconciliation_matches`/`breaks`/`evidence`/`disputes`. The only thing named reconciliation is an ad-hoc read query (`admin-router.ts:313-333`, capped 100 txns/1000 entries, float sum, 0.001 epsilon). No external-reference identity, so provider records cannot join to internal journals and unmatched items have nowhere to live. **This is the control that detects every other failure mode; its absence makes ledger correctness unfalsifiable** |
| 15 | Sequential immutable audit chain | **PARTIAL — best-implemented feature** | Genuine canonical-JSON SHA-256 chain with `previousHash`/`hash` (`core.ts:185-227`, `schema.ts:230-231`) plus verification walk (`admin-router.ts:292-308`). Insufficient because: no DB enforcement of append-only; head read `SELECT … ORDER BY id DESC LIMIT 1` then INSERT is unserialized → concurrent audits fork the chain and the verifier reports tampering caused by legitimate traffic; **chain covers `audit_logs` only, not `ledger_entries`** — the money records themselves are unattested; second-granularity timestamps push ordering onto AUTO_INCREMENT ids that break under backfill/shard merge; no Object Lock/WORM copy; verification truncated at `limit(1000)` then `slice(-150)` so tampering past row 1000 reports clean |
| 16 | Real optimistic concurrency / row locking | **ABSENT (decorative)** | Updates are `.set({…, version: transfer.version + 1}).where(eq(transfers.id, transfer.id))` — id-only predicate, so a concurrent increment is silently overwritten. Correct CAS needs `WHERE id=? AND version=?` plus rows-affected check. No `FOR UPDATE`, no `.for('update')`, no advisory locks. Under planetscale-mode connections + REPEATABLE READ, the cancel/double-complete/double-payout races remain open |

Cross-cutting absences called out separately by coder-04 (§3.17): multi-entity/book scoping; referential integrity; **any `evidence`/provenance binding a journal to a verified external fact — every posting is self-asserted**; disputes/chargebacks; refund due-dates; treasury movements; sanctions screening history; consent/disclosure records; notification state; recurring transfers; business/KYB; batches; PII protection; sessions/tokens/staff-segregation tables (`users.role enum('user','admin')` at `schema.ts:23` is the entire authorization model).

---

## 5. Per-table critique of the 14 archive tables

Table count corrected: **14**, not 15 as some briefs stated (`schema.ts:17,31,47,66,99,114,128,141,154,172,184,195,204,220`; independently confirmed by `meta/0000_snapshot.json` keys and `_journal.json`).

| Table | Key gaps |
|---|---|
| `users` :17 | `email varchar(320)` nullable, **not unique, not notNull**; no verified-email flag; no credential/session/token table; `unionId` UNIQUE case-insensitive |
| `recipients` :31 | `accountReference` plaintext (`:39`); institution/method free text; no beneficiary-validation record; soft-delete only (`active:false`) |
| `quotes` :47 | currency pair implicit only (hardcoded USD→PHP, `core.ts:52-83`); fee not itemized (base vs promo vs markup split unpersisted); **no `status`, no `consumedAt`, no unique constraint** → `createTransfer` checks existence/owner/expiry but never marks consumed (`:171-207`), so one `quoteId` funds unlimited transfers until the 60 s TTL passes; `userId` nullable so the ownership test at `:172` silently passes for null; rows never updated at all |
| `transfers` :66 | 9-value flat enum conflates compliance/lifecycle/funding/payout/refund/dispute/recon dimensions; transition graph exists nowhere in schema; `version` decorative; no currency columns; no `book`; terminality inconsistent (`refund` allowed from `completed`, `admin-router.ts:69`) |
| `transfer_events` :99 | `eventType varchar(80)` free text; no sequence number, uniqueness, or hash; insertable out of order; `fromStatus` never validated against current status; editable/deletable; no FK even preventing orphans |
| `ledger_accounts` :114 | free-text name **is** the identity; no code/hierarchy/opening balance; `accountType` enum lacks equity & expense; lazy creation race (`core.ts:105-114`); NULL-distinctness gap in the unique index |
| `ledger_transactions` :128 | `idempotencyKey` UNIQUE is good; `status 'reversed'` never written; no `book`, `policy_id`, `evidence_id`, `creation_tx`, `posting_date`, `request_hash`, `reversal_of`, `adjustment_of`; no version column |
| `ledger_entries` :141 | `amount decimal(20,2)` with **no CHECK** (`:146`); mutable; unattested by the audit chain; no rate stored on the line; no `fx_conversion` 4-leg template despite the enum value existing (`:131`) |
| `kyc_cases` :154 | **one row per user, overwritten in place** — prior decision/document/resubmission trail destroyed (`remittance-router.ts:146-154` resets `reviewerId`/`reviewedAt` to null); `provider` default `"Sandbox eKYC"` (`:158`); `providerRef` `sim_<nanoid>`; fields are `documentType`/`providerRef`/`notes` text only — no storage whatsoever for liveness, face match, sanctions, PEP, adverse-media (the UI itself flags this: `src/pages/AdminCompliance.tsx:40`); no `expiresAt`/re-screen cadence |
| `loyalty_entries` :172 | unsigned `points int`; no lots, vesting, expiry, reversal linkage, counter-account; negative balances representable |
| `rate_alerts` :184 | **dead table** — inserted (`remittance-router.ts:233`), listed (`:101`), toggled (`:238`); nothing ever compares `targetRate` to a rate, no fired/notified state, no channel |
| `configurations` :195 | effectively one logical row (`"remittance.pricing"`, `core.ts:46`); history overwritten on update (`admin-router.ts:279`); no draft/live split, no effective-from; `{...DEFAULT_CONFIGURATION, ...stored}` merge (`core.ts:47`) resurrects deleted keys — hidden config drift; direct unapproved writes permitted by the schema |
| `approval_requests` :204 | covers **2 of 9** admin actions (`needsApproval :181`) plus config; self-approval prevention is code-only (`:272`) with no `CHECK(requestedBy<>reviewedBy)`; two distinct actors not guaranteed (`reviewedBy` plain nullable bigint, no FK); no before/after snapshot; no expiry/SLA; no dedupe → repeated clicks enqueue duplicates; **race: two admins pass the `status!=='pending'` read check before either update lands, so side effects can run twice** |
| `audit_logs` :220 | see capability 15; actor attribution `actorUserId` (no FK) + free-text `actorName`, synthetic names ("System" `core.ts:216`, "Sandbox payout partner" `remittance-router.ts:289`); **no request/correlation id column** despite a per-request UUID existing in HTTP layer (`api/lib/requestcontext.ts`, `boot.ts:27`) that never reaches audit rows; no ip/ua/session columns; no retention/partition strategy |

---

## 6. Missing objects required for production (14, per coder-09)

Purpose stated as identified gap only — **columns below are descriptions of what must be expressible, not proposed DDL.**

1. **`idempotency_keys`** — request-level replay guard for every mutating API/provider call (today only ledger rows carry per-operation keys; `createTransfer`, `redeemPoints`, `addSandboxFunds` are not idempotent end-to-end). Needs scope/route, actor, request hash, response snapshot, resource ref, expiry.
2. **`outbox_events`** — transactional outbox so notifications, partner calls and projections commit atomically with state and retry after crash; publication state, attempts, lease, dead-letter. Would replace fire-and-forget `addTransferEvent` fan-out.
3. **`holds_reservations`** — real money holds; today wallet debit is a single posting with no reservation lifecycle and FX quote amounts are not reserved. Gives quotes the consumption record they lack.
4. **`payment_instruments`** — tokenized funding sources (PAN never stored), brand/routing metadata, verification state, dedupe fingerprint. Today funding provenance is a free-text `fundingProvider` column carrying `"Stripe ACH sandbox"`.
5. **`provider_callbacks` / `webhook_log`** — signed inbound partner events with per-provider native-id uniqueness for replay dedupe, signature validity, processing state. Today the substitute is a **customer-authenticated mutation impersonating the partner** (`remittance-router.ts:281-292`).
6. **`sanctions_screenings`** — periodic + per-transfer sanctions/PEP/adverse-media evidence with list version, result, disposition, next-screen cadence. `kyc_cases` holds none of it.
7. **`beneficiary_validation`** — per-payout-method recipient/account/name verification recorded before transfer creation (GCash/Maya handle checks, bank name-match, pickup rules).
8. **`fx_rate_snapshots`** — time-series rates per pair with source and validity window so a quote pins an exact market print and pricing can be reconciled. Quotes currently store numbers with no provenance.
9. **`documents` / `evidence_blobs`** — KYC uploads and compliance evidence with storage URI, digest, encryption state, revocation, WORM flag. Makes the AdminCompliance "evidence" claim real.
10. **`notification_log`** — delivery state for email/push/SMS including the rate-alert trigger half that does not exist; dedupe window; opt-out snapshot.
11. **`sessions_devices`** — server-side session/device registry with revocation. Today auth is a 1-year HS256 JWT cookie (`session.ts:14-15`) with no denylist; logout clears the client cookie only.
12. **`ledger_reversals`** — explicit edges between journal transactions forcing every refund/cancel to name the journal it undoes; four-eyes on the reversal.
13. **`reconciliation_batches`** — persisted scheduled statement/partner matching with control totals and an enumerated break taxonomy; replaces the on-demand capped scan.
14. **`jobs` / `saga_state`** — durable orchestration for fund→screen→approve→payout→notify with retries, timeouts, leases. Replaces the implicit assumption that someone will finish `processing`.

Additional columns named as required: `quotes.status/consumedAt/itemized fees/currencies`; `transfer_events.seq` + uniqueness + immutability; `approval_requests.expires_at/before_snapshot/approver_role_scope/CHECK(requestedBy<>reviewedBy)`; `audit_logs.request_id/session_id` + append-only enforcement; `kyc_cases.expiresAt/nextRescreenAt` + separate decision history; `configurations.effectiveFrom` + history; `transfers.version` actually used in the WHERE clause.

---

## 7. Target-side defects found in `docs/kita-plan/sql/001_core.sql`

The plan file is better-formed than the archive but **must not be treated as validated**. Coder-19's 17-item list, condensed to the load-bearing items:

| # | Item | Consequence |
|---|---|---|
| **5** | **Authorization incomplete by construction.** After `REVOKE ALL … FROM PUBLIC`, the only positive grants are `USAGE` on schema and `EXECUTE` on `post_journal` for `kita_posting`. **`kita_api` and `kita_worker` receive no table privileges at all**, and the promised follow-on domain migrations do not exist. *"This makes `001_core.sql` non-runnable end-to-end, not merely incomplete."* | Applying the file alone yields a database that cannot serve a single request |
| 10 | `evidence.verified boolean DEFAULT false` with no guard, on an otherwise immutable table. Since `post_journal` requires verified evidence, **verification is a mutable boolean on an immutable row** — a trust-root hole; wrongly-verified rows can never be corrected | Needs its own transition table or definer function |
| 6 | Tables missing vs its own plan and research: `fx_rates`/`fx_sources`, `corridors`/cut-off calendar/holidays, nostro & partner prefunding positions as data, `notification_templates`, `fee_schedules` (fees live only inside `policies.body jsonb` — unverifiable), `promo_codes`/redemptions, `sanctions_lists`/list-version registry (`screenings.list_version` is bare text), `roles`/`permissions` catalog (`staff_grants.permission` free text), `work_leases`/leader, webhook subscription config, support messages, FX open-exposure positions | Greenfield surface larger than the file claims |
| 16 | Applied-once assumption: `CREATE SCHEMA`/`CREATE TABLE` unguarded (no `IF NOT EXISTS`) while roles are `DO`-block guarded; re-running fails immediately; no down-migration; `ALTER DEFAULT PRIVILEGES` effect depends on the owner identity that ran it — fragile in CI | Not idempotent |
| 15 | Formatting hazard: statements average ~230 chars, several exceed 1,000 chars on one line (`quotes`, `recipient_versions`, `post_journal` body) — defeats line-level review and diff-based approval for a schema encoding financial law | Must be reformatted one-column-per-line before human sign-off |
| 13 | **Zero `COMMENT ON`** across a schema whose semantics (`side`, `leg`, `scope`, `basis`, `state`) are entirely CHECK-encoded enums | Largest maintainability gap for a regulated system |
| 7 | No partitioning at all (`PARTITION BY` count 0) — defensible under the plan's "start unpartitioned", but contradicts the research's monthly partitioning of `journal_lines`/`fx_rates`/events/audit and leaves retention unaddressed | Needs an explicit ADR-consistent statement |
| 8 | No exclusion constraints (`EXCLUDE USING` count 0) though overlapping-range rules (route capacity windows, liquidity reservation periods) need them | Partial-unique workaround acceptable for payout authority only |
| 12 | `txid_current()` deprecated in favour of `pg_current_xact_id()` — subject to confirmation against the pinned 18.x docs | Version-pin gate |
| 17 | **Never executed.** Parse-cleanliness on 18.x unknown; `UNIQUE NULLS NOT DISTINCT` (≥15), `hashtextextended` (≥11), `txid_current` availability all look right by inspection only | Needs a lint + `--single-transaction` dry-run CI gate |
| 1–4, 9, 11, 14 | Minor/structural notes: `audit_events.actor_ref` and `holds.owner_ref` unconstrained text; `recipient_versions.method='bill'` representable but not quotable; mutable workflow rows rely on absent grants; deliberate polling instead of LISTEN/NOTIFY is undocumented; `creation_tx`-bound line-append verified as consistent; source has no book/currency so mapping is a **re-model, not a rename** | Recorded for completeness |

What `001_core.sql` already covers well (credit where due): deferred per-currency balance constraint triggers with deterministic `ORDER BY la.id FOR UPDATE` lock ordering; `post_journal` as sole `SECURITY DEFINER` entry; insufficient-balance guard; `provider_attempts` + seeded `attempt_edges` transition matrix + `one_payout_authority` partial unique; `command_keys (book,actor,operation,key)`; inbox/outbox/consumer_inbox with dedupe keys and leases; bigint minor units with sign CHECKs and rational `numeric(38,0)` rates; quote total algebra CHECK; encrypted + HMAC + mask `recipient_versions`; `consents` with `document_hash`; `books.status ∈ disabled|sandbox|live|closed` and `capabilities.enabled DEFAULT false`; `guard_approval` enforcing requester≠approver with expiry and payload-hash match; enumerated reconciliation break taxonomy; correct circular-dependency handling of `policy_approval` (`001_core.sql:62`).

---

## 8. Migration sequencing gates (identified, not executed)

Per coder-19. Each gate is a precondition to be satisfied and attested, not a script run in this batch.

| Gate | Content | Blocking notes |
|---|---|---|
| **M0 freeze & attest** | Declare archive sandbox-non-authoritative (ADR-14). **Disable `simulatePartnerCompletion`, `addSandboxFunds`, admin `complete`, `mark_paid_out`, `fail`, `reroute`.** Record source inventory: row counts, min/max timestamps, distinct enum values, sha256 per table dump | These paths write journal rows no external fact supports; leaving them live during migration contaminates the very history being assessed |
| **M1 provision target** | Stand up Postgres per version pins; apply `001_core.sql` into an empty DB as migration owner; run its internal assertions (constraint triggers fire, immutability triggers reject UPDATE/DELETE, `post_journal` rejects unbalanced lines); only then add the missing follow-on migrations | Blocked by §7 item 5 — the file cannot serve requests as-is |
| **M2 CoA & policy seed** | Build chart of accounts from a finance-owner-approved mapping, **not** from `ledger_accounts.name` strings; seed `books`, `currencies`, `policies`, `capabilities` with `enabled=false` | Archive CoA already internally inconsistent ("Loyalty rewards expense" typed `asset`) and lacks equity/expense classes |
| **M3 reference/master ETL** | `users`→customers (+ staff split), `recipients`→recipients+versions (encrypt `accountReference`), `configurations`→policies+capabilities, `kyc_cases`→cases+identity_decisions, `approval_requests`→approvals+decisions; `unionId`→subject; UUIDv7 for new ids | Plaintext account data already in MySQL and any prior backup is a breach-notification assessment question, not a mapping problem |
| **M4 historical money movement (conditional)** | quotes/transfers/events/audit/loyalty/rate_alerts reconstruction | **Decision required:** ADR-14 arguably forbids importing sandbox transfers at all. Recommended default: do **not** import financial history into the live book; import only to a read-only `archive_*` schema for support lookup and start the production book from independently attested opening balances. If imported, land in a separate `book` with `status='closed'`, never netted against the live book |
| **M5 balance backfill** | Derive `account_balances` from lines (lines are authority, balances are projection); convert `DECIMAL(20,2)`→minor units asserting **exact integrality** (fractional residue is a data defect, not something to round away); opening-balance journals only, never direct UPDATE | Expect to find legacy imbalance: `recordLedger` checks balance only per currency over entries handed to it and silently drops zero-amount lines (`core.ts:130`), and `completeTransferLedger` books `Treasury USD` credit + `Treasury PHP` debit at the *customer* rate with **no spread line**, so USD/PHP totals reconcile to no real position. Importing unchanged imports the error |
| **M6 cutover** | New writes Postgres-only; **no dual-write steady state** | Rollback is trivially safe pre-launch and impossible post-launch |

Dual-write guidance if mandated: prefer single-writer + shadow reads; note MySQL↔Postgres CDC **cannot preserve the target's invariants** (deferred constraint triggers, definer functions and advisory-lock idempotency do not fire through replicated DML the same way), so any parallel period must be treated as untrusted for the journal with parity proven by recomputation, not row equality.

Freeze mechanics: revoke the archive-facing role's DML (preferred over trusting app flags), pick an LSN/binlog position or `MAX(updatedAt)` watermark, dump at that watermark, keep frozen until acceptance; any row changed after the watermark is a reconciliation break, not a re-run.

Parity verification: transform-aware row-count + checksum per table at the watermark (not blind CRC), then an invariant suite on target — per-currency journal balance, ≥2 lines per journal, no orphan FK, no negative enforce-nonnegative account, one payout authority per transfer, attempt states reachable via `attempt_edges`, immutable tables reject UPDATE/DELETE.

---

## 9. Open questions requiring human / legal / provider input (do not guess)

Carried forward from coder-04 §4.18 and coder-19 §6; deliberately left unanswered here.

1. Is `0000_daily_archangel.sql` genuinely absent upstream, or stripped during archive assembly? If a real MySQL DB exists, its actual DDL (charset, engine, collation) is undocumented and may differ from `schema.ts`.
2. Do the `ledger_accounts.name` strings in `core.ts` map to accountant-approved codes, and who signs that mapping?
3. Rounding rule for `decimal → minor unit` conversion — must be documented and approved before any ETL; currently undecided in the plan package.
4. Does the organization operate more than one legal entity? Without an answer, `book_id` cannot be populated and the target's core segregation technique is unusable.
5. Which regulator/entity determines re-screen cadence and retention schedules (no `expiresAt`/TTL exists today, and no DELETE path exists anywhere in `api/`)?
6. Is financial history imported at all (M4 decision), and if so into which closed book?
7. Are the `001_core.sql` triggers/functions accepted as first-class reviewed artifacts, with the property tests that implies?
8. Who owns the follow-on domain migrations that make the target runnable (§7 item 5)?
9. Coverage gaps with no dedicated report in this batch: compliance-storage specifics (consent records, retention obligations, encrypted-at-rest markers) were assigned to coder-14, which did not produce a report; partially compensated by `coder-04/08/09/13/18/20` findings noted above.
10. `docs/kita-plan/evidence/` and `docs/kita-plan/openapi/` are **empty** despite README references — the artifacts those documents cite as proof do not exist yet.
