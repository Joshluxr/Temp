BATCH-OK

Money closed. Never ok:true. executeCommand and money_operations access remain HOLD. No financial execution, session minting, identity/KYC success, provider calls, live traffic, deployment, pilot, launch or G1-G6 closure is authorized.

Baseline: e072555e6a6fd6daa741a17f80eb951de71b818f (e072555, PR #126). The 004 UNIQUE(id,book_id) repair is present. The operator reports that 004 applies on PostgreSQL 18.6 at 127.0.0.1:54339, and that the subsequent 005_non_money_refusal.sql transaction failed at:

~~~sql
ALTER FUNCTION kita.record_non_money_refusal(text, text) OWNER TO kita_refusal_definer;
~~~

~~~text
ERROR: must be able to SET ROLE kita_refusal_definer
~~~

The operator reports complete rollback and an absent kita.non_money_refusal_principals table. Treat that as reported installation evidence, with catalog confirmation required before retrying. Do not repeat the superseded 004 failure or claim that 005 installed.

Authorize only the temporary authority required for this ownership transfer, in 005's existing transaction. The original freeze at `git show e3b2b15:docs/kita-plan/addenda/NEXT-BATCH.md` explicitly requires: "Temporary migration-owner membership/schema privileges needed to transfer function ownership must be removed before commit."

A membership-only edit would encounter another ownership requirement: PostgreSQL 18 also requires the new function owner to have CREATE on the function's schema. Existing 005 grants only USAGE, after the transfer. The exact repair below therefore includes a temporary schema CREATE grant and its immediate revocation, as allowed by that original freeze. No lasting schema CREATE is permitted. See [PostgreSQL 18 ALTER FUNCTION](https://www.postgresql.org/docs/18/sql-alterfunction.html).

This document replaces NEXT-BATCH.md entirely and freezes a subsequent implementation batch. It grants no implementation PASS, installation PASS, runtime activation, refusal-slice acceptance or merge permission. This documentation turn edits only docs/kita-plan/addenda/NEXT-BATCH.md; it does not edit SQL or connect to PostgreSQL.

Exactly one existing implementation file may change:

| File | Only permitted changes |
|---|---|
| apps/kita/packages/database/migrations/005_non_money_refusal.sql | The two exact replacements below: temporary ownership-transfer grants, then their revocation before the existing COMMIT. |

No new file, glob or other edit is authorized. Preserve application code, tests, helpers, runners, migration ledgers, dependencies, configuration, public contracts, historical evidence and existing untracked files. Preserve all 001 copies, 004 and apps/kita/sql/CHECKSUMS.txt byte for byte. The checksum manifest covers the legacy SQL copies; do not regenerate it or add 005.

In 005, replace exactly this existing single SQL line, leaving its surrounding blank lines intact:

~~~sql
ALTER FUNCTION kita.record_non_money_refusal(text, text) OWNER TO kita_refusal_definer;
~~~

with exactly these four lines:

~~~sql
GRANT kita_refusal_definer TO CURRENT_USER WITH INHERIT TRUE, SET TRUE;
GRANT CREATE ON SCHEMA kita TO kita_refusal_definer;
ALTER FUNCTION kita.record_non_money_refusal(text, text) OWNER TO kita_refusal_definer;
REVOKE CREATE ON SCHEMA kita FROM kita_refusal_definer;
~~~

CURRENT_USER must be the authenticated migration owner kita_test, with session_user = current_user throughout installation. SET TRUE permits the ownership transfer; INHERIT TRUE keeps the existing subsequent function ACL statements executable by the migration owner after transfer. No SET ROLE or SET SESSION AUTHORIZATION statement is added. No ADMIN option or grant option is added. Explicit membership options avoid relying on the login's default inheritance attribute. See [PostgreSQL 18 GRANT](https://www.postgresql.org/docs/18/sql-grant.html).

Replace exactly the final `COMMIT;` line with these three lines, preserving the existing preceding blank line and the final LF:

~~~sql
REVOKE kita_refusal_definer FROM CURRENT_USER;

COMMIT;
~~~

Keep every intervening existing statement unchanged. In particular, the existing PUBLIC revoke, recorder EXECUTE grant, schema USAGE grants and minimum column grants run while the migration owner still has the temporary membership. The schema CREATE privilege is revoked immediately after ownership transfer; the added membership is revoked after all existing ACL work and before COMMIT. Do not move the membership revoke immediately after ALTER FUNCTION, where it could prevent that ACL work.

These are four added SQL statements across two replacements. Preserve every other byte, including comments, whitespace, LF endings, role definitions, function body, SECURITY DEFINER, search_path, constraints, triggers, transaction boundaries and existing grants. No conditional fallback, role reuse, alternate owner, superuser execution, schema ownership transfer, CASCADE, seed data or out-of-band grant is authorized. A collision or error stops the batch.

The required implementation SHA-256 was computed from those exact replacements in memory. No SQL file was written or applied in this documentation turn.

| File | Baseline SHA-256 | Required implementation SHA-256 |
|---|---|---|
| apps/kita/packages/database/migrations/005_non_money_refusal.sql | 6a0ba525b4a028bf968cd9834292b0fe48a9e1d497bd197a9c12b4970c136a12 | d51ea63bba358c8e06bf29c4cf90a3c55d0d0041490aba3c4862c4d82a3015c1 |

Protected files must retain these hashes:

~~~text
6fa76837f31962ca7865572caed50de8845b05614eacef5dec30c40befcd8e22  apps/kita/packages/database/migrations/001_core.sql
adc3c403feb2e98c5d808a7c28ebfada2048615f44590c64e838a952ad87ce05  apps/kita/packages/database/migrations/004_identity_access.sql
d977da22f83f7a8e6c0b299a5740ef1815ac2d3eb3131468cf61259cf75910d2  apps/kita/sql/001_core.sql
d977da22f83f7a8e6c0b299a5740ef1815ac2d3eb3131468cf61259cf75910d2  docs/kita-plan/sql/001_core.sql
0cc9d574f2f9b716a9c90f6a3e5e83053c47a45f49609b93d72b12bfbefee2fd  apps/kita/sql/CHECKSUMS.txt
~~~

Review the exact implementation base/head and complete one-file diff against the approved documentation head. Verify the required 005 hash, both replacements, both revocations before the sole COMMIT, all protected hashes and byte identity of the planning/legacy 001 pair. From the repository root, run:

~~~sh
(cd apps/kita/sql && sha256sum -c CHECKSUMS.txt)
node --test apps/kita/database/tests/checksums.test.mjs
git diff --check
~~~

Validate installation only on the explicitly configured dedicated target: PostgreSQL 18.6 at 127.0.0.1:54339/kita_core_test, authenticated migration owner kita_test, using the existing explicit KITA_REFUSAL_TEST_OWNER_URL requirement. Verify the URL and actual server version, database, session_user, current_user, CREATEROLE authority and kita schema ownership before mutation. Record identities and file hashes without credentials. Do not substitute a target, invent credentials, provision a service or elevate the owner.

The recognized retry state is the already installed unchanged package 001 plus unchanged repaired 004, with the failed 005 fully rolled back. Confirm the 004 unique constraint and dependent same-book FK remain installed, and all 005 objects, refusal roles and reserved-operation rows are absent. Checking only the principals table is insufficient. If the state is verified, apply the complete patched 005 once; do not rerun 001 or 004 over existing objects. Unknown or partial state requires BATCH-HOLD. No reset, drop or cleanup of unknown leftovers is authorized.

Use psql with -X, ON_ERROR_STOP=1 and VERBOSITY=verbose. Apply the checked-in file bytes directly, without filtering, rewriting, skipping statements or invoking either migration ledger. Record command exit status, SQLSTATE on failure and the transaction outcome. If any statement fails, stop, confirm rollback and report the exact file/statement/SQLSTATE as the next blocker; return to BATCH-HOLD without expanding this batch. Do not continue into application or financial functions, providers, fixtures or live traffic.

After COMMIT, inspect pg_catalog to confirm the entry point is owned by kita_refusal_definer with its unchanged SECURITY DEFINER/search_path settings. Confirm the definer has schema USAGE and no effective schema CREATE, owns no existing table, and retains only the existing bounded column privileges. Confirm PUBLIC cannot execute the entry point and the recorder retains only its existing entry-point EXECUTE/schema USAGE authority. Compare unrelated ownership, default privileges, ACLs and role attributes/memberships with the pre-install snapshot; no new privilege or membership for kita_api, kita_worker, kita_posting, kita_auditor or PUBLIC is allowed.

Membership cleanup evidence must distinguish grantors. PostgreSQL 18 automatically grants a non-superuser CREATEROLE creator ADMIN TRUE, SET FALSE, INHERIT FALSE membership in each created role, attributed to the bootstrap superuser. A self-grant adds SET/INHERIT authority; revoking it does not remove the separate bootstrap grant. This is existing CREATE ROLE behavior, not additional authority introduced by this repair. See [PostgreSQL 18 role attributes](https://www.postgresql.org/docs/18/role-attributes.html).

Inspect pg_auth_members, including grantor, admin_option, inherit_option and set_option, for both new roles. Require the added kita_test self-grant to be absent after COMMIT, with no remaining effective SET or inherited access from kita_test to kita_refusal_definer. Only the automatic bootstrap ADMIN-only grants from the unchanged CREATE ROLE statements may remain; do not claim zero membership rows. No superuser removal or change of those bootstrap grants is authorized. An unexpected grantor, extra grant, enabled SET/INHERIT option, failed revocation or residual CREATE privilege requires BATCH-HOLD. Preserve the original requirement that all temporary transfer authority is removed before commit; this document does not certify other original-freeze obligations already missing from 005.

A successful retry establishes installation only on that observed target. Fresh-install evidence remains open unless a separately provisioned recognized empty state is available on the pinned dedicated target, with absent refusal roles, for complete unchanged package 001, unchanged package 004 and patched package 005 in order. Do not clear the current database to manufacture it.

The existing apps/kita/packages/database/__tests__/non-money-refusal-postgres.spec.ts is a throwing placeholder when selected. Do not edit it or count a skip/failure as PostgreSQL acceptance. Runtime-role, cross-scope, retry, contention, crash/recovery, durability, immutability and full grant evidence remain open. The refusal contract and PostgreSQL acceptance requirements in `git show e3b2b15:docs/kita-plan/addenda/NEXT-BATCH.md` remain required, subject only to the completed 001/004 repairs and this exact ownership-transfer repair. Its former five-file allowlist is not reopened.

This narrow exception supersedes the prior byte-preservation hold on 005 only for the exact four additions above. No broader role/ACL change, command executor, money access, session minting, KYC/identity success or success-capable response is authorized. Never ok:true.

Subsequent implementation follows the operator roles: Astra/xhigh planning, Sol/max direction and independent review, GPU gpu-fqaf Qoder Efficient coding, coordinator GitHub handling. No batch script, swarm, implementation or GitHub action is dispatched in this documentation-only turn. Any later separately authorized merge must re-run applicable review, test and exact-head gates; this document grants no merge permission.

Preserve [T-CORE-02-BATCH.md](T-CORE-02-BATCH.md), [the identity review](../SOL-IDENTITY-REVIEW.md), [the public contract freeze](OPENAPI-FREEZE.md) and all prior bounded holds. Full T-CORE-02, T-CORE-01 runtime/migration acceptance, identity, money, ledger, posting, rewards, integration, certification, pilot and launch remain unclosed, as do CP-00-11, PACK/REQ-SC/TEST and DEP-00-15 obligations. No G1-G6 PASS is granted.

Checks in this documentation turn cover the first-line decision, exact allowlist and SQL, in-memory required hash, protected-file hashes, local references, whitespace and a diff confined to NEXT-BATCH.md. No application build, unit test, database installation or PostgreSQL acceptance result is asserted.
