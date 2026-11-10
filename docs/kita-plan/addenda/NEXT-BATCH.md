BATCH-OK

Money closed. Never ok:true. executeCommand and money_operations access remain HOLD. No financial execution, session minting, identity/KYC success, provider calls, live traffic, deployment, pilot, launch or G1-G6 closure is authorized.

Baseline: 651ef51d5f3018c08c53b37e73ca182f402c551a (651ef51, PR #127). The operator reports that 005_non_money_refusal.sql now applies. The ownership-transfer repair is present; the earlier failed-transfer/rolled-back installation state is superseded. Installation does not establish runtime acceptance.

The operator reports that restricted recorder logins with WITH INHERIT TRUE membership still receive KRF01/unauthorized, with v_oid unresolved. The entry point currently selects a.oid through an unnecessary join to pg_catalog.pg_authid, which its non-superuser SECURITY DEFINER owner cannot read. pg_catalog.pg_roles already supplies the login OID and every checked role attribute. Remove the protected-catalog dependency; do not grant catalog access or weaken authorization checks. Preserve raw database SQLSTATE evidence separately from the application's unauthorized mapping.

This document replaces NEXT-BATCH.md entirely and freezes one subsequent implementation change. BATCH-OK is a scope decision, not an implementation PASS, PostgreSQL result, runtime activation, refusal-slice acceptance or merge permission. This documentation turn edits only docs/kita-plan/addenda/NEXT-BATCH.md. No migration, application code, test, helper, configuration or generated file is edited or applied now.

Exactly one existing implementation file may change in the subsequent batch:

| File | Only permitted change |
|---|---|
| apps/kita/packages/database/migrations/005_non_money_refusal.sql | Replace the exact role-lookup block below: select r.oid directly from pg_catalog.pg_roles and remove the pg_authid join. |

No new file, glob or other edit is authorized. Preserve application code, tests, helpers, runners, migration ledgers, dependencies, configuration, public contracts, historical evidence and all pre-existing tracked/untracked work. The currently modified PostgreSQL test/helper files are outside this batch and supply no reviewed acceptance evidence here. Preserve every other byte of 005 and every other implementation file, including all 001 copies, 004 and apps/kita/sql/CHECKSUMS.txt. That manifest covers legacy SQL copies; do not regenerate it or add 005.

In kita.record_non_money_refusal(text, text), replace exactly this existing block once:

~~~sql
  SELECT a.oid, r.rolsuper, r.rolcreatedb, r.rolcreaterole, r.rolreplication, r.rolbypassrls, r.rolinherit
    INTO v_oid, v_super, v_createdb, v_createrole, v_replication, v_bypass, v_inherit
  FROM pg_catalog.pg_roles r
  JOIN pg_catalog.pg_authid a ON a.rolname = r.rolname
  WHERE r.rolname = v_login;
~~~

with exactly:

~~~sql
  SELECT r.oid, r.rolsuper, r.rolcreatedb, r.rolcreaterole, r.rolreplication, r.rolbypassrls, r.rolinherit
    INTO v_oid, v_super, v_createdb, v_createrole, v_replication, v_bypass, v_inherit
  FROM pg_catalog.pg_roles r
  WHERE r.rolname = v_login;
~~~

Preserve the surrounding blank lines, indentation, LF endings and final LF. This changes a.oid to r.oid and deletes only the pg_authid JOIN line. No fallback lookup, exception swallowing, alternative identity source, dynamic SQL or additional catalog grant is authorized.

The subsequent membership lookup remains exactly as follows; this is unchanged context, not another replacement:

~~~sql
  SELECT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_auth_members m
    JOIN pg_catalog.pg_roles g ON g.oid = m.roleid
    WHERE m.member = v_oid
      AND g.rolname = 'kita_refusal_recorder'
      AND m.admin_option = false
  ) INTO v_member;
~~~

Thus pg_auth_members.member is compared to the same v_oid obtained from pg_roles.oid for v_login. Keep v_login initialized from session_user. Do not substitute current_user, a role name comparison, a caller-supplied value or a transitive-membership shortcut. Preserve the existing restricted-attribute, inheritance, membership, binding OID/name and disabled-book checks, including their failure behavior. This batch does not add or remove membership-option predicates.

Preserve RETURNS jsonb, LANGUAGE plpgsql, SECURITY DEFINER, SET search_path = pg_catalog, pg_temp, the kita_refusal_definer owner, the fixed refusal response, all validation and SQLSTATEs, binding scope, canonical hash, idempotency, reserved-row constraints and immutability triggers. No new data access, write path, success-capable response or change to another function is authorized.

Keep the ownership-transfer sequence byte for byte:

~~~sql
GRANT kita_refusal_definer TO CURRENT_USER WITH INHERIT TRUE, SET TRUE;
GRANT CREATE ON SCHEMA kita TO kita_refusal_definer;
ALTER FUNCTION kita.record_non_money_refusal(text, text) OWNER TO kita_refusal_definer;
REVOKE CREATE ON SCHEMA kita FROM kita_refusal_definer;
~~~

Keep all existing ACL statements and their ordering byte for byte: PUBLIC function revoke, recorder EXECUTE, recorder/definer schema USAGE, and the existing bounded column SELECT/INSERT grants. Preserve both CREATE ROLE definitions and the final REVOKE kita_refusal_definer FROM CURRENT_USER after the ACL work and before the sole COMMIT. Preserve BEGIN/COMMIT and every other comment, statement and whitespace byte. Do not change the owner to a superuser, use SET ROLE/SET SESSION AUTHORIZATION, grant access to pg_authid, transfer table/schema ownership, add persistent schema CREATE or leave temporary transfer authority behind.

The following SHA-256 values were computed from the baseline bytes and this single replacement in memory. No SQL file was written or applied in this documentation turn. The baseline is 8,367 bytes; the required implementation is 8,312 bytes.

| File | Baseline SHA-256 at 651ef51 | Required implementation SHA-256 |
|---|---|---|
| apps/kita/packages/database/migrations/005_non_money_refusal.sql | d51ea63bba358c8e06bf29c4cf90a3c55d0d0041490aba3c4862c4d82a3015c1 | 1a6b1f45f9fe5d6b29dee3a7bb58146dcc58154530ac9145b7da37c11ac55e07 |

Protected files must retain these hashes:

~~~text
6fa76837f31962ca7865572caed50de8845b05614eacef5dec30c40befcd8e22  apps/kita/packages/database/migrations/001_core.sql
adc3c403feb2e98c5d808a7c28ebfada2048615f44590c64e838a952ad87ce05  apps/kita/packages/database/migrations/004_identity_access.sql
d977da22f83f7a8e6c0b299a5740ef1815ac2d3eb3131468cf61259cf75910d2  apps/kita/sql/001_core.sql
d977da22f83f7a8e6c0b299a5740ef1815ac2d3eb3131468cf61259cf75910d2  docs/kita-plan/sql/001_core.sql
0cc9d574f2f9b716a9c90f6a3e5e83053c47a45f49609b93d72b12bfbefee2fd  apps/kita/sql/CHECKSUMS.txt
~~~

Review must identify the approved documentation head and exact implementation base/head, show the complete one-file implementation diff and verify the required 005 hash. Confirm that no pg_authid reference remains in 005, the membership predicate still reads m.member = v_oid, and every byte outside the one replacement is unchanged. Verify all protected hashes and byte identity of the planning/legacy 001 pair. Run from the repository root:

~~~sh
(cd apps/kita/sql && sha256sum -c CHECKSUMS.txt)
node --test apps/kita/database/tests/checksums.test.mjs
git diff --check
~~~

Static checks establish only conformance to this repair. They do not establish installation, successful role lookup or refusal persistence. Preserve original-freeze obligations that this narrow fix does not address; this document certifies no unrelated grants, constraints, retry behavior or harness changes.

PostgreSQL validation remains limited to the explicitly configured dedicated PostgreSQL 18.6 target at 127.0.0.1:54339/kita_core_test, authenticated migration owner kita_test, using KITA_REFUSAL_TEST_OWNER_URL with no default credentials. Verify the configured URL and actual server version, database, session_user, current_user, CREATEROLE authority and schema ownership before any mutation. Record identities, exact file hashes, commands, exit statuses and raw SQLSTATEs without credentials. Do not substitute a target, provision a service, elevate a role or reset/drop an existing database to manufacture evidence.

005 is reported installed at 651ef51. Do not rerun this create-only migration over its existing roles, tables, functions or constraints, and do not treat the old fully-rolled-back retry state as current. Editing the migration file does not update an installed function. No ad hoc CREATE OR REPLACE FUNCTION, out-of-band ACL/catalog grant, manual deployed-function patch, ledger manipulation or destructive cleanup is authorized by this freeze.

Installation evidence for the patched file requires a separately provisioned, recognized clean state on the pinned dedicated target, with absent refusal roles and new objects. Apply complete unchanged package 001, unchanged repaired package 004 and patched package 005 in order; a separately verified pre-005 state may receive the complete patched 005 once. Use psql -X with ON_ERROR_STOP=1 and VERBOSITY=verbose, applying the checked-in bytes directly without filtering or rewriting and without either migration ledger. Unknown/partial state, collisions or failed statements require BATCH-HOLD for database work. Record rollback and the exact file/statement/SQLSTATE on failure. If no recognized state is available, leave PostgreSQL evidence open; do not reset the reported installation.

After a valid patched installation, demonstrate the repaired path using independently authenticated restricted recorder LOGIN connections, not an owner session followed by SET ROLE. Fixture provisioning must stay within the original refusal-test authorization at git show e3b2b15:docs/kita-plan/addenda/NEXT-BATCH.md, use disabled test books only and create no financial/customer/session data. Do not edit the tests/helpers or broaden their fixture authority in this batch.

For an authorized fixture login, record its session_user/current_user outside the definer, pg_roles.oid and restricted attributes, its direct recorder membership with INHERIT TRUE and no ADMIN/SET authority, and its matching immutable login_oid/login_name binding. Observe that the patched entry point resolves that OID under its unchanged non-superuser definer and reaches the bound disabled-book path without the catalog-permission failure. A first valid call must commit exactly one scoped recordNonMoneyRefusal.v1 row in state rejected, resource_id NULL, with the exact frozen ok:false CAPABILITY_UNAVAILABLE response. An independent same-key/same-tag replay must preserve the row; a changed tag must retain KRF02 behavior without overwriting it. This records a refusal, never business success.

Unbound/revoked logins, mismatched OID/name bindings, elevated login attributes and non-disabled books must continue to refuse without a new row or another scope's disclosure. Invalid input still yields 22023. Observe direct restricted-login denials for table mutation and role/session escalation; catalog checks alone do not replace runtime evidence. Preserve existing cross-scope and immutability requirements. Do not query financial/identity data or invoke financial functions/providers as probes.

Inspect final ownership, search_path, role attributes, schema/table/function ACLs and memberships against the pre-install snapshot. The entry point must remain owned by kita_refusal_definer with SECURITY DEFINER, PUBLIC execution revoked and the recorder limited to its existing entry-point EXECUTE/schema USAGE authority. No pg_authid SELECT, persistent schema CREATE, new table ownership, extra column grant or new authority for kita_api, kita_worker, kita_posting, kita_auditor or PUBLIC is permitted.

Transfer cleanup evidence must include pg_auth_members grantor, admin_option, inherit_option and set_option. Require the temporary migration-owner self-grant to be absent and no remaining effective SET/inherited access from kita_test to kita_refusal_definer. Distinguish the existing automatic bootstrap ADMIN-only grants created by non-superuser CREATEROLE from the temporary self-grant; do not claim zero membership rows or alter those bootstrap grants. Preserve the existing immediate schema CREATE revocation and membership revocation before COMMIT. Unexpected residual authority requires BATCH-HOLD.

Full refusal-slice PostgreSQL acceptance remains open: real runtime-role, cross-scope, contention, retry, crash/recovery, durability, immutability and grant evidence are still required by the original freeze at git show e3b2b15:docs/kita-plan/addenda/NEXT-BATCH.md. Neither successful installation nor a repaired lookup closes them. Existing modified tests/helpers require their own authorized review and are not incorporated into this one-file repair. The original five-file implementation allowlist is not reopened.

Subsequent implementation follows the operator roles: Astra/xhigh planning, Sol/max direction and independent review, GPU gpu-fqaf Qoder Efficient coding, coordinator GitHub handling. No batch script, swarm, implementation, database connection or GitHub action is dispatched in this documentation-only turn. Any later separately authorized merge must rerun applicable review, test and exact-head merge gates; this document grants no merge permission.

Preserve [T-CORE-02-BATCH.md](T-CORE-02-BATCH.md), [the identity review](../SOL-IDENTITY-REVIEW.md), [the public contract freeze](OPENAPI-FREEZE.md) and all prior bounded holds. Full T-CORE-02, T-CORE-01 runtime/migration acceptance, identity, money, ledger, posting, rewards, integration, certification, pilot and launch remain unclosed, as do CP-00-11, PACK/REQ-SC/TEST and DEP-00-15 obligations. No G1-G6 PASS is granted. Money closed. Never ok:true.

Checks in this documentation turn cover the first-line decision, exact one-file allowlist and SQL replacement, in-memory implementation SHA-256, protected-file hashes, local references, whitespace and preservation of all other workspace files. No application build, typecheck, unit test, PostgreSQL installation or runtime acceptance result is asserted.
