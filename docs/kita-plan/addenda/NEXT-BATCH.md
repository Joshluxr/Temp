BATCH-OK

Authorize a bounded Qoder fix batch for the real non-money refusal persistence cases at cffa301. Complete their transaction evidence and failure cleanup before extending the persistence surface. The deliverable remains the two PostgreSQL cases that write through the installed recorder, observe independently committed rows, and exercise native KRF02 rollback and advisory-lock 40P01 recovery. No boolean checker, supplied evidence flags, mocked database outcome or returned refusal alone can satisfy this batch.

Money closed. Never ok:true. No executeCommand or money_operations access. Session bind, bindSession activation, session/token creation or rotation, identity/KYC success, financial execution, ledger/posting, rewards and provider calls remain HOLD. Runtime activation, live traffic, deployment, integration acceptance, certification, pilot, launch and G1-G6 closure remain HOLD. This is no general T-CORE-02 or T-IDENTITY-01 authorization.

Source base: cffa3017520904b4ab058f7e27f27b38516e3194 (cffa301), associated by the operator with [PR #128](https://github.com/Joshluxr/Temp/pull/128). Compare subsequent implementation and protected paths against that exact commit, allowing only the documentation handoff in NEXT-BATCH.md. This documentation turn edits only docs/kita-plan/addenda/NEXT-BATCH.md. It starts no swarm, database operation, GitHub mutation, merge or deployment.

Accept as attributed operator reports: 27 PostgreSQL cases passing, comprising 13 persistence, 8 privilege/history, 4 timeout and the 2 new atomicity/deadlock cases; the prior offline baseline includes 9 refusal unit cases and 2 native-constructor cases. These are not fresh runs or independently inspected execution logs from this turn. Preserve the installed persistence implementation, native pg timeout mapping, stale-snapshot repair and existing regression cases. Passing counts do not establish the assertions and cleanup absent from the source.

Source review of the new suite identifies concrete work for this batch:

| Location in cffa301 | Finding and required correction |
|---|---|
| non-money-refusal-atomicity-postgres.spec.ts:119-160 | Coordination promises have no deadlines or failure drain. The KRF02 identity assertion compares krf with itself, rather than the helper's rejection. Capture the actual driver error and compare it with the independently captured helper rejection. |
| non-money-refusal-atomicity-postgres.spec.ts:208-242,273-288 | The wrapper counts checkouts but does not trace completed BEGIN/ROLLBACK/COMMIT or releases. The survivor is allowed to commit without first observing victim rollback, release and cleared transaction advisory locks. Establish that missing checkpoint and distinguish requested, gated and acquired checkouts. |
| non-money-refusal-atomicity-postgres.spec.ts:68-103,144-175,250-319 | Observation connection cleanup is registered after connect; failed setup leaves afterAll dereferencing an unset fixture; pending transaction invocations are not drained on every failure. Unblocking gates and closing pools is insufficient. Register resources immediately, handle rejection immediately, abort pending coordination and await transaction settlement before pool closure. |
| non-money-refusal-atomicity-postgres.spec.ts:184-197 and application checkouts throughout | Lock identifiers are not checked for existing holders; application identity, effective timeout settings and SERIALIZABLE isolation are not observed on each actual connection. Add scoped observations before using those connections as evidence. |
| non-money-refusal-atomicity-postgres.spec.ts:79-88,164-173,291-309 | Returning rows[0] does not assert exact cardinality or validate the entire initial row against an independent expected shape. Assert counts and complete rows at the specified checkpoints. |

This is a repair of the already selected real persistence slice. Customer consent, contacts, profiles, recipients and sessions require ownership/verified-evidence authority not supplied by these refusal-service bindings. Do not replace their unavailable stores, invent a second refusal API or open another checker lane to bypass those prerequisites.

The complete subsequent implementation allowlist is:

| File | Permitted change |
|---|---|
| apps/kita/packages/database/__tests__/non-money-refusal-atomicity-postgres.spec.ts | Repair the two existing named cases, with suite-local preflight, identity/transaction observations, bounded coordination, exact row assertions and complete failure cleanup. Retain both behavioral cases. |

No other implementation file is authorized. Freeze pool.ts, transaction.ts, non-money-refusal-store.ts, all other tests and helpers, exports, contracts, runtime configuration, routes, workers, manifests, lockfiles and dependencies. Add no helper file, migration, checker, snapshot, generated report or repository evidence artifact. Keep credential-free review evidence in operator output and preserve unrelated tracked and untracked work. The fix must not raise the PostgreSQL case count by replacing or splitting either case.

All migrations, every 001 copy, apps/kita/sql/CHECKSUMS.txt, migration ledgers, protected plans and historical reviews remain frozen. Preserve these source hashes:

| File | SHA-256 |
|---|---|
| apps/kita/packages/database/migrations/005_non_money_refusal.sql | 1a6b1f45f9fe5d6b29dee3a7bb58146dcc58154530ac9145b7da37c11ac55e07 |
| apps/kita/packages/database/migrations/006_non_money_refusal_conflict.sql | faffadc5a42d024a425e6c39ac0855c2fa02fa5365aa55fef64a0befecdc10c7 |

Recognize the installed 001 + 004 + 005 + 006 state. Preserve kita.record_non_money_refusal(text,text), returning jsonb, its OID, owner kita_refusal_definer, LANGUAGE plpgsql, SECURITY DEFINER, fixed search_path = pg_catalog, pg_temp and existing ACLs. Require actual catalog prosrc to be 3950 UTF-8 bytes with SHA-256 a6140caff93ff7a014ee33ae6c32bb669f8bd75322580fdaafc9c3179f76898a, including leading/trailing newlines. Hash catalog bytes rather than a reconstructed definition. Preserve scoped uniqueness, the reserved-row constraint, both immutability trigger functions and their enabled ordinary-session triggers.

Execution is confined to the already provisioned PostgreSQL 18.6 target at 127.0.0.1:54339/kita_core_test, with explicit KITA_REFUSAL_TEST_OWNER_URL and no fallback credentials. Select with KITA_REFUSAL_PG_TEST=1 while keeping KITA_PG_TEST=0. Unselected collection/import opens no connection and provisions nothing. Selected missing configuration, unavailable target, failed preflight, empty selection or failed hooks must fail acceptance; never silently skip or substitute mocks.

Before fixture mutation, supplement the unchanged shared preflight with suite-local read-only checks through directly authenticated kita_test. Require server_version_num = 180006, the exact database, session_user = current_user = kita_test, NOSUPERUSER CREATEROLE, kita schema ownership and actual authority for the existing fixture provisioning. Inspect relevant role attributes and complete membership rows, including grantor and ADMIN/INHERIT/SET options. Self-membership is not authority proof. Require zero kita_test-granted temporary memberships in kita_refusal_definer; distinguish any existing ADMIN-only bootstrap membership by grantor/options. Check the installed function/protections above, session_replication_role = origin, fsync=on, full_page_writes=on and synchronous_commit=on. No installation, repair, reset or grant escalation is authorized.

Reuse provisionRefusalFixtures unchanged: at most four new restricted logins and two disabled books for this suite setup, with its existing immutable bindings and recorder grants. Preserve any partially provisioned fixtures on failure and account for them; do not erase history or drop roles. Create no customer, identity, session, token or financial fixture and enable no book. After fixture setup, all persistent writes in this suite must use the installed recorder under a directly authenticated restricted login and operation recordNonMoneyRefusal.v1. No direct command_keys DML, binding mutation, role rename/drop, rebinding, new schema/table/function or elevated application login is permitted.

Use default createPool with the installed real pg driver, without injection. Keep unchanged withSerializable for multi-statement callbacks and unchanged recordNonMoneyRefusal for ordinary setup/replay/recovery calls. Do not nest recordNonMoneyRefusal inside withSerializable: each callback calls the installed SQL recorder on its supplied client. Preserve three total SERIALIZABLE attempts, structured 40001/40P01 retry whitelisting, the default 50 ms backoff and all production transaction behavior. Do not override retry options or sleep.

On every application checkout, observe on that same connection session_user = current_user = the expected restricted login, its login OID, backend PID/backend_start, restricted role attributes, effective recorder membership, synchronous_commit=on and session_replication_role=origin. Confirm SERIALIZABLE after the acknowledged BEGIN. Independently verify the OID/name's immutable binding and disabled book through the owner observer. Preserve the lack of direct table privileges, schema CREATE, ADMIN authority and effective paths to privileged roles. Owner-plus-SET ROLE is not application evidence.

A suite-local forwarding PoolLike/client wrapper may observe these facts, record actual query completions and releases, and pause at explicit bounded gates. Forward application SQL, parameters, results and original driver errors unchanged during evidence execution. Do not implement transactions, retries, SQLSTATE mapping or successful query results in the wrapper. Separate observation checkouts from application attempts. Count underlying acquisitions and exactly-once releases; attempted/gated connect calls alone are not acquisitions. Require acknowledged ROLLBACK and release before another attempt, and acknowledged COMMIT and release before a helper invocation resolves. Intermediate SQL function results are not committed persistence evidence.

Retain exactly these two named PostgreSQL cases, with the following acceptance requirements.

1. **Atomic refusal rollback on native KRF02.** Choose fresh valid keys A/B and fixed valid tags. Commit B through an ordinary recordNonMoneyRefusal invocation; independently validate and capture its complete row and zero A rows. In one withSerializable callback, call the SQL recorder for A and then B with a different tag. Pause after A's actual function query completes and before B's query. Fresh independent observation must still find zero committed A rows and unchanged B. Capture B's original driver KRF02 at the failing query and the helper's rejection separately; require object identity between those two errors, exactly one acquired application attempt, acknowledged ROLLBACK, exactly-once release, no COMMIT and no retry. After rejection, independently confirm zero A rows and unchanged B. Only then run a separately identified ordinary recovery call for A, requiring one committed A row, unchanged same-tag replay, exact changed-tag 409 and preserved B. Recovery is not a hidden retry of the rejected transaction.

2. **Native 40P01 rolls back refusal and replays the full callback.** Use two independent default-adapter pools with poolMax=1, authenticated as the same bound restricted fixture login. Observe distinct first-attempt backends. Choose fresh refusal keys A/B, fixed tags and exactly two distinct random case-specific two-integer transaction advisory-lock identifiers. Inspect for existing holders before starting; unexpected participants invalidate the case. Record the identifiers without secrets. No session advisory lock, global fixed identifier, table lock or persistent coordination row is authorized.

   Participant A's callback always acquires lock A, calls the recorder for refusal A, then acquires lock B. Participant B always acquires lock B, records refusal B, then acquires lock A. Keep each invocation's SQL, parameters, tags, keys and lock order identical across attempts. On first attempts only, pause after both first locks and first refusal queries complete. Independently observe zero committed rows for both keys, then release a barrier so both request their opposing lock. A guessed sleep is not a barrier.

   Require exactly one original structured 40P01 from an actual opposing advisory-lock query, attributed to the observed participant/backend/query. Do not assume the victim in advance. A 40001, 57014, lock timeout, message match, watchdog expiry or synthetic thrown error is not deadlock evidence. This deliberately induced advisory-lock cycle does not reproduce a deadlock in the recorder's unique-index path.

   Keep the victim's next underlying checkout gated. Wait for its first attempt's acknowledged ROLLBACK and exactly-once release. Hold the survivor after its opposing-lock query completes and before callback return. At this missing checkpoint, fresh owner observation must find both refusal keys absent and no transaction advisory locks retained by the victim's first-attempt backend. Identify the backend by PID and backend_start; distinguish it from a later reused connection. Only after these observations may the survivor return, COMMIT and release.

   Independently validate and capture exactly one committed survivor row and zero victim rows before opening the victim's retry checkout gate. The unchanged helper must initiate its own retry/backoff; the gate only orders underlying work. Require the victim's second attempt to rerun the entire callback, acquire its locks, call the recorder, COMMIT and release. Require one acquired attempt for the survivor, two for the victim, one native 40P01 and no extra attempt or outer retry. Independently validate exactly one complete row for each key. Ordinary same-tag replay and changed-tag 409 for both keys must preserve both rows.

For every observation, constrain book_id, actor_id, operation and key, adding id once known, and assert exact row counts. Compare id, book_id, actor_id, operation, key, request_hash, state, resource_id, response and created_at; preserve timestamp precision with created_at::text. Validate initial committed rows as well as replay equality: state rejected, resource_id NULL, exact scope/key and exact stored refusal. Independently compute rr1 SHA-256 over UTF-8 canonical bytes {"requestTag":"<tag>","schemaVersion":1}. An application-returned hash is not an oracle. Use new read-only owner observations without a retained transaction snapshot; inspect no financial or identity data. Keys must match the existing 16-128 character grammar and tags the 1-64 character grammar, with no prior-history or case-order dependency.

The stored and ordinary returned refusal stays exactly:

~~~json
{"ok":false,"error":{"code":"CAPABILITY_UNAVAILABLE","status":503,"retryable":false,"detail":"Command execution is unavailable."}}
~~~

The ordinary changed-tag result stays exactly:

~~~json
{"ok":false,"error":{"code":"IDEMPOTENCY_MISMATCH","status":409,"retryable":false,"detail":"Idempotency key is bound to a different request."}}
~~~

Preserve all invalid-input, unauthorized, integrity and unconfirmed envelopes, including:

~~~json
{"ok":false,"error":{"code":"dependency_unavailable","status":503,"retryable":true,"detail":"Refusal persistence is unconfirmed; retry the same key."}}
~~~

The generic helper's native KRF02 rejection remains internal test evidence, not a public response contract. A durably stored rejected refusal is still a refusal; neither history nor helper results may contain successful command/session responses.

Preflight existing advisory-lock execution permission and effective deadlock_timeout/lock_timeout. Supply finite native connection/acquisition, statement and idle timeouts to every suite-owned application pool and observer client as applicable. Observe statement_timeout and lock settings on application connections; require the statement timeout to allow bounded native deadlock detection and prevent another timeout from preempting it. Record configured values. If URL/environment settings or effective lock timeouts prevent the intended test, return HOLD. Do not alter URLs, issue compensating SET commands, change deadlock_timeout or persistent/global settings, or disable timeouts.

Bound hooks, cases, every gate/barrier/poll and shutdown as well as SQL and connection operations. Choose explicit budgets that permit preflight, native deadlock detection, rollback and cleanup; a framework test timeout does not cancel pending work. Register resource cleanup when clients/pools are constructed, including failed connection attempts. Attach rejection handlers as soon as transaction invocations start and retain their settlement results for assertions and cleanup. A failed setup must not cause afterAll to dereference an unset fixture or mask the original failure.

On every failure path, abort all pending coordination gates with a clearly identified harness failure, drain all started transaction invocations through their unchanged helper's rollback/release, release independently acquired clients exactly once, and attempt and await closure of every suite-owned pool/client even if another close fails. Do not merely release gates toward COMMIT and immediately close pools. Keep harness-abort/watchdog errors distinct from native errors and never count them as transaction evidence. Clearing timers and a Promise.race alone do not drain pending work. Preserve the primary failure and report secondary cleanup failures. No fire-and-forget close, unhandled rejection, process-exit cleanup, backend termination, process signal, server restart, trigger disabling, replication-role change or fixture/history deletion is authorized.

Review the complete one-file diff, identities, checkpoints and success/failure cleanup paths before database execution. After source review and successful preflight, run from the repository root:

~~~sh
npm --prefix apps/kita run typecheck --workspace @kita/database
KITA_PG_TEST=0 KITA_REFUSAL_PG_TEST=0 npm --prefix apps/kita run test --workspace @kita/database
KITA_PG_TEST=0 KITA_REFUSAL_PG_TEST=1 npm --prefix apps/kita run test --workspace @kita/database -- --fileParallelism=false __tests__/non-money-refusal-atomicity-postgres.spec.ts __tests__/non-money-refusal-timeouts-postgres.spec.ts __tests__/non-money-refusal-security-postgres.spec.ts __tests__/non-money-refusal-postgres.spec.ts
node --test apps/kita/database/tests/checksums.test.mjs
git diff --check
~~~

Also run sha256sum -c CHECKSUMS.txt with working directory apps/kita/sql, verify the 005/006 hashes above, and compare every tracked path outside the one-file implementation allowlist and this handoff against cffa301. Preserve the prior offline passes and every applicable existing check. The selected PostgreSQL run must retain all 27 cases passing, zero failing and zero skipped, including both repaired named cases. Report exact commands, exit statuses and counts. Offline unselected skips, filtering, missing configuration, failed hooks or a count without checkpoint evidence cannot satisfy PostgreSQL acceptance. Do not repair failures outside the allowlist.

Return the approved handoff reference, exact source base, implementation head, tested head, complete diff and protected-file comparisons for independent Sol/max review. Include resolved driver/server versions; catalog and role preflight; per-checkout authenticated identity/isolation/settings; fixture scope; lock identifiers and actual victim; original error provenance; per-invocation SQL completion/release order; and fresh row/lock observations at every checkpoint. Report that all started invocations settled and all suite-owned connections closed. Reconfirm function OID/body/owner/ACLs, constraints, triggers, security settings, no retained suite advisory locks and zero temporary installer memberships after execution. Account separately for permitted fixture books, principals, bindings and grants. Redact credentials, URLs, password-bearing statements and credential-bearing configuration/error objects.

Follow the standing roles for subsequent implementation: coordinator syncs to GPU gpu-fqaf and routes Qoder CLI Efficient Agent Teams/subagents through ~/.coordinator/run-batch.sh; Qoder implements there; coordinator bundles/downloads; Codex gpt-6.1-sol at max independently reviews on the VM. Cursor Grok remains coordinator only. Failed review returns to Qoder as a scoped fix batch. This documentation turn dispatches nothing. Any separately authorized merge still requires applicable review, tests and merge gates against the exact final head.

If this repair needs a production/helper change, migration, new privilege, dependency change, extra implementation path or weakened assertion, stop dependent work and return BATCH-HOLD with an empty implementation allowlist. Unexpected installation/security state, insufficient fixture authority or inability to bound and drain the harness also requires HOLD. Do not switch features, synthesize native errors, reset history or expand callback authority.

Passing the fix establishes only the enumerated refusal atomicity and advisory-lock recovery evidence on the pinned target. Native retry exhaustion, commit-time serialization recovery, the recorder's own deadlock patterns, connection-handshake faults, server crash/restart durability, failover, fresh/upgrade migration acceptance, role rename/OID-reuse spoofing and enabled-book denial remain separately scoped. The existing 100 requests through a pool capped at 40 do not prove 100 independently connected contenders behind a barrier. New non-money stores require their own bounded ownership and durable-effect contracts; this batch grants none.

Preserve [the T-CORE-02 hold](T-CORE-02-BATCH.md), [the identity review](../SOL-IDENTITY-REVIEW.md) and [the public OpenAPI freeze](OPENAPI-FREEZE.md). Session binding remains HOLD until explicit authorization defines verified evidence, ownership, one-use replay/expiry semantics, credential handling and durable atomic effects. Full T-CORE-01/T-CORE-02 acceptance, CP-00-11, PACK/REQ-SC/TEST and DEP-00-15 obligations remain unclosed. No G1-G6 PASS or US-PH production approval is conferred.

Verification in this documentation turn is confined to local source review, protected source hashes, local references, whitespace and the tracked diff limited to NEXT-BATCH.md. No fresh application test, typecheck, database operation, migration application or PostgreSQL PASS is claimed. Money closed. Never ok:true.
