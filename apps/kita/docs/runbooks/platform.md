# Runbook — Platform (RB-PLATFORM, migration & build observability, DB roles)

Owner: Platform/SRE (lane coder-25 coordination). Applies to `apps/kita` only; the parent t3mp3st
security product is never a Kita deployment target. Referenced by T-PLAT-01/T-PLAT-02
(`docs/kita-plan/13-backlog.md`), gates G01/G02 (`12-tests-gates.md` L4), and K2/K4
(`11-infrastructure.md`). Batch-1 status: CI workflow (`.github/workflows/ci.yml`) and this runbook
exist; runtime deployment, lockfile freeze, and lane test specs are **pending** — nothing here is
"deployed" or "passing" yet.

## 1. RB-PLATFORM rollback

Policy (backlog M2): promote the **prior compatible artifact**, or perform **isolated recovery**
only after independent writer fencing and reconciliation. Never delete evidence to make a rollback
appear clean.

Trigger examples: failed fresh-install migration, `migration_failure_count` breach, client bundle
containing server secrets, dependency drift unresolvable within the frozen lock set.

Steps:

1. Stop promotion; freeze new releases of the affected workspace package(s). Record exact bad
   artifact digest + commit SHA in the incident note.
2. Identify whether any external instruction (provider submission) may have occurred. In batch 1
   none can (no live providers), but the check is mandatory before reusing this runbook later.
   If any occurred: **DB rewind is forbidden**; switch to isolated recovery (step 5) and K4.
3. Roll forward-only options first: disable the capability/config (RB-CONTROL boundary), then
   redeploy the prior compatible signed artifact by digest. Verify schema checksums match the
   prior release's manifest (`sql/CHECKSUMS.txt` pattern).
4. Confirm gates on the rolled-back head: re-run TEST-PLAT-01/02 steps from `ci.yml`; an earlier
   branch passing is insufficient.
5. Isolated recovery (only if artifact promotion is impossible): restore into a private isolated
   DB (e.g. `kita_core_test`, port 54339), no submit credentials, no outbound payment network;
   fence old writers independently of DB leases; reconcile; sign-off by Finance/Security/incident
   commander before any writer resumes.
6. Retain: rollback manifest, hashes, timeline, gate outputs. Evidence lives under
   `artifacts/kita/<runId>/` (redacted); money/PII evidence never in public CI logs.

## 2. Observability

### migration_failure_count (T-PLAT-02)

* Definition: counter of migration runs (fresh install or upgrade) ending in error, tagged
  `stage={fresh|upgrade|verify}` and `reason_class={checksum|permission|invariant|timeout}` —
  bounded labels only, never database names with customer data.
* Where emitted: `packages/platform/migrate-core.ts` runner (coder-24 path; pending). Until the
  platform package lands, CI job failure on the `test-plat-02` job is the interim signal.
* Alert: any increase on a production-scope run pages Platform/SRE immediately (a failed migration
  mid-window is a fencing event, not just noise). Fresh-test failures: issue-and-fix, no page.
* Investigation order: checksum mismatch → compare against `CHECKSUMS.txt`; permission → §3 roles;
  invariant → 002-style constraint violation, capture `sqlstate` and redacted detail only.

### build_dependency_drift (T-PLAT-01)

* Definition: gauge/counter of builds where installed tree ≠ frozen lockfile (frozen-lock install
  failure, integrity mismatch, unexpected native peer resolution). Labels:
  `{workspace, drift_class={lock_mismatch|integrity|peer}}`.
* Where emitted: CI step `pnpm install --frozen-lockfile` (pending lockfile freeze; currently the
  step fails closed by design). Webhook/alert once DEP wiring exists.
* Alert: drift on the release-candidate build blocks promotion (G01); repeated drift on dev builds
  → investigate supply chain before merging anything.
* Note: scaffold currently declares `npm@10` while T-PLAT-01 requires pnpm patched locks — resolve
  the package-manager decision (BATCH1.md open item 1) before the freeze, or every CI run reports
  drift forever.

## 3. Least-privilege DB roles

Target PostgreSQL 18.x, isolated test DB `kita_core_test` @54339 only in batch 1. Roles per
T-CORE-01/T-CORE-02 ("actual-role permission tests", no runtime direct writes):

| Role | Grants | Used by |
|---|---|---|
| `kita_migration` | DDL owner: CREATE/ALTER on schema `kita`; owns numbered migrations; NO DML on money tables outside migration scripts | migrate tooling only, break-glass, audited |
| `kita_api` | SELECT + execute approved command functions (RPC-style) in `kita`; NO INSERT/UPDATE/DELETE on `journals`, `journal_lines`, `account_balances`; no DDL | API read controllers |
| `kita_worker` | Execute approved reducer/command functions with `SET LOCAL` context; append-only inserts via functions, never raw table writes to ledger tables | durable workers |
| `kita_runtime` (app connection role) | membership-equivalent minimum of api+worker scopes as separated logins; default `search_path=kita,pg_catalog` | process pools |

Enforcement rules:

* Append-only ledger triggers and deferred constraints (001_core.sql) are the last line; role grants
  must make direct ledger DML impossible *before* relying on triggers. Negative tests required
  (TEST-PLAT-02 / REQ-SC class: attempt direct write as `kita_api` → expect `42501`).
* No superuser in application env; secrets via runtime injection, never baked images or CI logs.
* Grant DDL: `sql/roles.sql` (filed by coder-25; groups + `kita_migration` / `kita_api` /
  `kita_worker`, isolated test DB only). Enforcement tests against actual roles belong to
  TEST-PLAT-02 (coder-23/24) — still **pending**.

## 4. Related

* Prohibited calls/outcome manufacturing: [../FORBIDDEN.md](../FORBIDDEN.md).
* Lane status and file map: [../kita-plan/BATCH1.md](../kita-plan/BATCH1.md).
* Gates: `docs/kita-plan/12-tests-gates.md` G01 (build hygiene) / G02 (database/ledger).
