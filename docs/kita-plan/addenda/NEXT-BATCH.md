BATCH-OK

Next batch: refusal-record client-crash and lost-COMMIT recovery tests, confined to two existing test files. This advances the recovery evidence for the implemented non-money persistence slice. It adds no supplied-evidence checker, readiness Boolean, persistence operation or application behavior.

Money closed. Never ok:true. No executeCommand or money_operations access. Session bind, bindSession activation, session minting, identity/KYC success, financial execution, provider calls, runtime activation, live traffic, deployment, pilot, launch and G1-G6 closure remain HOLD.

Baseline: 849120558ec3282c5dc25764f6b6a82abbb80290 (8491205), branch cursor/kita-core02-refusal-pg-evidence-05a3, [PR #128](https://github.com/Joshluxr/Temp/pull/128). The refusal-record slice and pg_roles.oid repair are implemented. PR #128 reports PostgreSQL 18.6 evidence: 11 passing tests, comprising three unit cases and eight PostgreSQL cases covering record/replay, changed-tag 409, actor/book isolation, unbound 403, denied command_keys SELECT, 100 contenders converging on one reserved row, independent rr1 hashing and denied SET ROLE to the definer. Those are reported baseline results; this documentation turn does not rerun or extend them. Crash/lost-COMMIT evidence is still open. The previous catalog-repair batch is superseded in full and must not be repeated.

BATCH-OK freezes only the subsequent test scope below. It is not a test PASS, full refusal-slice acceptance, production-readiness decision or merge permission. This turn rewrites only docs/kita-plan/addenda/NEXT-BATCH.md. It changes no application code, SQL, test, helper or configuration and performs no database mutation.

The complete subsequent implementation allowlist is:

| Existing file | Permitted change |
|---|---|
| apps/kita/packages/database/__tests__/non-money-refusal-store.spec.ts | Add deterministic tests of COMMIT ordering, unconfirmed persistence results, bounded attempts and cleanup at the refusal-store boundary. Keep fault adapters local to this file. |
| apps/kita/packages/database/__tests__/non-money-refusal-postgres.spec.ts | Add exact-target preflight, real PostgreSQL client-process loss and lost-COMMIT recovery cases, scoped row observers, inline child-process support and cleanup for resources owned by the new cases. |

No other file or new file is allowed. In particular, preserve __tests__/helpers/non-money-refusal-pg.ts, helpers/fake-pg.ts, src/non-money-refusal-store.ts, src/transaction.ts, src/pool.ts, all migrations, all 001 copies, apps/kita/sql/CHECKSUMS.txt, migration ledgers, manifests, lockfiles, dependencies, test configuration, public contracts, exports, routes, workers, evidence checkers and historical reviews byte for byte. Preserve all pre-existing tracked and untracked work. No generated helper, child script, snapshot or evidence file may be written into the repository. Small child programs may be embedded in the allowlisted PostgreSQL spec and executed in memory using the existing Node and pg dependencies.

Retain all existing refusal tests and their assertions. Do not weaken failures, change expected results, reduce contention, turn required cases into skips, change the existing fixture helper's authority or use unrelated application operations as probes. If a required fix needs another path, stop that dependent work with BATCH-HOLD and return a concrete defect and proposed scope; this batch does not authorize that fix.

Every runtime call remains recordNonMoneyRefusal(pool, input) or its existing SQL entry point kita.record_non_money_refusal(text,text), under independently authenticated restricted recorder logins bound to disabled test books. Use only recordNonMoneyRefusal.v1. No owner connection followed by SET ROLE counts as runtime evidence. The migration owner may provision the existing bounded fixtures and observe only their bindings, book status and scoped reserved rows; it must not invoke the runtime entry point as a substitute for a restricted login. Read-only PostgreSQL catalog/session inspection is permitted. No financial or identity data query is authorized.

The stored and returned committed refusal remains exactly:

~~~json
{"ok":false,"error":{"code":"CAPABILITY_UNAVAILABLE","status":503,"retryable":false,"detail":"Command execution is unavailable."}}
~~~

When persistence is unconfirmed, the unchanged application must return exactly:

~~~json
{"ok":false,"error":{"code":"dependency_unavailable","status":503,"retryable":true,"detail":"Refusal persistence is unconfirmed; retry the same key."}}
~~~

The committed row must retain state rejected, resource_id NULL and the independent rr1 SHA-256 over the UTF-8 bytes {"requestTag":"<tag>","schemaVersion":1}. No response may report business acceptance. Preserve the changed-tag IDEMPOTENCY_MISMATCH 409 result and all other frozen errors. No response or retry may invent a different key, actor, book or operation.

The new PostgreSQL cases must establish these observations:

| Case | Required fault and observation |
|---|---|
| Client process dies before COMMIT | A test-owned child authenticates as a restricted fixture login, begins a real SERIALIZABLE transaction and calls the real SQL entry point with a fresh valid key/tag. It reports a checkpoint only after the function returns the exact frozen refusal, then waits without sending COMMIT. The parent kills that exact child with SIGKILL, awaits its exit and verifies its database backend has gone away. An independent observer then sees zero rows for that scope/key. A fresh restricted connection retries the same key/tag, commits one rejected row and replays that row without duplication. |
| Client process dies after acknowledged COMMIT | A separate child uses a fresh key/tag and reports its checkpoint only after the real COMMIT resolves. Capture the committed row through an independent observer, kill only that child, then start a new restricted client process. Same-scope/key/tag replay must recover the original refusal and preserve the complete row. This demonstrates recovery across client process loss and restart. |
| COMMIT completes but its result does not reach the application | Call the unchanged recordNonMoneyRefusal through a test-local PoolLike adapter backed by a real restricted PostgreSQL connection. Forward BEGIN and the function call. For COMMIT, first await the real driver's successful COMMIT; withhold that completion from the application, close only this dedicated connection and raise an explicitly identified injected transport failure. The application must return the exact unconfirmed envelope, perform no hidden resubmission and discard the unusable checkout. An independent observer must see exactly one committed rejected row. Retry through a fresh unwrapped restricted connection with the same key/tag; recover the stored refusal and preserve the complete original row. A later changed-tag call returns 409 and also preserves it. |

For every committed case, compare independent observations of id, book_id, actor_id, operation, key, request_hash, state, resource_id, response and created_at before and after replay. Count rows using the full book/actor/operation/key identity. A fixed returned refusal alone does not prove persistence or preservation. Compute the expected rr1 digest independently in the test. Use distinct keys per new scenario so test order cannot supply the expected result.

Use explicit IPC/deferred checkpoints rather than timing sleeps to place faults. Bound all waits and fail on timeout, premature exit, unexpected SQLSTATE or an unreached checkpoint. A bounded observer poll may establish backend disappearance; elapsed time alone is not evidence. Track the exact spawned PID and database backend PID. Never signal the test runner, any process not created and tracked by that case, a PostgreSQL backend or the server. Children must receive only their restricted fixture credentials through IPC, with inherited owner/PG credential variables removed; do not put credentials in source, argv, output or committed artifacts. Reap each child and close every new client/pool in finally cleanup, including assertion-failure paths.

The lost-COMMIT adapter must still execute the real SQL and COMMIT against PostgreSQL. It may observe query order, delay delivery of the real result and break its own connection; it may not fabricate a database response or committed row. Label the injected transport failure separately from actual driver errors and raw PostgreSQL SQLSTATEs. This establishes lost acknowledgment at the application boundary. It does not establish packet loss, PostgreSQL server crash/restart, power-loss recovery, storage durability under a server crash or failover. Those remain unclaimed.

In the unit spec, exercise the unchanged store through local PoolLike adapters. Hold COMMIT pending after the function returns its stored body and assert that the application promise has not settled. Resolve COMMIT and require the exact committed refusal. Separately fail before COMMIT is sent and after a simulated COMMIT completion; both must produce the exact unconfirmed envelope, never the stored refusal. Assert one checkout/attempt for transport uncertainty, one release, rollback cleanup and release-with-error when rollback cannot confirm connection usability. Cleanup errors must not replace the primary failure. These tests establish application ordering and cleanup only; their simulated failures supply no PostgreSQL crash or durability evidence. Preserve the existing automatic retry policy of at most three attempts for structured 40001/40P01 only.

Database execution is limited to the already provisioned dedicated PostgreSQL 18.6 target at 127.0.0.1:54339/kita_core_test, migration owner kita_test, supplied explicitly through KITA_REFUSAL_TEST_OWNER_URL without default credentials. The existing helper pins the URL and checks PostgreSQL 18 generally. Add the stricter read-only preflight inside the allowlisted PostgreSQL spec, before provisionRefusalFixtures performs any mutation: require server_version_num 180006, actual database kita_core_test, session_user/current_user kita_test, expected schema ownership, required existing fixture-provisioning authority and the reviewed installed refusal objects/ACLs. Verify restricted runtime identities on their own connections. Record and require fsync=on, full_page_writes=on and each writer's synchronous_commit=on without changing server/session durability settings.

Use the installed 001 + 004 + 005 state recognized by the existing evidence. 005 is create-only and already installed; do not reapply it. This batch authorizes no migration, CREATE OR REPLACE FUNCTION, schema reset, database drop, service provisioning, ACL/role escalation, new extension, server setting change or migration-ledger manipulation. Apart from the existing helper's disabled books, immutable bindings and ephemeral restricted login fixtures, the only data mutation is the existing reserved refusal INSERT. Keep generated fixture credentials in memory. Do not delete immutable history or disable its guards for cleanup. An absent, mismatched, unrecognized or unavailable target leaves database execution HOLD; it cannot be repaired by silently switching targets or broadening this allowlist.

Run the following future validation from the repository root after the dedicated target and owner URL have been verified:

~~~sh
npm --prefix apps/kita run typecheck --workspace @kita/database
KITA_PG_TEST=0 KITA_REFUSAL_PG_TEST=0 npm --prefix apps/kita run test --workspace @kita/database -- __tests__/non-money-refusal-store.spec.ts
KITA_PG_TEST=0 KITA_REFUSAL_PG_TEST=1 npm --prefix apps/kita run test --workspace @kita/database -- --fileParallelism=false __tests__/non-money-refusal-postgres.spec.ts
KITA_PG_TEST=0 KITA_REFUSAL_PG_TEST=0 npm --prefix apps/kita run test --workspace @kita/database
(cd apps/kita/sql && sha256sum -c CHECKSUMS.txt)
node --test apps/kita/database/tests/checksums.test.mjs
git diff --check
~~~

The selected PostgreSQL run must execute all existing and new cases. Missing configuration, unavailable IPC/fault support, failure to reach a checkpoint or an unavailable required case must fail, never skip or substitute a mock. Ordinary runs with the PostgreSQL suite unselected may visibly skip it and supply no database evidence. Record exact commands, exit statuses, case counts, failures and skips. Compare diagnostics against the unchanged baseline; do not waive new failures or edit unrelated files to clear existing ones.

Review must identify the approved documentation commit, exact implementation base/head and tested head; show a complete diff confined to the two-file allowlist; verify protected files against 8491205; and retain credential-free runtime identities, checkpoint/exit observations, real COMMIT completion, injected-failure provenance, scoped row comparisons and cleanup outcomes. The approved 005 bytes remain SHA-256 1a6b1f45f9fe5d6b29dee3a7bb58146dcc58154530ac9145b7da37c11ac55e07. Tests that only assert a supplied Boolean or manufacture a stored response cannot pass this review. Failed assertions are defects to report, not permission to alter application behavior in this batch.

Subsequent work follows the operator roles: Astra/xhigh planning within this freeze, Sol/max direction and independent review, GPU gpu-fqaf Qoder Efficient coding, coordinator GitHub handling. This documentation turn dispatches no batch script, coding swarm, database work or GitHub mutation. Any later authorized merge requires the applicable review, test and exact-head merge gates against the final head; this document grants no merge permission.

Preserve [T-CORE-02-BATCH.md](T-CORE-02-BATCH.md), [the identity review](../SOL-IDENTITY-REVIEW.md), [the public OpenAPI freeze](OPENAPI-FREEZE.md) and all prior bounded holds. Passing this batch may close only the demonstrated client-loss, application COMMIT-ordering and same-key recovery cases. It does not close the full refusal slice, the original requirement for 100 independently connected contenders behind a barrier, real 40001/40P01 recovery/exhaustion, remaining grant/immutability/spoofing/migration evidence or server-crash durability. Full T-CORE-01/T-CORE-02 acceptance, session bind, identity, money, ledger, posting, rewards, integration, certification, pilot and launch remain unclosed, as do CP-00-11, PACK/REQ-SC/TEST and DEP-00-15 obligations. No G1-G6 PASS or production approval is granted.

Checks in this documentation turn cover the current-head reference, exact two-file future allowlist, local links, whitespace, protected-file hashes and a working-tree diff confined to NEXT-BATCH.md. No build, typecheck, unit test, PostgreSQL fault test or new acceptance result is claimed. Money closed. Never ok:true.
