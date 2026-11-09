# @kita/database — core PostgreSQL schema (T-PLAT-02)

**ISOLATED TEST ONLY. This tooling must never be pointed at production.**

Scope of this package in Sol-approved batch 1: land the reviewed core DDL from
`docs/kita-plan/sql/` as verbatim copies, and provide a fail-closed migration
runner that can only ever target the dedicated Kita test database. No live
money, no fake KYC, no sandbox-funds minting, no admin complete/fail paths.

## Isolation policy

| Control | Requirement |
| --- | --- |
| Cluster | Dedicated Postgres 18 test cluster, port **54339**, loopback only (`127.0.0.1`) |
| Database | Exactly **`kita_core_test`** — no other name is accepted |
| Login role | **`kita_test`** |
| Canonical URL | `postgresql://kita_test@127.0.0.1:54339/kita_core_test` |
| Production credentials | Never present here; never read, never stored, never passed through |
| TLS / `sslmode` | Rejected — a TLS endpoint is by definition not the plaintext loopback test cluster |
| Managed-service markers | Rejected (`prod`, `production`, `live`, `mainnet`, `master`, `primary`, `rds.amazonaws.com`, `aurora`, `neon.tech`, `supabase`, `render`, `fly.io`, `heroku`, `aliyuncs`, `cloudsql`, `redshift`, `replica`, `standby`, `pgbouncer`) |

The guard in `src/migrate.mjs` is **fail-closed**: it validates the connection
string *before* opening a socket, and throws listing the allowed shape above.
After connecting it additionally asks the server for `current_database()` and
`current_setting('port')` and aborts if either disagrees with the policy — so a
DNS trick or a port-forward cannot silently redirect the migration.

## Sandbox balances never become live cash

`TEST-PLAT-02` requires proof that "fresh install works and sandbox balances
never become live cash". Two structural properties deliver that:

1. **`001_core.sql` creates structure only.** The single data it inserts is the
   currency reference table (ISO codes + exponents). It seeds no books, no
   wallets, no balances, no customers. `books.status` defaults to `'disabled'`.
2. **`002_core_smoke.sql` is a rolled-back fixture, not a seed.** Its own header
   states it runs only in an isolated empty test database and that all fixture
   data and helper objects are rolled back. Every row it writes lives inside
   that transaction and carries the `isolated-smoke-` / `fixture:` / `smoke:` /
   `test-only://` prefixes. It is verification of the posting function's
   invariants (idempotent replay, balanced journals, reversal negation), not a
   population step.

There is therefore no code path in this package that mints, imports, or
promotes a balance. Nothing here calls `addSandboxFunds`,
`simulatePartnerCompletion`, or an admin complete/fail operation, and nothing
here flips a book from `'sandbox'` to `'live'`.

## Files

```
apps/kita/sql/001_core.sql          verbatim copy of docs/kita-plan/sql/001_core.sql
apps/kita/sql/002_core_smoke.sql    verbatim copy of docs/kita-plan/sql/002_core_smoke.sql
apps/kita/sql/CHECKSUMS.txt         sha256 of each copy + source provenance
apps/kita/database/src/migrate.mjs  fail-closed runner (owned here)
apps/kita/database/src/test-runner.mjs  owned by coder 09
apps/kita/database/src/smoke.mjs        owned by coder 10
apps/kita/database/test/                owned by coders 09/10
```

The SQL files under `apps/kita/sql/` are **byte-for-byte identical** to their
sources; the sources were not edited. Verify:

```sh
cd apps/kita/sql && sha256sum -c CHECKSUMS.txt
```

## CREATEROLE owner requirement

`001_core.sql` creates its runtime roles inside its own `BEGIN .. COMMIT`
transaction (`kita_api`, `kita_worker`, `kita_posting`, `kita_auditor`, all
`NOLOGIN`). Roles are cluster-wide objects, so the connecting role **must hold
the `CREATEROLE` attribute** or Postgres raises `permission denied to create
role` and the entire migration rolls back. Provision the test cluster like this:

```sql
CREATE ROLE kita_test LOGIN PASSWORD '<test-only password>' CREATEROLE;
CREATE DATABASE kita_core_test OWNER kita_test;
```

The `DO $$ ... IF NOT EXISTS ... $$` guards make re-running on a cluster that
already has those roles safe.

## How to run

Prerequisite: `npm install` in `apps/kita` (workspace root) to get `pg`.

```sh
export DATABASE_URL='postgresql://kita_test@127.0.0.1:54339/kita_core_test'

# apply the core schema and record it
node src/migrate.mjs "$DATABASE_URL"     # or: npm run migrate -- <url>

# coder 09/10 entrypoints (not owned here)
npm test      # node src/test-runner.mjs
npm run smoke # node src/smoke.mjs  — synthetic fixture, always rolled back
```

`migrate()` is also importable:

```js
import { migrate } from '@kita/database/src/migrate.mjs';
const result = await migrate({ url: process.env.DATABASE_URL });
// { version, checksum, applied, skipped, database }
```

### Migration recording

The runner maintains:

```sql
CREATE TABLE IF NOT EXISTS kita.schema_migrations (
  version    text PRIMARY KEY,
  checksum   text,
  applied_at timestamptz NOT NULL DEFAULT now()
);
```

Behaviour, all verified locally:

* **Fresh database** → applies `001_core.sql`, records `('001_core', <sha256>)`.
* **Already recorded, same checksum** → skips; the DDL is never re-applied.
* **Checksum drift** (either the file on disk vs `CHECKSUMS.txt`, or the
  recorded checksum vs `CHECKSUMS.txt`) → `ChecksumError`, exit 1. A reviewed
  migration that has been edited or swapped cannot be applied silently.
* **Server reports the wrong database or port** → `MigrationGuardError` before
  any DDL runs.

Note `001_core.sql` contains its own `COMMIT`, so it is executed outside a
wrapper transaction; the bookkeeping table is created beforehand.

## Failure modes you should expect

Every refusal exits non-zero and prints JSON naming the allowed shape. A
missing/empty `DATABASE_URL`, a non-parseable URL, a `mysql://` URL, a default
port `5432`, an extra query parameter, or any production marker all fail closed.

## Not in scope

No git operations, no deployment config, no production target, no API surface,
no UI. Follow-on domain migrations and narrowly authorized command functions
belong to later batches and require Sol re-review.
