BATCH-OK

Next batch toward production-ready US-PH Kita: reproduce and repair the refusal recorder's invisible same-key conflict, then prove recovery through the unchanged application's real PostgreSQL retry path. The proposed implementation is one forward SQL migration and focused evidence in one existing PostgreSQL spec. It advances the existing non-money persistence operation; it adds no evidence checker, readiness Boolean or business-success path. SQL changes are conditional on the concrete reproduction below. If the baseline already recovers correctly, this batch is only more tests in the existing PostgreSQL spec; report that explicitly and omit the migration.

Money closed. Never ok:true. No executeCommand or money_operations access. Session bind, bindSession activation, session minting, identity/KYC success, financial execution, provider calls, runtime activation, live traffic, deployment, pilot, launch and G1-G6 closure remain HOLD.

Baseline: de87a6dadef71cead19bfa4b9497b1f48ab5caf0 (de87a6d), branch cursor/kita-core02-refusal-pg-evidence-05a3, [PR #128](https://github.com/Joshluxr/Temp/pull/128). Client-crash and lost-COMMIT tests are implemented. The reported refusal suites are 11 PostgreSQL cases and 9 unit cases. These include client loss before COMMIT, recovery after acknowledged COMMIT, withheld COMMIT completion at the application boundary, COMMIT ordering and unconfirmed-result cleanup. These are reported baseline results, not checks rerun by this documentation turn. Server-crash durability and real 40001/40P01 recovery remain unclaimed at this head. The prior client-crash/lost-COMMIT batch is superseded as an implementation instruction and must not be repeated.

BATCH-OK freezes only the subsequent scope below. It is not a test PASS, full refusal-slice acceptance, production-readiness decision or merge permission. This turn rewrites only docs/kita-plan/addenda/NEXT-BATCH.md. It runs no database operation, batch script, coding swarm or GitHub mutation.

The source identifies a specific candidate defect: 005's unique_violation handler looks up the conflicting row in the same transaction snapshot and rethrows when that row is invisible. A raw 23505 reaches the store's unconfirmed response after one attempt because withSerializable retries only structured 40001/40P01. This is a source-based risk, not a reproduced PostgreSQL result. PostgreSQL documents that some concurrent unique violations reflect serialization conflicts and that treating every unique violation as retryable is unsafe. Preserve the application's maximum of three total attempts for structured 40001/40P01 and its absence of automatic retries for 23505 or transport uncertainty. [PostgreSQL 18 serialization failure handling](https://www.postgresql.org/docs/18/mvcc-serialization-failure-handling.html).

The complete subsequent implementation allowlist is:

| File | Permitted change |
|---|---|
| apps/kita/packages/database/migrations/006_non_money_refusal_conflict.sql | New, conditional forward migration replacing only kita.record_non_money_refusal(text,text)'s same-key insert/conflict handling after the specified baseline defect is reproduced. |
| apps/kita/packages/database/__tests__/non-money-refusal-postgres.spec.ts | Add the deterministic stale-snapshot regression cases, test-local real-driver observation and coordination, and read-only installation/authority checks needed for this migration. Retain all existing cases. |

No other file is allowed. Preserve src/non-money-refusal-store.ts, src/transaction.ts, src/pool.ts, src/migrate.ts, src/index.ts, the 9-case non-money-refusal-store.spec.ts, both existing PostgreSQL helpers, every existing migration, every 001 copy, apps/kita/sql/CHECKSUMS.txt, migration ledgers, manifests, lockfiles, dependencies, configuration, contracts, exports, routes, workers, historical reviews and all pre-existing tracked and untracked work byte for byte. No new helper, generated artifact, evidence file or snapshot may be written into the repository. A defect requiring another path stops that dependent work with BATCH-HOLD and a concrete proposed scope; it does not expand this allowlist.

Runtime application calls remain recordNonMoneyRefusal(pool, input), using only recordNonMoneyRefusal.v1. The existing kita.record_non_money_refusal(text,text) SQL entry point may also be used by the restricted rival described below. Authenticate independent connections directly as existing restricted fixture logins bound to disabled test books. An owner connection followed by SET ROLE supplies no runtime evidence. The owner may provision the existing bounded fixtures, inspect catalogs, observe only their bindings/books and fully scoped reserved rows, and apply the single reviewed 006 under the conditions below. No financial or identity data query is authorized.

The committed stored and returned refusal remains exactly:

~~~json
{"ok":false,"error":{"code":"CAPABILITY_UNAVAILABLE","status":503,"retryable":false,"detail":"Command execution is unavailable."}}
~~~

An unconfirmed persistence result remains exactly:

~~~json
{"ok":false,"error":{"code":"dependency_unavailable","status":503,"retryable":true,"detail":"Refusal persistence is unconfirmed; retry the same key."}}
~~~

Preserve the exact IDEMPOTENCY_MISMATCH 409 envelope and all other existing errors. Preserve state rejected, resource_id NULL, the existing rr1 SHA-256 over the UTF-8 bytes {"requestTag":"<tag>","schemaVersion":1}, and immutable row identity/history. Neither the SQL function nor an adapter may manufacture a different key, tag, actor, book or operation to make a retry pass.

The baseline reproduction is mandatory before changing the installed function. Use explicit deferred checkpoints and two independently authenticated restricted backends in the same fixture scope:

1. Choose a fresh valid key and verify through the independent scoped observer that no reserved row exists. Call the unchanged store through a test-local adapter that forwards the real driver operations. On its first checkout, forward BEGIN ISOLATION LEVEL SERIALIZABLE, then execute a read-only pg_current_snapshot() query on that same connection to establish its transaction snapshot. Capture backend identity, isolation and synchronous_commit, and signal the snapshot checkpoint before allowing the rival to write.
2. On the rival's separate restricted connection, use a real READ COMMITTED transaction to call the existing SQL entry point with that key and the winner's tag, then await the real COMMIT. The independently observed winner row must exist before the first application attempt proceeds. READ COMMITTED is confined to this test rival: it exercises the SQL entry point's permitted use under mixed isolation. Every application attempt still uses the unchanged SERIALIZABLE helper. Do not present this schedule as evidence of 100 simultaneous SERIALIZABLE clients.
3. Release the first application's function query against its older snapshot. Observe the raw driver error before the store maps it, the actual query/checkout/release sequence and the returned envelope. The specific SQL-fix trigger is a real 23505 from the reserved same-key uniqueness conflict, one application attempt and the exact unconfirmed envelope, while the winner row remains intact. Record the actual constraint identity; an unrelated unique violation is not this defect.
4. If instead a real 40001 already causes automatic recovery to the correct committed refusal or changed-tag 409, preserve the existing SQL and deliver only regression tests in the existing spec. If the schedule cannot be established, produces another failure, or requires an out-of-scope privilege, hold the dependent SQL change and report the observation. Do not manufacture a failure to justify a migration.

The adapter may pin only the first attempt's snapshot, coordinate the real rival and observe real query results/errors. It must rethrow the original driver error unchanged. It must not synthesize a SQLSTATE, fabricate a response/row, import an old snapshot into a retry, replace the store/helper, manually retry for the application, or use RAISE EXCEPTION to imitate a native serialization failure. A normal successful response alone is insufficient: the evidence must show the first real fault and the helper's subsequent transaction.

Only after the specified 23505 defect is observed may 006 replace the function body. Keep its existing signature, language, SECURITY DEFINER policy, fixed search_path, login OID/name checks, recorder membership/role restrictions, immutable binding lookup, disabled-book requirement, validation, canonical hashing, row integrity checks and error envelopes. Change the reserved INSERT to use ON CONFLICT (book_id, actor_id, operation, key) DO NOTHING, with an explicit full-scope conflict target. Preserve validation of a conflicting stored row and return its response only after proving matching hash, rejected state, NULL resource and the exact frozen body. If no insert occurred and no valid row can be established, fail closed with the existing integrity error. Never return the refusal merely because an INSERT did nothing.

Let a native serialization error escape to the existing helper. No blanket unique-violation handling, DO UPDATE, history rewrite, manual 40001 raise, extra retry loop, changed attempt budget or expanded application retry whitelist is permitted. In PostgreSQL's 18 branch, the DO NOTHING executor checks conflicting-tuple visibility under transaction snapshots and can raise native 40001. That source supports the proposed mechanism; only the target's observed driver error and recovery establish that it works here. [PostgreSQL 18 executor source](https://github.com/postgres/postgres/blob/REL_18_STABLE/src/backend/executor/nodeModifyTable.c).

006 must be transactional, require the recognized existing 001 + 004 + 005 installation, and replace only this exact existing function. No DROP/recreate, ownership transfer, role creation/grant, ACL change, schema/table/index/trigger/constraint change, data rewrite, extension, reset or migration-ledger manipulation is permitted. Apply it only through already-existing authority to replace the definer-owned function; missing authority is HOLD, never a reason to grant it. Explicitly retain all function properties and compare owner, ACLs, SECURITY DEFINER and search_path before/after. CREATE OR REPLACE retains ownership and permissions but requires other properties to be specified correctly. [PostgreSQL 18 CREATE FUNCTION](https://www.postgresql.org/docs/18/sql-createfunction.html).

The protected 005 file remains SHA-256 1a6b1f45f9fe5d6b29dee3a7bb58146dcc58154530ac9145b7da37c11ac55e07. Its record function's dollar-quoted body, including its leading/trailing newlines, is 3799 UTF-8 bytes with SHA-256 b02f86166e57077af7dde9702455492c344e4f543ac21408b4b6f979fdf2b5e8. Verify installed pg_proc.prosrc against that reviewed baseline before the reproduction and replacement; also verify the signature and security/ACL properties independently. After installation, compare the installed body against the reviewed 006 artifact and retain its exact hash. An unknown definition, partially installed state or unexpected repeat application is HOLD. Never edit or reapply 005 to install this fix.

Run two separate regression scenarios with distinct fresh keys:

| Scenario | Required result after the fix, or on an already-correct baseline |
|---|---|
| Same tag | Winner commits the same key/tag after the application's first snapshot. The first application attempt receives native 40001; rollback and exactly one release precede a fresh checkout and SERIALIZABLE transaction. The unchanged full function call runs again with identical parameters, COMMIT completes, and the store returns the exact committed refusal. Require exactly two application attempts for this controlled schedule. |
| Changed tag | Winner commits the same key with a different tag after the first snapshot. The first application attempt receives native 40001. Its cleanup precedes the second checkout; the second function call detects the stored hash mismatch and the store returns the exact existing 409 envelope. Require exactly two application attempts, no committed losing write and preservation of the winner row. |

For each scenario, independently compare id, book_id, actor_id, operation, key, request_hash, state, resource_id, response and created_at immediately after the winner commits and after application recovery. Count using the full book/actor/operation/key identity and require exactly one row. Independently compute the winner's rr1 digest. A later ordinary same-tag replay and changed-tag call must preserve that complete original row. Retain restricted session identities, actual isolation, snapshot/winner-commit checkpoints, raw error provenance and attempt cleanup order without credentials.

All adapter waits, SQL operations and case deadlines must be bounded. Timeouts, unexpected SQLSTATEs, unreached checkpoints, unexpected retries and incomplete cleanup fail the selected run. Use checkpoints rather than timing sleeps to create the race. Close each newly owned pool/client in finally, settle coordination promises on failure, roll back open transactions and await asynchronous shutdown. Do not signal any process/backend/server, restart PostgreSQL, change server/session durability settings or delete immutable fixture history. Apart from the existing helper's fixture provisioning, the only data mutation is reserved refusal insertion through the existing SQL function. Keep fixture credentials in memory and out of output, argv and artifacts.

Database execution remains limited to the already provisioned dedicated PostgreSQL 18.6 target at 127.0.0.1:54339/kita_core_test, owner kita_test, supplied explicitly through KITA_REFUSAL_TEST_OWNER_URL without fallback credentials. Before fixture mutation, verify server_version_num 180006, the actual database/session/current user, kita schema ownership, actual existing fixture-provisioning authority from role attributes/memberships, and the reviewed refusal function, roles, constraints, triggers and ACLs. Do not infer CREATEROLE from a role having access to itself. On runtime connections verify the authenticated fixture identity, restricted attributes/membership, bound disabled scope and absence of extra authority. Require fsync=on, full_page_writes=on and synchronous_commit=on for every writer without changing them. A missing, mismatched or unavailable target leaves execution HOLD.

Keep the recognized installed baseline for the first regression run. If the exact SQL-fix trigger is established, review the complete 006 and its hash before applying that one file once to the pinned target with no test transactions active. No application connection may install it. Do not run the generic migration runner: its nonempty-target behavior and money-table assertions are outside this batch. This narrow test-target application establishes no general migration-runner, fresh-install or deployment acceptance.

Future validation, from the repository root:

~~~sh
npm --prefix apps/kita run typecheck --workspace @kita/database
KITA_PG_TEST=0 KITA_REFUSAL_PG_TEST=0 npm --prefix apps/kita run test --workspace @kita/database -- __tests__/non-money-refusal-store.spec.ts
KITA_PG_TEST=0 KITA_REFUSAL_PG_TEST=1 npm --prefix apps/kita run test --workspace @kita/database -- --fileParallelism=false __tests__/non-money-refusal-postgres.spec.ts -t stale-snapshot
~~~

Name both new cases with stale-snapshot so the last command selects their real schedule. Against the recognized 005 baseline, the intended regression assertions may fail; retain the exact raw errors, envelopes, row observations and exit status establishing the trigger. An initial green run selects the tests-only outcome and authorizes no migration. A failure outside the specified trigger is a blocker, not permission to proceed.

After an authorized 006 installation, or after confirming the tests-only outcome, run:

~~~sh
KITA_PG_TEST=0 KITA_REFUSAL_PG_TEST=1 npm --prefix apps/kita run test --workspace @kita/database -- --fileParallelism=false __tests__/non-money-refusal-postgres.spec.ts
KITA_PG_TEST=0 KITA_REFUSAL_PG_TEST=0 npm --prefix apps/kita run test --workspace @kita/database
(cd apps/kita/sql && sha256sum -c CHECKSUMS.txt)
node --test apps/kita/database/tests/checksums.test.mjs
git diff --check
~~~

The final selected PostgreSQL run must execute all 11 original cases plus both new cases without failures or skips. Preserve the 9 original refusal unit cases and existing broader checks. Missing configuration or unavailable required coordination must fail when the suite is selected. An ordinary unselected PostgreSQL suite may visibly skip and supplies no database evidence. Record commands, exit statuses, exact counts and every failure/skip; compare against baseline rather than weakening expectations or clearing unrelated diagnostics through edits.

Review requires the approved documentation commit, exact implementation base/head and tested head, the complete allowlisted diff, protected-file comparisons against de87a6d, and the credential-free runtime observations above. For the SQL outcome, include the observed baseline defect, reviewed/applied 006 hash, installed-body comparison and unchanged security/ACL properties. For the tests-only outcome, explicitly state that no application or SQL change was needed. Tests that assert supplied flags or manufacture PostgreSQL errors cannot pass this review.

Subsequent execution follows the operator roles: Astra/xhigh planning within this freeze; Sol/max direction and independent review; GPU gpu-fqaf Qoder Efficient Agent Teams/subagents implementation; coordinator synchronization and GitHub handling through the established workflow. Failed review returns to Qoder as a scoped fix batch. This documentation turn dispatches none of that work. Any separately authorized merge still requires the applicable review, test and exact-head merge gates against the final head.

Passing this batch may establish only the demonstrated invisible-conflict behavior and native statement-time 40001 recovery, including changed-tag preservation. Real 40P01 recovery, native retry exhaustion, commit-time serialization recovery, server crash/restart durability and failover remain unclaimed. The original requirement for 100 independently connected contenders behind a barrier remains open: the baseline's 100 requests through a pool capped at 40 do not close it. Remaining grant/immutability/spoofing/migration evidence also remains open.

Preserve [T-CORE-02-BATCH.md](T-CORE-02-BATCH.md), [the identity review](../SOL-IDENTITY-REVIEW.md), [the public OpenAPI freeze](OPENAPI-FREEZE.md) and all prior bounded holds. Full T-CORE-01/T-CORE-02 acceptance, session bind, identity, money, ledger, posting, rewards, integration, certification, pilot and launch remain unclosed, as do CP-00-11, PACK/REQ-SC/TEST and DEP-00-15 obligations. No G1-G6 PASS or production approval is granted.

Checks in this documentation turn cover the current head, source-based scope, local links, whitespace, protected-file hashes and a working-tree change confined to NEXT-BATCH.md. No build, typecheck, unit test, PostgreSQL reproduction, migration application or new acceptance result is claimed. Money closed. Never ok:true.
