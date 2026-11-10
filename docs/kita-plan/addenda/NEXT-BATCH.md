BATCH-OK

Money closed. Never ok:true. executeCommand and money_operations access remain HOLD. No financial execution, session minting, identity/KYC success, provider calls, live traffic, pilot, launch, deployment or G1-G6 closure is authorized.

Baseline: e3b2b157e83ff27fd03226e763f887c0f8d89b47 (e3b2b15, PR #124), the current non-money refusal-record implementation. This document replaces NEXT-BATCH.md in full. It authorizes one PostgreSQL parser repair in a subsequent implementation batch; it is not an implementation PASS, migration-install result, refusal-slice acceptance or merge permission. This documentation turn edits only docs/kita-plan/addenda/NEXT-BATCH.md.

The operator reports PostgreSQL 18.6 running at 127.0.0.1:54339. Applying the unmodified package migration fails at the schedules column declaration `authorization jsonb NOT NULL`; 001 rolls back and 005 cannot yet be installed. The earlier claim that no PostgreSQL engine is available is superseded by that report. No database connection or migration application was performed in this documentation turn.

## Exact subsequent implementation allowlist

Exactly these four existing files may change, solely as specified below:

| File | Only permitted change |
|---|---|
| apps/kita/packages/database/migrations/001_core.sql | Quote the one schedules.authorization column declaration, currently line 109. |
| apps/kita/sql/001_core.sql | The identical identifier quote, currently line 92. |
| docs/kita-plan/sql/001_core.sql | The identical identifier quote, currently line 92. |
| apps/kita/sql/CHECKSUMS.txt | Replace only the two existing 001_core.sql digest values with the exact post-quote digest below. |

There are no globs, new files or other permitted edits. Existing untracked files are outside this batch. Preserve 004_identity_access.sql, 005_non_money_refusal.sql, application code, tests, helpers, migration runners, migration ledgers, manifests, dependencies, public contracts, configuration and historical evidence byte for byte.

## Exact SQL change

In each of the three allowlisted SQL files, replace exactly one occurrence of the byte sequence:

~~~sql
, authorization jsonb NOT NULL,
~~~

with:

~~~sql
, "authorization" jsonb NOT NULL,
~~~

The occurrence must be inside CREATE TABLE schedules. Add only the two double-quote characters; preserve every other byte, including whitespace and line endings. The identifier remains lowercase authorization, with its existing jsonb type and NOT NULL constraint. Do not rename the column, add ALTER statements, quote unrelated identifiers, reformat the table or change any function, constraint, transaction boundary, default, seed row or privilege statement. Another parser error requires another scope decision.

The packaged SQL and planning SQL are byte-identical at the baseline and must remain byte-identical after this edit. The package migration has separate existing changes; preserve those differences rather than replacing any entire file with another copy.

apps/kita/sql/CHECKSUMS.txt records both the planning source hash and the packaged copy hash. Repository checksum/provenance checks require updating both entries when the identical files change. Replace exactly its two occurrences of:

~~~text
da4b3e0e9ea259d3389298411603c2a0b026e90fd8fdb56066c5d74e6ef92123
~~~

with:

~~~text
d977da22f83f7a8e6c0b299a5740ef1815ac2d3eb3131468cf61259cf75910d2
~~~

Keep every other manifest byte, including both 002_core_smoke.sql digest entries, unchanged. This is a narrowly approved checksum update for this exact SQL edit, not permission to refresh evidence or accept arbitrary checksum drift.

The expected SHA-256 values below were calculated from an in-memory quote-only replacement; no SQL file was written or applied:

| File | Baseline SHA-256 | Required post-edit SHA-256 |
|---|---|---|
| apps/kita/packages/database/migrations/001_core.sql | 4f5a0d66577cdc4838cfc0372156feb69ceb31c8904034adb7070d95c45f590e | 6fa76837f31962ca7865572caed50de8845b05614eacef5dec30c40befcd8e22 |
| apps/kita/sql/001_core.sql | da4b3e0e9ea259d3389298411603c2a0b026e90fd8fdb56066c5d74e6ef92123 | d977da22f83f7a8e6c0b299a5740ef1815ac2d3eb3131468cf61259cf75910d2 |
| docs/kita-plan/sql/001_core.sql | da4b3e0e9ea259d3389298411603c2a0b026e90fd8fdb56066c5d74e6ef92123 | d977da22f83f7a8e6c0b299a5740ef1815ac2d3eb3131468cf61259cf75910d2 |

Unchanged migration hashes:

~~~text
8f53bd7c4ea2a561d73e5ea4ad94e957ceed69122da289beec8a7673d9a48208  apps/kita/packages/database/migrations/004_identity_access.sql
6a0ba525b4a028bf968cd9834292b0fe48a9e1d497bd197a9c12b4970c136a12  apps/kita/packages/database/migrations/005_non_money_refusal.sql
~~~

## Required validation after implementation

Review the exact base/head and complete four-file implementation diff. Verify the SQL changes and hashes above, byte identity of the matching copies, unchanged 004/005 and unchanged privilege statements. Run from the repository root:

~~~sh
(cd apps/kita/sql && sha256sum -c CHECKSUMS.txt)
node --test apps/kita/database/tests/checksums.test.mjs
git diff --check
~~~

Then validate the explicitly configured dedicated test target: PostgreSQL 18.6 at 127.0.0.1:54339/kita_core_test, authenticated migration owner kita_test, with an initially empty recognized test schema and absent refusal roles. Preserve the explicit KITA_REFUSAL_TEST_OWNER_URL requirement; do not invent credentials, use another target, reset unknown leftovers or modify role privileges to bypass a failure.

Apply the complete checked-in package migrations in order: quote-patched 001_core.sql, unchanged 004_identity_access.sql, unchanged 005_non_money_refusal.sql. Use psql with -X and ON_ERROR_STOP=1, stop on the first error, and record the server identity/version, file hashes, command outcomes and transaction results without credentials. Do not filter or rewrite SQL in the harness, skip a migration, use either repository migration ledger, or exercise financial functions. Existing schema DDL and reference/config seeds remain as reviewed; no financial, customer or session rows may be seeded for this parser check.

If any later parser, ownership, membership, grant or other installation error appears, report its exact file/statement and SQLSTATE as the next blocker. Do not expand this batch to repair it. A successful installation establishes only that these three files install on the verified target; it does not establish safe runtime authority, durability or refusal-slice acceptance.

The current non-money-refusal-postgres.spec.ts is a placeholder that throws when selected. It cannot supply PostgreSQL acceptance evidence, and this batch does not authorize replacing it. Keep all missing runtime-role, scope-isolation, contention, retry, crash/recovery, immutability and grant evidence open. Record every failure and skip; neither a skipped suite nor a parser repair satisfies those obligations.

## Boundaries and review

This narrow exception supersedes the prior requirement to preserve 001 and its matching copies byte for byte only for the quoted declaration and the necessary checksum entries above. The prior refusal-record contract and required PostgreSQL evidence remain available in the baseline NEXT-BATCH.md (`git show e3b2b15:docs/kita-plan/addenda/NEXT-BATCH.md`) and remain required for acceptance. Its old five-new-file implementation allowlist is not reopened.

No GRANT/REVOKE, default privilege, role attribute, membership, ownership, search_path or security boundary may change. No broadening of grants to the recorder, definer, API, worker, posting, auditor or PUBLIC is authorized. No executeCommand, money operation, generic executor or success-capable response may be introduced or exercised.

Follow the operator roles for any subsequent implementation: Astra/xhigh planning, Sol/max direction and independent review, GPU gpu-fqaf Qoder Efficient coding, coordinator GitHub handling. No batch script or swarm is dispatched in this documentation-only turn. Substantive defects return for a separate scoped fix decision.

Preserve [T-CORE-02-BATCH.md](T-CORE-02-BATCH.md), [the identity review](../SOL-IDENTITY-REVIEW.md), [the public contract freeze](OPENAPI-FREEZE.md) and all prior bounded holds. Full T-CORE-02, T-CORE-01 runtime/migration acceptance, money, identity, ledger, posting, rewards, integration, certification, pilot and launch remain unclosed, as do CP-00-11, PACK/REQ-SC/TEST and DEP-00-15 obligations. No G1-G6 PASS is granted.

Checks in this documentation turn cover the first-line decision, exact allowlist, in-memory replacement hashes, local references, whitespace and a diff confined to NEXT-BATCH.md. No application build, unit test, database installation or PostgreSQL acceptance result is asserted.
