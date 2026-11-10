BATCH-OK

Authorize the minimum installation-authority repair in the existing 006 migration, followed by correction of the two existing stale-snapshot tests to require native PostgreSQL 40001 recovery through the unchanged application. This advances only the non-money refusal recorder.

Money closed. Never ok:true. No executeCommand or money_operations access. Session bind, bindSession activation, session minting, identity/KYC success, financial execution, provider calls, runtime activation, live traffic, deployment, pilot, launch and G1-G6 closure remain HOLD.

Implementation base: 0bb839869a10b1afcbb48413ca8ed1f06012bda2 (0bb8398), [PR #128](https://github.com/Joshluxr/Temp/pull/128). The operator has reproduced the stale-snapshot defect: a real 23505 on command_keys_book_id_actor_id_operation_key_key, one application attempt, the exact unconfirmed envelope, and an intact committed winner row. Accept that reported reproduction as the SQL-fix trigger; repeating discovery is not a prerequisite for this batch. This documentation turn has not rerun it.

006_non_money_refusal_conflict.sql is already in the tree. Its full-scope ON CONFLICT DO NOTHING repair is present, but the operator's apply attempt failed with “must be owner of function record_non_money_refusal”. The installer is kita_test, NOSUPERUSER CREATEROLE; the function belongs to kita_refusal_definer. Installation and native recovery remain unproved. Confirm that the failed transaction left the recognized 005 definition and security state intact before another application.

Both stale-snapshot cases also exist. Despite their recovery titles, they currently expect UNCONFIRMED, 23505 and one checkout. Those assertions preserve the reproduction; they do not establish recovery. There are 13 PostgreSQL cases in the source, comprising the 11 prior cases and these two, and 9 refusal unit cases. These are source counts, not passing results from this turn.

This decision supersedes the previous NEXT-BATCH instructions that treated the defect as hypothetical, proposed a new conditional 006 and two new cases, or prohibited all temporary membership grants. BATCH-OK approves only the subsequent scope below. It grants no test PASS, complete refusal-slice acceptance, deployment or merge permission. The current turn edits only docs/kita-plan/addenda/NEXT-BATCH.md and runs no database operation, application test, batch script, swarm or GitHub mutation.

The complete subsequent implementation allowlist is:

| File | Permitted change |
|---|---|
| apps/kita/packages/database/migrations/006_non_money_refusal_conflict.sql | Add the minimum transaction-contained installer membership grant/revoke and read-only, fail-closed installation/security assertions described below. Preserve the existing conflict repair and function body. |
| apps/kita/packages/database/__tests__/non-money-refusal-postgres.spec.ts | Correct the two existing stale-snapshot cases to require native 40001 and exactly two application attempts. Adjust their test-local coordination, real-driver observation, bounded cleanup and relevant read-only preflight assertions as necessary. Retain all 11 other cases and their behavior. |

No other path is authorized. Preserve every application source file, transaction helper, store, pool, migration runner, export, contract, route, worker, manifest, lockfile, dependency, configuration and existing PostgreSQL helper. Preserve the 9-case non-money-refusal-store.spec.ts, all migrations other than 006, every 001 copy, apps/kita/sql/CHECKSUMS.txt, migration ledgers, historical reviews and all unrelated tracked and untracked work. Add no helper, generated artifact, evidence file or snapshot to the repository. Evidence belongs in the operator's credential-free review output.

The protected 005 file has SHA-256 1a6b1f45f9fe5d6b29dee3a7bb58146dcc58154530ac9145b7da37c11ac55e07. Its record function body, including leading/trailing newlines, is 3799 UTF-8 bytes with SHA-256 b02f86166e57077af7dde9702455492c344e4f543ac21408b4b6f979fdf2b5e8. At 0bb8398, 006 has file SHA-256 33616d773851ffd73aef9f12b9c6fc2625a544f4bab90ca1e4ba121ae397d4d5; its function body is 3950 UTF-8 bytes with SHA-256 a6140caff93ff7a014ee33ae6c32bb669f8bd75322580fdaafc9c3179f76898a. The approved wrapper changes the 006 file hash; review and record the new hash before application. The 006 body must retain that existing body hash.

The authority repair is safe within these bounds because 005 already uses temporary definer membership to perform ownership work and then revokes it. PostgreSQL 18 gives a nonsuperuser role creator a bootstrap-granted ADMIN-only membership, with INHERIT FALSE and SET FALSE; that permits a separate self-grant without itself conveying function-owner privileges. This explains a possible existing authority path, not a claim about live catalogs. CREATEROLE alone does not prove ADMIN authority on this particular role. [PostgreSQL 18 role attributes](https://www.postgresql.org/docs/18/role-attributes.html).

Use kita_test's existing schema authority plus temporary inherited membership of kita_refusal_definer. Replacing an existing function accepts inherited ownership privileges and retains the function's owner and ACLs. The 006 repair needs no ownership transfer or new schema grant. [PostgreSQL 18 CREATE FUNCTION](https://www.postgresql.org/docs/18/sql-createfunction.html).

The authorized installation sequence is:

1. Connect directly as kita_test to the pinned target below. Require session_user = current_user = kita_test and the actual NOSUPERUSER CREATEROLE attributes. Before any mutation, verify the recognized 001 + 004 + 005 installation and exact existing kita.record_non_money_refusal(text,text) signature, return type, OID, owner, body hash, language, SECURITY DEFINER, fixed search_path and remaining function properties. Inspect the existing refusal roles, bindings, constraints, triggers and grants. An absent function, unknown definition, partially installed state or already-installed 006 is HOLD; do not recreate a missing function or reset the target.
2. Capture the relevant role attributes and complete relevant pg_auth_members rows, including grantor and ADMIN/INHERIT/SET flags, plus schema/table/column/function ACLs. Prove kita_test already has ADMIN OPTION on kita_refusal_definer. For the expected 005-created state, distinguish the bootstrap-granted ADMIN-only row from a kita_test-granted row. Require the temporary kita_test-granted membership to be absent before adding it. Verify existing CREATE authority on schema kita and required language/type privileges. A self-membership test such as pg_has_role(current_user, 'kita_test', 'USAGE') proves no CREATEROLE or definer-administration authority.
3. Within 006's single BEGIN/COMMIT transaction, while current_user remains kita_test, authorize only GRANT kita_refusal_definer TO CURRENT_USER WITH ADMIN FALSE, INHERIT TRUE, SET FALSE GRANTED BY CURRENT_USER. Verify that it supplies inherited owner authority. It adds no ADMIN or SET capability. Preserve the existing bootstrap administration grant and every other membership.
4. Execute the existing reviewed CREATE OR REPLACE FUNCTION statement in 006, preserving its body and all recognized function properties. Do not copy 005's ALTER FUNCTION OWNER or temporary schema CREATE grant. The function must remain owned by kita_refusal_definer throughout.
5. Before COMMIT, execute REVOKE kita_refusal_definer FROM CURRENT_USER GRANTED BY CURRENT_USER RESTRICT. Remove only the grant made in step 3. Compare memberships, their grantors/options, role attributes and all captured ACLs against the pre-installation state. Require equality, the original function OID/owner/security properties and the reviewed 006 body hash. Any failed grant, replacement, revoke or assertion must abort and roll back the entire transaction.
6. Commit only after those checks pass. On a fresh directly authenticated kita_test connection, verify the installed body and unchanged authority/security state again, including the absence of the temporary grant. Retain any pre-existing ADMIN-only membership exactly as found; it is not a new grant and need not disappear.

Pinning the grantor makes cleanup specific to the temporary grant; PostgreSQL distinguishes grants made by different grantors. No CASCADE or attempt to remove the bootstrap grant is authorized. [PostgreSQL 18 GRANT](https://www.postgresql.org/docs/18/sql-grant.html), [PostgreSQL 18 REVOKE](https://www.postgresql.org/docs/18/sql-revoke.html).

The grant, replacement, revoke and pre-commit assertions must use one dedicated connection and one transaction, with no intermediate commit or application transactions active. Use fail-fast execution and roll back/close on failure so the temporary grant cannot survive an interrupted apply. No superuser session, new role, role-attribute change, permanent extra membership, object ACL change, ownership transfer, DROP/recreate, schema/table/index/trigger/constraint change, data rewrite, extension, reset or migration-ledger manipulation is allowed. Apply only the reviewed 006 once; do not edit/reapply 005 or run the generic migration runner. This is a bounded application to the existing test installation, not migration-runner, fresh-install or production-deployment acceptance.

Database execution is limited to the already provisioned PostgreSQL 18.6 target at 127.0.0.1:54339/kita_core_test, supplied explicitly through KITA_REFUSAL_TEST_OWNER_URL without fallback credentials. Before fixture provisioning or installation, verify server_version_num = 180006, actual database/session/current user, kita schema ownership by kita_test and actual fixture-provisioning authority from role attributes and memberships. Require fsync=on, full_page_writes=on and synchronous_commit=on for every writer, without changing them. Missing configuration, unavailable target, unexpected authority or mismatched installation leaves execution HOLD.

Runtime evidence must use independently connected, directly authenticated restricted fixture logins, with verified attributes, recorder membership, immutable binding and disabled book scope. The application and rival connections may use the same bound fixture login to contend on the identical book/actor/operation/key, but must be distinct backends. Owner connections or owner-plus-SET ROLE do not supply runtime evidence. The owner may use the unchanged bounded fixture provisioning and read-only observation of catalogs, fixture bindings/books and fully scoped reserved refusal rows. No financial or identity data query is authorized. Keep fixture credentials in memory and out of output, argv and artifacts.

Runtime application calls remain recordNonMoneyRefusal(pool, input), using only recordNonMoneyRefusal.v1. Preserve the maximum of three total attempts and the existing structured retry whitelist of 40001/40P01. No application change, blanket 23505 retry, message-based classification, manual application retry, changed backoff, extra retry loop or transport-uncertainty retry is permitted. A complete new transaction is the unit of serialization recovery. [PostgreSQL 18 serialization failure handling](https://www.postgresql.org/docs/18/mvcc-serialization-failure-handling.html).

Preserve 006's explicit ON CONFLICT (book_id, actor_id, operation, key) DO NOTHING, inserted-row count, fully scoped conflict reread, stored-row/hash checks and fail-closed integrity result. Allow the server's native 40001 to escape unchanged to the existing helper. No DO UPDATE, history rewrite, manufactured SQLSTATE, manual RAISE of 40001, invented winner response or altered key/tag/actor/book/operation is authorized. Preserve login OID/name validation, recorder restrictions, binding lookup, disabled-book requirement and request validation.

The committed stored and returned refusal remains exactly:

~~~json
{"ok":false,"error":{"code":"CAPABILITY_UNAVAILABLE","status":503,"retryable":false,"detail":"Command execution is unavailable."}}
~~~

The unconfirmed persistence result remains exactly:

~~~json
{"ok":false,"error":{"code":"dependency_unavailable","status":503,"retryable":true,"detail":"Refusal persistence is unconfirmed; retry the same key."}}
~~~

The changed-tag result remains exactly:

~~~json
{"ok":false,"error":{"code":"IDEMPOTENCY_MISMATCH","status":409,"retryable":false,"detail":"Idempotency key is bound to a different request."}}
~~~

Preserve every other existing error envelope, state rejected, resource_id NULL, the rr1 SHA-256 over the UTF-8 canonical bytes {"requestTag":"<tag>","schemaVersion":1}, and immutable row identity/history.

Update the existing two stale-snapshot cases in place, retaining their names and using distinct fresh fixture-scoped keys. Their schedule must remain deterministic:

1. Independently establish that the fully scoped key has no row. Start the unchanged store through the test-local adapter. Forward the first attempt's real BEGIN ISOLATION LEVEL SERIALIZABLE, then establish and capture its snapshot using pg_current_snapshot() on that same connection before the function query. Record authenticated identity, backend identity, actual isolation and synchronous_commit. Signal the snapshot checkpoint.
2. On the separate restricted rival backend, use the existing SQL function in a real READ COMMITTED transaction for the identical scoped key. Await its real COMMIT. Independently fetch and retain the committed winner row before releasing the application's first function query. READ COMMITTED is confined to this rival; every application attempt remains SERIALIZABLE.
3. Release the original application query against the older snapshot. Capture its real driver's structured 40001 before mapping and rethrow that same error unchanged. Observe completion of ROLLBACK and exactly one release of attempt 1 before the next checkout. Let the unchanged helper start attempt 2 on a fresh checkout and SERIALIZABLE transaction, with no imported or repinned old snapshot. Forward the same full function query with identical application parameters.

The required outcomes are:

| Existing case | Required recovery after 006 |
|---|---|
| stale-snapshot same tag recovers through native 40001 | The winner uses the application's tag. Attempt 1 raises native 40001. Attempt 2 returns the stored refusal, its real COMMIT completes, and only then the store resolves to the exact committed refusal. Exactly two checkouts and one release per attempt. |
| stale-snapshot changed tag recovers as 409 after native 40001 | The winner uses a different tag. Attempt 1 raises native 40001. Attempt 2 uses the original losing tag, receives the function's real KRF02, rolls back and releases once, and the store returns the exact 409 envelope. Exactly two checkouts; no losing COMMIT. |

The fixed cases must fail on 23505, UNCONFIRMED, one checkout, extra attempts or missing cleanup. Remove the old requirements that the first error have SQLSTATE 23505 and its unique-constraint field; retain that constraint identity in the baseline reproduction record. Do not require a uniqueness-constraint field on native 40001.

Extend only the necessary local observations to prove the full ordered sequence: query/parameter identity, snapshot established, rival COMMIT completed, first native error, first ROLLBACK completed, first release, fresh second checkout/BEGIN, second real function result or KRF02, and the appropriate completed COMMIT or ROLLBACK followed by one release. Counts and ordering must describe actual forwarded operations and their completion, not supplied flags or logging before an awaited query finishes. A successful final envelope without the observed first fault and helper retry is insufficient.

For each case, independently compare id, book_id, actor_id, operation, key, request_hash, state, resource_id, response and created_at immediately after the winner COMMIT and after application recovery. Require exactly one row under the full book/actor/operation/key identity and an independently computed winner rr1 hash. Subsequent ordinary same-tag replay and changed-tag calls through the unchanged store must preserve that same complete winner row; keep these calls outside the controlled attempt count.

Bound snapshot/winner waits, connection establishment, SQL operations, case duration and cleanup. Use explicit checkpoints rather than timing sleeps to create the schedule. Settle or cancel coordination on every failure, observe the application promise, roll back open transactions, close each newly owned client/pool and await asynchronous shutdown. The present fire-and-forget client.end() in the stale-snapshot adapter is not evidence of completed cleanup; track and await its completion within the existing spec. The adapter may observe, coordinate and pin only attempt 1. It must not fabricate SQLSTATEs, rows or responses, replace the store/helper, alter the application retry options or retry on its own.

No new process/backend/server signaling or PostgreSQL restart is authorized. Preserve the existing test-owned client-crash cases unchanged when running the full suite. Apart from unchanged bounded fixture provisioning, data mutation is limited to refusal insertion through the existing SQL function. Do not delete or rewrite immutable fixture history.

Review the complete allowlisted patch, the new 006 file hash and its unchanged body hash before applying 006 to the verified target. The operator's supplied baseline reproduction satisfies the discovery gate. An optional run of the strengthened cases on recognized 005 is a negative control expected to fail; it does not require resetting or reapplying 005. Do not count the current 23505-expecting tests as recovery acceptance.

After the authorized 006 application, validation from the repository root is:

~~~sh
npm --prefix apps/kita run typecheck --workspace @kita/database
KITA_PG_TEST=0 KITA_REFUSAL_PG_TEST=0 npm --prefix apps/kita run test --workspace @kita/database -- __tests__/non-money-refusal-store.spec.ts
KITA_PG_TEST=0 KITA_REFUSAL_PG_TEST=1 npm --prefix apps/kita run test --workspace @kita/database -- --fileParallelism=false __tests__/non-money-refusal-postgres.spec.ts -t stale-snapshot
KITA_PG_TEST=0 KITA_REFUSAL_PG_TEST=1 npm --prefix apps/kita run test --workspace @kita/database -- --fileParallelism=false __tests__/non-money-refusal-postgres.spec.ts
KITA_PG_TEST=0 KITA_REFUSAL_PG_TEST=0 npm --prefix apps/kita run test --workspace @kita/database
(cd apps/kita/sql && sha256sum -c CHECKSUMS.txt)
node --test apps/kita/database/tests/checksums.test.mjs
git diff --check
~~~

The focused run must execute both recovery cases successfully; the other cases are outside its name filter. The full selected PostgreSQL run must execute all 13 cases, including the 11 prior cases, without failures or skips. The 9 refusal unit cases must remain intact. Missing target configuration or coordination must fail a selected run. Unselected PostgreSQL skips in the offline broader run provide no database evidence. Record commands, exit statuses, exact counts, failures, filtered cases and skips without credentials; report existing diagnostics rather than clearing them with out-of-scope edits.

Independent Sol/max review requires the approved documentation commit, exact implementation base/head and tested head, complete two-file diff, protected-file comparisons against 0bb8398, operator baseline reproduction and owner-error record, reviewed/applied 006 file hash, installed-body comparison, and before/after security/membership observations including successful cleanup of the temporary grant. Include raw driver error provenance and ordered attempt traces for both cases, full winner-row preservation and validation results. No manufactured error or test that merely asserts supplied evidence flags can satisfy this review.

Subsequent work follows the operator roles: Astra/xhigh planning within this freeze; Sol/max direction and independent review; GPU gpu-fqaf Qoder Efficient Agent Teams/subagents implementation; coordinator synchronization and GitHub handling. Failed review returns to Qoder as a scoped fix batch. This documentation turn dispatches no work. Any separately authorized merge still requires applicable review, tests and merge gates against the exact final head.

If the existing authority or installation cannot satisfy these bounds, stop dependent work with BATCH-HOLD and an empty implementation allowlist; do not obtain extra authority or widen the patch. The next non-money production candidate is adversarial restricted-login privilege and immutable-history evidence for the existing refusal recorder, requiring a separately reviewed scope.

Passing this batch may establish only safe bounded 006 installation and demonstrated statement-time native 40001 recovery for these two stale-snapshot schedules. Real 40P01 recovery, native retry exhaustion, commit-time serialization recovery, server crash/restart durability and failover remain unclaimed. The requirement for 100 independently connected contenders behind a barrier remains open; the existing 100 requests through a pool capped at 40 do not close it. Remaining grant/immutability/spoofing/migration evidence also remains open.

Preserve [T-CORE-02-BATCH.md](T-CORE-02-BATCH.md), [the identity review](../SOL-IDENTITY-REVIEW.md), [the public OpenAPI freeze](OPENAPI-FREEZE.md) and prior bounded holds. Full T-CORE-01/T-CORE-02 acceptance, session bind, identity, money, ledger, posting, rewards, integration, certification, pilot and launch remain unclosed, as do CP-00-11, PACK/REQ-SC/TEST and DEP-00-15 obligations. No G1-G6 PASS or production approval is granted.

Checks in this documentation turn cover the exact head, source scope, baseline hashes, PostgreSQL authority documentation, local links, whitespace and a tracked diff confined to NEXT-BATCH.md. No build, typecheck, unit test, PostgreSQL reproduction, migration application or native-recovery PASS is claimed. Money closed. Never ok:true.
