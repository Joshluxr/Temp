BATCH-OK

Money closed. Never ok:true. executeCommand and money_operations access remain HOLD. No financial execution, KYC/identity success, session minting, provider calls, live traffic, pilot, launch, deployment or G1-G6 closure is authorized.

Baseline: fa39f3d59106ae96741c656fd9441ab22266926e (fa39f3d, PR #125). The schedules."authorization" quote is already present in all three 001_core.sql copies. The operator reports that 001 now applies on PostgreSQL 18.6 at 127.0.0.1:54339 and kita.schedules exists. The next reported failure is in 004_identity_access.sql at document_access_grants:

~~~text
ERROR: there is no unique constraint matching given keys for referenced table documents
~~~

The checked-in 001 defines documents.id as PRIMARY KEY and documents.book_id as NOT NULL, but has no UNIQUE(id,book_id). The existing FK references both columns. PostgreSQL requires a suitable unique or primary key, or a non-partial unique index, on the referenced columns; the primary key on id alone does not supply that composite target. See [PostgreSQL 18 foreign-key constraints](https://www.postgresql.org/docs/18/ddl-constraints.html#DDL-CONSTRAINTS-FK).

Authorize the smallest additive repair in 004 only: expose the already logically unique (id,book_id) pair as a named, non-deferrable unique constraint before creating the dependent table. Keep PRIMARY KEY(id) and the same-book composite FK. This adds no document, access-grant, KYC, session or financial row and changes no permission. The unique constraint creates its supporting unique index; no separate index statement is needed. See [PostgreSQL 18 unique constraints](https://www.postgresql.org/docs/18/ddl-constraints.html#DDL-CONSTRAINTS-UNIQUE).

This document replaces NEXT-BATCH.md entirely. It authorizes a subsequent implementation batch, not an implementation PASS, migration-install result, refusal-slice acceptance or merge. This documentation turn edits only docs/kita-plan/addenda/NEXT-BATCH.md and does not connect to or mutate PostgreSQL.

Exactly one existing implementation file may change:

| File | Only permitted changes |
|---|---|
| apps/kita/packages/database/migrations/004_identity_access.sql | Insert the exact ALTER below and replace the exact three-line header comment below. |

There are no globs, new files or other permitted edits. In particular, preserve all three 001_core.sql copies, apps/kita/sql/CHECKSUMS.txt and 005_non_money_refusal.sql byte for byte. The checksum manifest covers the legacy 001/002 copies, not 004; do not add or regenerate entries. Preserve application code, tests, helpers, migration runners, migration ledgers, dependencies, configuration, contracts, historical evidence and existing untracked files.

Immediately after the existing `SET search_path = kita, pg_catalog;` and its following blank line, insert exactly these two SQL lines and one trailing blank line, inside 004's existing BEGIN/COMMIT transaction and before section 1:

~~~sql
ALTER TABLE kita.documents
  ADD CONSTRAINT documents_id_book_id_key UNIQUE (id, book_id);

~~~

The resulting opening SQL must be:

~~~sql
BEGIN;

SET search_path = kita, pg_catalog;

ALTER TABLE kita.documents
  ADD CONSTRAINT documents_id_book_id_key UNIQUE (id, book_id);

~~~

Replace exactly this existing three-line header comment, so it no longer falsely says that 004 alters nothing:

~~~sql
-- Privileges stay with 001's tail: this file issues NO GRANT/REVOKE, and it ALTERs nothing that
-- already exists — permissions documents.read vs access.grant remain data in the existing
-- approvals/audit_events/staff_grants machinery, not new database roles.
~~~

with exactly:

~~~sql
-- Privileges stay with 001's tail: this file issues NO GRANT/REVOKE. Its only ALTER adds
-- UNIQUE(id,book_id) to kita.documents for the existing same-book FK; permissions documents.read
-- vs access.grant remain data in approvals/audit_events/staff_grants, not new database roles.
~~~

Preserve every other byte, including whitespace, line endings, defaults, transaction boundaries and all FK clauses. In particular, leave this statement inside document_access_grants unchanged:

~~~sql
  FOREIGN KEY(document_id,book_id) REFERENCES documents(id,book_id),
~~~

Do not replace the primary key, reduce the FK to document_id alone, change either column's nullability, add cascading actions, make the unique constraint deferrable, disable validation/triggers, add conditional collision handling, or add data/seed statements. The named constraint and its supporting index must be newly created by the checked-in migration; an existing-name collision or another error stops the batch. No out-of-band ALTER may substitute for implementing and applying the whole file.

These are the required SHA-256 values. The proposed 004 digest was calculated from the two exact replacements in memory; no SQL file was written or applied in this turn.

| File | Baseline SHA-256 | Required implementation SHA-256 |
|---|---|---|
| apps/kita/packages/database/migrations/004_identity_access.sql | 8f53bd7c4ea2a561d73e5ea4ad94e957ceed69122da289beec8a7673d9a48208 | adc3c403feb2e98c5d808a7c28ebfada2048615f44590c64e838a952ad87ce05 |

Protected files must retain these hashes:

~~~text
6fa76837f31962ca7865572caed50de8845b05614eacef5dec30c40befcd8e22  apps/kita/packages/database/migrations/001_core.sql
d977da22f83f7a8e6c0b299a5740ef1815ac2d3eb3131468cf61259cf75910d2  apps/kita/sql/001_core.sql
d977da22f83f7a8e6c0b299a5740ef1815ac2d3eb3131468cf61259cf75910d2  docs/kita-plan/sql/001_core.sql
0cc9d574f2f9b716a9c90f6a3e5e83053c47a45f49609b93d72b12bfbefee2fd  apps/kita/sql/CHECKSUMS.txt
6a0ba525b4a028bf968cd9834292b0fe48a9e1d497bd197a9c12b4970c136a12  apps/kita/packages/database/migrations/005_non_money_refusal.sql
~~~

Review the exact implementation base/head and the complete one-file diff against the approved documentation head. Verify both replacements, the proposed 004 hash, all protected hashes and byte identity of the planning/legacy 001 pair. From the repository root, run:

~~~sh
(cd apps/kita/sql && sha256sum -c CHECKSUMS.txt)
node --test apps/kita/database/tests/checksums.test.mjs
git diff --check
~~~

Then validate installation only on the explicitly configured dedicated test target: PostgreSQL 18.6 at 127.0.0.1:54339/kita_core_test, authenticated migration owner kita_test, using the existing explicit KITA_REFUSAL_TEST_OWNER_URL requirement. Verify the URL and actual server version, database, session_user and schema ownership before mutation; record identities and hashes without credentials. Do not invent credentials, substitute a target, provision a service or change privileges/ownership to bypass a failure.

The reported successful 001 installation is an existing test state, not an empty schema. Before continuing there, verify it is the recognized 001-only state, with the failed 004 transaction fully rolled back, no 004/005 objects, no documents_id_book_id_key constraint/index and absent kita_refusal_recorder/kita_refusal_definer roles. If verified, apply the complete patched 004 and then complete unchanged 005, in that order; do not rerun 001 over existing tables. If the state is unknown or partially installed, stop and report it. No reset/drop/cleanup of unknown leftovers is authorized.

For fresh-install evidence, require a separately provisioned empty recognized test state on the same pinned dedicated target with absent refusal roles, then apply the complete unchanged package 001, patched package 004 and unchanged package 005 in order. Do not clear the current database to manufacture this evidence. If a clean state is unavailable, keep fresh-install validation open.

Use psql with -X and ON_ERROR_STOP=1, with verbose error reporting sufficient to capture SQLSTATE, and stop at the first failure. Apply checked-in file bytes without filtering, rewriting, skipping migrations, substituting legacy SQL copies or using either repository migration ledger. Record command exit status and each migration's COMMIT/ROLLBACK outcome. Existing reviewed reference/config seeds in 001 are unchanged; no additional book, customer, document, access-grant, session, command-key or financial fixtures are authorized. Do not invoke application/financial functions or provider endpoints.

After 004 commits, inspect pg_catalog to verify that documents still has PRIMARY KEY(id); documents_id_book_id_key is validated, non-deferrable UNIQUE(id,book_id); its supporting index is unique, valid and non-partial; and the validated document_access_grants(document_id,book_id) FK references kita.documents(id,book_id) through that index. Verify existing ownership, ACLs, role attributes/memberships and security settings are unchanged across 004. Across 005, review only its existing bounded refusal-role changes; this batch authorizes no additional authority or membership.

If 004, 005 or any validation fails, record the exact file, statement, SQLSTATE and transaction outcome as the next blocker and return to BATCH-HOLD for that repair. Do not expand this batch. Successful installation establishes only installation on the observed target. It does not establish runtime safety, durable refusal persistence, scope isolation or any full-task acceptance.

The existing apps/kita/packages/database/__tests__/non-money-refusal-postgres.spec.ts is a placeholder that throws when selected. Do not replace it or count a skipped/failing run as PostgreSQL acceptance. Runtime-role, cross-scope, contention, retry, crash/recovery, immutability and grant evidence remain open. The refusal contract and required PostgreSQL evidence in `git show e3b2b15:docs/kita-plan/addenda/NEXT-BATCH.md` remain required, subject only to the baseline 001 quote and this exact 004 repair; its former five-new-file allowlist is not reopened. The old no-engine claim is superseded by the operator's report, not repeated as a current blocker.

This narrow exception supersedes the prior byte-preservation hold on 004 only for the exact ALTER and comment correction above. No GRANT/REVOKE, default privilege, role attribute, membership, ownership, search_path or security-boundary change is authorized by the repair. No broadening to recorder, definer, API, worker, posting, auditor or PUBLIC. No executeCommand, money operation, generic executor, KYC/identity success or success-capable response may be introduced or exercised. Never ok:true.

Subsequent implementation follows the operator roles: Astra/xhigh planning, Sol/max direction and independent review, GPU gpu-fqaf Qoder Efficient coding, coordinator GitHub handling. No batch script, swarm, implementation or GitHub action is dispatched in this documentation-only turn. Review must check the exact reviewed head and all applicable gates before any separately authorized merge; this document grants no merge permission.

Preserve [T-CORE-02-BATCH.md](T-CORE-02-BATCH.md), [the identity review](../SOL-IDENTITY-REVIEW.md), [the public contract freeze](OPENAPI-FREEZE.md) and all prior bounded holds. Full T-CORE-02, T-CORE-01 runtime/migration acceptance, identity, money, ledger, posting, rewards, integration, certification, pilot and launch remain unclosed, as do CP-00-11, PACK/REQ-SC/TEST and DEP-00-15 obligations. No G1-G6 PASS is granted.

Checks in this documentation turn cover the first-line decision, exact allowlist and SQL, in-memory proposed hash, protected-file hashes, local references, whitespace and a diff confined to NEXT-BATCH.md. No application build, unit test, database installation or PostgreSQL acceptance result is asserted.
