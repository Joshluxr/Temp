# Kita core database — isolation topology and production-isolation policy

Task: **T-PLAT-02** (`docs/kita-plan/13-backlog.md:1344`), objective *KITA-PLAT-02*:
"Fresh install works and **sandbox balances never become live cash**."
Machine-readable form of this document: [`isolation.json`](./isolation.json).

Status: batch 1 scaffold documentation. No real money, no fake KYC, no live provider calls
anywhere in this slice (see `docs/kita-plan/SOL-REVIEW.md`, CONDITIONAL-PASS).

---

## 0. Source facts this document is built from

| Fact | Evidence |
| --- | --- |
| Reviewed core DDL header: "Kita planning artifact, 2026-11-09. PostgreSQL 18 target; no live credentials/data." and "Apply once to an empty database as a migration owner with CREATEROLE." | `docs/kita-plan/sql/001_core.sql:1-2` |
| Runtime roles are created **by the DDL itself**, as `NOLOGIN` | `docs/kita-plan/sql/001_core.sql:7-10` (`kita_api`, `kita_worker`, `kita_posting`, `kita_auditor`) |
| Smoke fixture header: "Planning verification fixture; run ONLY in an isolated empty test database after 001." / "All fixture data and helper objects are rolled back. This is not a production seed." | `docs/kita-plan/sql/002_core_smoke.sql:1-3` |
| The repo-root container definition ships **no database at all** | see §1.4 below |
| Sol blocker wording reproduced in workspace guardrails | `WORKSPACE.md` ("Kita slice"), `apps/kita/README.md` ("Scope guardrails (batch 1)") |

---

## 1. Isolated test topology

### 1.1 Throwaway cluster

* Dedicated **throwaway** PostgreSQL cluster listening on **`127.0.0.1:54339`** only (loopback;
  no `listen_addresses` beyond localhost, no public bind, no TLS-to-live-provider config).
* Database name: **`kita_core_test`**. Cluster and database are disposable — provisioned by
  `apps/kita/database/scripts/provision-cluster.sh` (owned by another agent) and destroyed after
  the run. Nothing in it is promoted, backed up, or replicated.
* Login role for tooling: **`kita_test`** — the shape enforced fail-closed by
  `apps/kita/database/src/smoke.mjs` (`user kita_test`, host `127.0.0.1`, port `54339`,
  db `kita_core_test`; anything else aborts before a byte is sent, exit code 2).

### 1.2 Migration-owner role (CREATEROLE)

Per the `001_core.sql:2` header, the DDL is applied **once to an empty database** by a dedicated
migration owner holding `CREATEROLE`. That privilege exists solely so the DDL's own role-bootstrap
block (§1.3) can create the runtime roles when they do not already exist; it is granted to exactly
one non-application login role, scoped to `kita_core_test`, and is never used by API or worker
connections. There is no other reason for `CREATEROLE` in this topology and it must not be added
to any runtime identity.

### 1.3 Runtime roles come from the DDL, not from ops scripts

`001_core.sql:7-11` creates `kita_api`, `kita_worker`, `kita_posting`, `kita_auditor` inside a
`DO $$ ... $$` block guarded by `pg_roles` existence checks, each declared **`NOLOGIN`**. They are
authorization identities assumed by application connections via role membership/set-role, never
logins in their own right. Grants in the same file keep them narrow:

* `REVOKE ALL ON SCHEMA/TABLES/FUNCTIONS IN SCHEMA kita FROM PUBLIC` (`001_core.sql:172-174`).
* `GRANT USAGE ON SCHEMA kita TO kita_api,kita_worker,kita_posting,kita_auditor` (`:175`).
* `GRANT SELECT ON ALL TABLES IN SCHEMA kita TO kita_auditor` (`:176`) — read-only auditor.
* `GRANT EXECUTE ON FUNCTION post_journal(...) TO kita_posting` (`:177`) — the *only* ledger write
  path, and it is a `SECURITY DEFINER` function (`:133-134`).
* Comment at `:178-180`: "No generic table writes granted to runtime roles … no runtime
  UPDATE/DELETE/INSERT on journals, journal_lines, ledger_accounts, account_balances, or
  approval_decisions."
* `002_core_smoke.sql:98-99` asserts exactly this posture at runtime (`has_table_privilege` checks
  on `kita.journals`, `kita.journal_lines`, `kita.account_balances`, plus `post_journal` EXECUTE for
  `kita_posting`).

Consequence for this policy: because direct writes to `account_balances` are not granted to any
runtime role, a sandbox balance cannot be smuggled into a live book by `UPDATE` — the projection
moves only through `post_journal`, which requires verified evidence, an open accounting period, and
a balanced multi-line journal (`001_core.sql:142-144`, `:158-163`).

### 1.4 No Postgres service in the repository's container definition

Confirmed explicitly: **`docker-compose.yml` at the repository root contains NO postgres service.**
It declares exactly one service, `app` (build context `.`, `container_name: t3mp3st`,
`T3MP3ST_PORT=3333`, ports `127.0.0.1:3333:3333`, volumes `./reports` and `./evidence`, healthcheck
against `/api/health`). There is no `db`, `postgres`, `pg`, or `database` service, no volume for
`PGDATA`, and no connection string pointing at such a service. Therefore:

* nothing in the security product's compose stack can silently provide a database that Kita
  migrations would hit by accident;
* the `127.0.0.1:54339` throwaway cluster is provisioned outside compose, ad hoc, and torn down;
* any future compose entry naming Postgres must be reviewed against this file before merge.

### 1.5 Apply procedure (test only)

```sh
# throwaway cluster first (provision-cluster.sh owned elsewhere)
psql -X -v ON_ERROR_STOP=1 -h 127.0.0.1 -p 54339 -d kita_core_test \
  -f docs/kita-plan/sql/001_core.sql \
  -f docs/kita-plan/sql/002_core_smoke.sql
```

The verbatim SQL copies under `apps/kita/sql/` are owned by another agent; this document cites the
plan-of-record originals in `docs/kita-plan/sql/`. `002_core_smoke.sql` opens `BEGIN` (`:5`) and
ends with `ROLLBACK` (`:102`), so even inside `kita_core_test` it leaves no residue.

---

## 2. PRODUCTION-ISOLATION POLICY — "sandbox balances never become live cash"

This is the Sol blocking condition from `docs/kita-plan/SOL-REVIEW.md`. Every seeding vector below
is **blocked** in any production/live target. Batch 1 carries no money paths at all, so these are
recorded as prohibitions the later batches inherit rather than as behaviour to be enabled.

### 2.1 Where the sandbox actually lives in the reviewed schema

Exact tables/columns found in `docs/kita-plan/sql/001_core.sql`:

* **`kita.books.status`** — `CREATE TABLE books(... status text NOT NULL DEFAULT 'disabled'
  CHECK(status IN ('disabled','sandbox','live','closed')))` (`001_core.sql:14`). The CHECK list is
  the only place `'sandbox'` is admitted as a book state; note the default is `'disabled'`, not
  `'sandbox'`.
* **`kita.provider_accounts.environment`** — `CHECK(environment IN ('sandbox','production'))`
  (`001_core.sql:18`). Sandbox credentials may only ever be stored on a row whose environment is
  `'sandbox'`; a `'sandbox'` provider account is not a payout authority in a live book.
* **`kita.account_balances`** — `(account_id PK REFERENCES ledger_accounts, normal_minor
  numeric(38,0) NOT NULL DEFAULT 0, version bigint)` (`001_core.sql:56`). It has **no `book_id` and
  no status column**: it cannot self-declare as sandbox. Its provenance is entirely inherited from
  `kita.ledger_accounts.book_id` (`:55`) and the journals that moved it (`:57-58`). That is why the
  gate in §2.3 keys on `books.status`, not on balances.
* **`kita.journals` / `kita.journal_lines`** — the immutable economic record (`:57`, `:58`), with
  `journals.evidence_id NOT NULL REFERENCES evidence` and per-currency balance constraint triggers
  (`:112-118`); `journals` is on the immutability trigger list (`:169-171`).
* **`kita.evidence`** — `source`, `external_event_id`, `body_hash`, `object_ref`, `verified boolean
  NOT NULL DEFAULT false` (`:19`). Opening evidence must be `verified = true` before `post_journal`
  accepts it (`:143`).
* Static seed data in the DDL is limited to reference/truth-table rows: `currencies`
  (`001_core.sql:13`, eight currency/exponent pairs) and `attempt_edges` (`:44-53`, legal state
  transitions). **No monetary rows.**

What `002_core_smoke.sql` seeds — all inside `BEGIN` … `ROLLBACK`, all fixture-labelled:

* `books(id,legal_entity,functional_currency,status)` with `legal_entity = 'isolated-smoke-'||b`
  and **`status = 'sandbox'`** (`002_core_smoke.sql:15`) — the single occurrence of `'sandbox'` in
  the file.
* `policies(... kind='posting', body '{"fixture":true}')` (`:16`), `accounting_periods` open
  (`:17`), `evidence(source='isolated-test', external_event_id='fixture',
  object_ref='test-only://evidence', verified=true)` (`:18-19`), and three `ledger_accounts` coded
  `fixture:cash` / `fixture:wallet` / `fixture:php` (`:20-23`).
* Journals posted through `post_journal` with event keys `smoke:fund`, `smoke:unbalanced`,
  `smoke:overdraw`, `smoke:wrong-currency`, `smoke:reverse`, `smoke:empty` (`:27-96`) — including a
  deliberate wallet credit of `50399` minor units asserted at `:30`.
* Header at `:3`: "This is not a production seed."

So: `status='sandbox'` rows are produced **only** by the smoke fixture, and only transiently in the
test database. Any `sandbox` row observed in a live DB is by definition unauthorized data.

### 2.2 Blocked seeding vectors (all forbidden in a production target)

1. **No `addSandboxFunds`.** Archived minting mutation at
   `docs/kita-sources/kimi-archive/app/api/remittance-router.ts:242` — posts an `entryType:
   "adjustment"` ledger pair described as "Sandbox wallet top-up" straight to a customer's
   `Available wallet` liability using `amount.toFixed(2)`. Never port the endpoint, never port the
   mutation, never expose an equivalent command function.
2. **No `simulatePartnerCompletion`.** Same file, `:281` — flips `transfers.status` to
   `"completed"`, calls `completeTransferLedger`, and appends a `payout.completed` event attributed
   to "Sandbox payout partner". Outcome manufacturing; forbidden in production.
3. **No admin `complete` / `fail` / `mark_paid_out` invocation.** Same archive,
   `api/admin-router.ts:35` (`action: z.enum([... "mark_paid_out", "complete", "fail"])`), with
   `complete` at `:79-82`, `fail` at `:83-85`, `mark_paid_out` in the same enum, and ledger side
   effects at `:112`. These set terminal money outcomes without provider evidence and are excluded
   from any production build path, not merely disabled at runtime.
4. **No import of kimi-archive MySQL dumps or its sandbox `account_balances` equivalents.** The
   archive is MySQL (`drizzle.config.ts:12 dialect: "mysql"`; `db/schema.ts` uses `mysqlTable`
   throughout). Its ledger trio `ledger_accounts` / `ledger_transactions` / `ledger_entries`
   (`db/schema.ts:114`, `:128`, `:141`) stores amounts as `decimal(precision:20, scale:2)` and has
   **no book/entity dimension at all** — it cannot be mapped onto `kita.account_balances` without
   inventing provenance. `docs/kita-plan/03-migration-map.md:161` states the rule: "sandbox IDs,
   balances, approval history and fictional provider references never become production facts."
   Related blocked sources: `db/seed.ts` "Kita sandbox workspace" seeding (`:25`, `:63-68` fictional
   transfers, `:97` `sandbox.seeded` audit rows) and specifically its "Sandbox wallet opening
   balance" adjustment keyed `adjustment:seed-wallet` (`:101-104`). `03-migration-map.md:53` refiles
   `db/seed.ts` to `tests/fixtures/sandbox.ts` behind an environmental fail-closed guard — it does
   **not** license production seeding.
5. **`books.status='sandbox'` rows exist only in `kita_core_test`.** A live database must contain
   zero of them; see the gate in §2.3. Likewise no `provider_accounts.environment='sandbox'` row may
   carry live funds authority, and no fixture-coded accounts (`fixture:cash`, `fixture:wallet`,
   `fixture:php`) or `test-only://` evidence may appear outside the test cluster.
6. **Wallet / `account_balances` projections in live DBs derive only from signed opening evidence
   plus journals.** Construction path: verified `kita.evidence` row (`:19`, `verified=true`) →
   `kita.policies` `kind='posting'` approved through independent `approvals`/`approval_decisions`
   (`:16`, `:72-74`, guard at `:119-122`) → open `kita.accounting_periods` (`:35`) →
   `post_journal(...)` (`:133-167`) inserting `journals` + `journal_lines` and moving
   `account_balances` only via the locked per-account delta (`:152-156`). `03-migration-map.md:161`:
   "The first production ledger opens from signed bank/provider evidence." Direct
   `INSERT`/`UPDATE` on `account_balances` is ungranted (§1.3) and `journals`/`journal_lines`/
   `ledger_accounts` are immutable-trigger tables (`:169-171`), so there is no shortcut writer.
   Float-formatted money (`toFixed(2)`) from the archive is additionally rejected: core stores
   `bigint`/`numeric(38,0)` minor units.
7. **No fake KYC / no live provider activation in batch 1.** `identity_decisions` (`:76`) and
   `screenings` (`:77`) require `evidence_id NOT NULL`; no endpoint may fabricate an
   `approved`/`clear` state, and no real payout/funding instruction is issued (T-DEPEND-01 and N
   approvals gate external activation per backlog §Deps lines).

### 2.3 Pre-promotion gate (blocking)

Before any promotion to a live database, and as a step in every live migration job, assert:

```sql
SELECT count(*) FROM kita.books WHERE status = 'sandbox';
-- MUST return 0. Non-zero => abort promotion, fail the release, page the platform owner.
```

Supporting assertions in the same gate (all must be 0 / all must hold):

```sql
SELECT count(*) FROM kita.provider_accounts pa
  JOIN kita.books b ON b.id = pa.book_id
 WHERE b.status = 'live' AND pa.environment = 'sandbox';

SELECT count(*) FROM kita.ledger_accounts WHERE code LIKE 'fixture:%';
SELECT count(*) FROM kita.evidence       WHERE object_ref LIKE 'test-only://%';
SELECT count(*) FROM kita.policies       WHERE body ? 'fixture';
SELECT count(*) FROM kita.journals        j JOIN kita.evidence e ON e.id = j.evidence_id
 WHERE NOT e.verified;
```

Plus structural checks: target DSN host/port/database is **not** the `127.0.0.1:54339` /
`kita_core_test` triple (that triple is test-only and must be rejected on the live side too),
the live connection role is not a `CREATEROLE` migration owner, `kita_api`/`kita_worker`/
`kita_posting`/`kita_auditor` remain `NOLOGIN`, and the `002_core_smoke.sql` assertion block
(`:98-99`) still passes against the live schema.

Evidence for T-PLAT-02 closes when `TEST-PLAT-02` records: fresh install on `kita_core_test`
succeeds, the smoke fixture rolls back clean, and the promotion gate above returns 0 on the
candidate live database.

---

## 3. Ownership

This directory (`apps/kita/database/config/`) holds documentation only. Executable migration and
smoke tooling (`src/migrate.mjs`, `src/test-runner.mjs`, `src/smoke.mjs`, `scripts/`), the SQL
copies under `apps/kita/sql/`, and tests belong to other agents in this batch. If the topology or
gate changes, update `isolation.json` and this file together — the JSON is what gates parse.
