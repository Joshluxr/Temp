BATCH-OK

Authorize the next bounded non-money persistence batch: demonstrate atomic rollback and native PostgreSQL deadlock recovery while writing real reserved refusal rows through the existing transaction helper and installed recorder. The deliverable is one opt-in PostgreSQL suite with two cases. Acceptance depends on actual driver errors, acknowledged transaction boundaries and independently observed committed rows. Supplied evidence flags, boolean checkers, mocked outcomes and a returned refusal alone cannot satisfy it.

Money closed. Never ok:true. No executeCommand or money_operations access. Session bind, bindSession activation, session/token creation or rotation, identity/KYC success, financial execution, ledger/posting, rewards, provider calls, runtime activation, live traffic, deployment, integration acceptance, certification, pilot, launch and G1-G6 closure remain HOLD. This grants no general T-CORE-02 or T-IDENTITY-01 command authority.

Source base: 8a66d8f6585ba7b03720d78d1071fa35fdfb990c (8a66d8f), [PR #128](https://github.com/Joshluxr/Temp/pull/128). Compare all implementation and protected files against that exact head, allowing only this subsequent NEXT-BATCH.md handoff. This documentation turn edits only docs/kita-plan/addenda/NEXT-BATCH.md; it authorizes no immediate swarm dispatch, database operation, GitHub mutation, merge or deployment.

The native pg timeout mapping is installed at this head. Accept as operator-reported regression results: 25 PostgreSQL cases passing, comprising 13 persistence, 8 privilege/history and 4 timeout cases, plus 9 refusal unit cases and 2 native-constructor cases offline. These are attributed reports, not fresh runs or independently reviewed raw execution evidence from this turn. Preserve that implementation and those suites. Do not redo the mapping, stale-snapshot repair, migration installation or privilege/history batch.

The remaining concrete transaction gap selected here is real multi-statement refusal atomicity and native 40P01 recovery. Existing transaction unit tests use synthetic deadlock errors; the reported PostgreSQL suites do not establish this behavior. Exercise unchanged withSerializable with real refusal writes and a bounded database deadlock. This is a test of the existing persistence primitive, with no new command API or combined production refusal operation.

The complete subsequent implementation allowlist is:

| File | Permitted change |
|---|---|
| apps/kita/packages/database/__tests__/non-money-refusal-atomicity-postgres.spec.ts | New opt-in suite implementing exactly the two cases below, with suite-local read-only preflight, observation, transaction tracing and bounded coordination. |

No other implementation file is authorized. Freeze pool.ts, transaction.ts, non-money-refusal-store.ts, every existing test and helper, exports, contracts, runtime configuration, routes, workers, manifests, lockfiles and dependencies. Do not add a checker, fixture/helper file, migration, snapshot, generated report or repository evidence artifact. Keep credential-free evidence in the operator's review output. Preserve unrelated tracked and untracked work.

All migrations, every 001 copy, apps/kita/sql/CHECKSUMS.txt, migration ledgers, protected plans and historical reviews remain frozen. Preserve these source hashes:

| File | SHA-256 |
|---|---|
| apps/kita/packages/database/migrations/005_non_money_refusal.sql | 1a6b1f45f9fe5d6b29dee3a7bb58146dcc58154530ac9145b7da37c11ac55e07 |
| apps/kita/packages/database/migrations/006_non_money_refusal_conflict.sql | faffadc5a42d024a425e6c39ac0855c2fa02fa5365aa55fef64a0befecdc10c7 |

Recognize the installed 001 + 004 + 005 + 006 state. Preserve kita.record_non_money_refusal(text,text), returning jsonb, its OID, owner kita_refusal_definer, LANGUAGE plpgsql, SECURITY DEFINER, fixed search_path = pg_catalog, pg_temp and existing ACLs. Require actual catalog prosrc to be 3950 UTF-8 bytes with SHA-256 a6140caff93ff7a014ee33ae6c32bb669f8bd75322580fdaafc9c3179f76898a, including leading/trailing newlines. Hash catalog bytes, not a reconstructed definition. Preserve scoped uniqueness, the reserved-row constraint, both immutability trigger functions and their enabled ordinary-session triggers.

Database execution is confined to the already provisioned PostgreSQL 18.6 target at 127.0.0.1:54339/kita_core_test using an explicitly supplied KITA_REFUSAL_TEST_OWNER_URL, without fallback credentials. Select the suite with KITA_REFUSAL_PG_TEST=1 and keep KITA_PG_TEST=0. Unselected collection/import opens no connection and provisions nothing. Missing configuration, unavailable target or failed selected preflight must fail, never silently skip or substitute mocks.

Before fixture mutation, run read-only preflight through directly authenticated kita_test. Require server_version_num = 180006, the exact database, session_user = current_user = kita_test, NOSUPERUSER CREATEROLE, kita schema ownership and actual authority for the existing restricted fixture provisioning. Inspect relevant role attributes and complete membership rows, including grantor and ADMIN/INHERIT/SET options; self-membership is not authority proof. Require zero temporary kita_test-granted memberships in kita_refusal_definer; distinguish any existing ADMIN-only bootstrap membership by its grantor/options. Verify the installed function/protections above, session_replication_role = origin, fsync=on, full_page_writes=on and synchronous_commit=on. Add these checks locally without editing the existing helper. No installation, repair, reset or grant escalation is authorized.

Reuse provisionRefusalFixtures unchanged: at most four new restricted logins and two disabled books per suite setup, with existing immutable bindings and recorder grants. Create no customer, identity, session, token or financial fixture. Enable no book. After setup, all persistent writes in this new suite must use the installed refusal function under a directly authenticated restricted login and operation recordNonMoneyRefusal.v1. No direct command_keys DML, binding mutation, history cleanup, role rename/drop, rebinding, new schema/table/function or elevated application login is permitted.

Application paths must use default createPool with the real installed pg driver, without an injected driver. Use unchanged withSerializable for the two multi-statement test callbacks and unchanged recordNonMoneyRefusal for setup refusals and subsequent ordinary replay/recovery calls. Do not nest recordNonMoneyRefusal inside a withSerializable callback: each callback calls the installed SQL function directly on its supplied client.

For every application checkout, establish on that same connection session_user = current_user = the expected restricted login, its login OID, backend PID/backend_start, restricted role attributes, effective recorder membership, synchronous_commit=on and session_replication_role=origin. Confirm SERIALIZABLE after BEGIN. Independently verify the OID/name's immutable binding and disabled book through the owner observer. Owner-plus-SET ROLE cannot supply application evidence. Preserve the lack of direct table privileges, schema CREATE, ADMIN authority and effective paths to privileged roles.

A forwarding PoolLike/client wrapper may observe identity/settings, trace actual query completions and releases, and pause at the explicit coordination gates below. It must forward application SQL, parameters, results and original error objects unchanged. It must not implement transactions, retries, error mapping, synthetic SQLSTATEs or fabricated query success. Keep observation checkouts distinct from application attempts. Owner observers may use real pg.Client with finite native timeout options and read-only queries scoped to these fixtures.

Preserve the existing default of three total SERIALIZABLE attempts, the structured 40001/40P01 retry whitelist, 50 ms backoff and commit/rollback/release behavior. Do not override the retry budget, delay or sleep function in the new suite. Each attempt uses one checkout for BEGIN, all callback SQL and COMMIT/ROLLBACK. Require exactly-once release, completed ROLLBACK and release before another attempt, and acknowledged COMMIT and release before the helper resolves. An intermediate function result inside an open transaction is never persistence evidence.

Implement exactly these two named PostgreSQL cases:

| Case | Required outcome |
|---|---|
| Atomic refusal rollback on native KRF02 | A later actual mismatch aborts an earlier tentative refusal in the same SERIALIZABLE transaction; existing history stays unchanged and an independent later ordinary call can persist the rolled-back key. |
| Native 40P01 rolls back refusal and replays the full callback | Two restricted transactions write distinct refusals and form a bounded transaction-level advisory-lock deadlock. PostgreSQL selects a victim; the unchanged helper rolls back and retries its entire callback, yielding exactly two committed refusal rows. |

For Atomic refusal rollback on native KRF02:

1. Choose two fresh valid keys A/B and fixed valid tags. Through an ordinary recordNonMoneyRefusal call, commit B with its original tag. Independently capture B's complete row and confirm zero A rows.
2. Start one unchanged withSerializable invocation. Its callback calls the SQL recorder for A, then for B with a different tag. Both calls use the supplied client. After A's function query completes and before the B query, use a fresh owner observation to confirm A is still absent from committed state and B is unchanged.
3. Capture the actual driver KRF02 from the B function query and propagate that same error through the helper. Require exactly one application attempt, awaited ROLLBACK, release, no COMMIT and no retry. Check error provenance and object identity; do not manufacture a mismatch in the callback.
4. After the helper rejects, independent fresh observation must find zero A rows and B's exact original row. Then make a separately identified ordinary recordNonMoneyRefusal call for A with its original tag. Require one committed A row, unchanged same-tag replay, exact changed-tag 409 and preservation of B. This separate call is recovery evidence, not a hidden retry of the failed transaction.

For Native 40P01 rolls back refusal and replays the full callback:

1. Use two independent default-adapter pools, each with poolMax=1, authenticated as the same bound restricted fixture login. Establish distinct first-attempt backend identities. Choose fresh refusal keys A/B and a fixed tag for each key. Reserve exactly two random, case-specific two-integer transaction-level advisory-lock keys in this database; record their non-secret identifiers. Avoid any existing holder before starting. No session-level lock, global fixed lock key, explicit table lock or persistent coordination row is allowed.
2. Run two unchanged withSerializable invocations. Participant A's callback always acquires lock A, calls the recorder for refusal A, then acquires lock B. Participant B always acquires lock B, records refusal B, then acquires lock A. Each invocation retains identical SQL, parameters, key/tag and lock order across all its attempts. Results contain only the exact refusal bodies.
3. On first attempts only, pause after both first locks and first refusal queries complete. Confirm both keys are still absent through independent committed-state observation. Release an in-process barrier so both request their opposing lock. Do not use a guessed sleep as the barrier.
4. Require one original, structured 40P01 from a real advisory-lock query before any application mapping. Do not assume which participant is selected. A 40001, 57014, lock timeout, watchdog expiry, message match or artificial thrown error cannot replace this evidence. State explicitly that the deadlock originates in the test's advisory-lock cycle; this does not claim a deadlock reproduced inside the recorder's unique-index path.
5. Let the unchanged helper finish the victim's ROLLBACK and release. Hold the survivor after its opposing-lock query completes, before callback return. Keep the victim's next underlying checkout behind a bounded coordination gate. At this checkpoint, fresh owner observation must find zero victim-key rows and no transaction advisory locks retained by its first-attempt backend. Both tentative refusal rows must remain absent while the survivor is uncommitted.
6. Allow the survivor to return, COMMIT and release. Independently capture exactly one survivor row and zero victim rows. Only then release the victim's pending retry checkout. This gate orders real work; it does not initiate a retry or perform the helper's backoff.
7. Require the victim's second attempt to rerun the entire callback, including its first lock and refusal query, then COMMIT and release. Require one attempt for the survivor, two for the victim, exactly one native 40P01 and no fourth checkout or outer retry. Independently observe exactly one row for each full scope/key. Ordinary same-tag replay and changed-tag 409 for each key must preserve both complete rows.

The advisory locks exist only to induce a real database transaction failure around real refusal writes. They must release on COMMIT/ROLLBACK, remain confined to the two suite-owned participants and require no new privilege. Preflight their existing execution permission and effective deadlock_timeout/lock_timeout. Choose finite native statement timeouts comfortably longer than deadlock detection and finite acquisition/idle timeouts. Record configured connection/acquisition/idle values and observe statement_timeout and lock settings on application connections. If effective URL/environment settings or lock timeout would preempt the intended deadlock, return HOLD. Do not alter URLs, issue compensating SET commands, change deadlock_timeout, disable a timeout or adjust persistent/global settings.

The stored and ordinary returned refusal remains exactly:

~~~json
{"ok":false,"error":{"code":"CAPABILITY_UNAVAILABLE","status":503,"retryable":false,"detail":"Command execution is unavailable."}}
~~~

The ordinary changed-tag result remains exactly:

~~~json
{"ok":false,"error":{"code":"IDEMPOTENCY_MISMATCH","status":409,"retryable":false,"detail":"Idempotency key is bound to a different request."}}
~~~

Preserve every existing invalid-input, unauthorized, integrity and unconfirmed envelope, including:

~~~json
{"ok":false,"error":{"code":"dependency_unavailable","status":503,"retryable":true,"detail":"Refusal persistence is unconfirmed; retry the same key."}}
~~~

The generic helper's native KRF02 rejection is inspected directly in the first case; it is not a new public response contract. A committed rejected refusal remains a refusal, and neither helper result nor database history may contain a successful command/session response.

Use fresh random keys matching the existing 16–128 character grammar and tags matching the existing 1–64 character grammar, with no prior-history or case-order dependency. Every reserved-row observation must constrain book_id, actor_id, operation and key, and include id once known. Assert exact row counts; compare id, book_id, actor_id, operation, key, request_hash, state, resource_id, response and created_at, preserving timestamp precision with created_at::text. Require state rejected, resource_id NULL and the exact stored refusal. Independently compute rr1 SHA-256 over UTF-8 canonical bytes {"requestTag":"<tag>","schemaVersion":1}; do not use an application-returned hash as the oracle. Do not inspect financial or identity data.

Bound connection establishment, native statements, each case, hooks, barriers, polling and shutdown. Register cleanup immediately when a connection/pool is created or acquired. On every failure, reject/release all coordination gates, await pending invocations and their transaction cleanup, release acquired clients exactly once and await every suite-owned pool/client closure. Preserve the primary failure and report cleanup failures. Watchdog expiration fails the case and never counts as deadlock, rollback or persistence evidence. No fire-and-forget close, unhandled promise, process-exit cleanup, backend termination, process signal, server restart, trigger disabling, replication-role change or fixture/history deletion is authorized.

Review the complete one-file implementation diff and all coordination/cleanup paths before database execution. After source review and successful preflight, validation from the repository root is:

~~~sh
npm --prefix apps/kita run typecheck --workspace @kita/database
KITA_PG_TEST=0 KITA_REFUSAL_PG_TEST=0 npm --prefix apps/kita run test --workspace @kita/database
KITA_PG_TEST=0 KITA_REFUSAL_PG_TEST=1 npm --prefix apps/kita run test --workspace @kita/database -- --fileParallelism=false __tests__/non-money-refusal-atomicity-postgres.spec.ts __tests__/non-money-refusal-timeouts-postgres.spec.ts __tests__/non-money-refusal-security-postgres.spec.ts __tests__/non-money-refusal-postgres.spec.ts
node --test apps/kita/database/tests/checksums.test.mjs
git diff --check
~~~

Also run sha256sum -c CHECKSUMS.txt with working directory apps/kita/sql and verify the protected 005/006 hashes above. Compare every tracked implementation path outside the one-file allowlist against 8a66d8f. The offline run must retain the 9 refusal unit and 2 native-constructor passes and all existing applicable checks. The selected PostgreSQL run must execute the 2 new cases plus the unchanged 25 baseline: 27 passing, zero failing, zero skipped. Unselected skips in the offline run, empty selection, failed hooks or filtered cases cannot count as PostgreSQL acceptance. Report exact commands, exit statuses, counts and any existing failures; do not repair failures outside the allowlist.

Return the approved documentation reference, exact source base, implementation head, tested head, complete diff and protected-file comparisons for independent Sol/max review. Include resolved driver/server versions, preflight observations, authenticated backend identities, fixture scope, lock identifiers, original native error provenance, per-invocation attempt/query-completion/release order and fresh row observations at every checkpoint. Report which participant was the actual victim. Reconfirm function OID/body/owner/ACLs, triggers, reserved constraints, role/security state, no retained suite advisory locks and zero temporary installer memberships after execution. Account separately for permitted fixture principals, bindings, disabled books and recorder grants. Redact credentials, URLs, password-bearing role statements and credential-bearing error/configuration objects.

Subsequent implementation follows the standing roles: coordinator syncs to GPU gpu-fqaf and routes Qoder CLI Efficient Agent Teams/subagents through ~/.coordinator/run-batch.sh; Qoder implements there; coordinator bundles/downloads; Codex gpt-6.1-sol at max independently reviews on the VM. Cursor Grok remains coordinator only; Astra/xhigh planning stays within the freeze. Failed review returns to Qoder as a scoped fix batch. This documentation turn starts none of those actions. Any separately authorized merge still requires applicable review, tests and merge gates against the exact final head.

If this slice requires a production/helper change, migration, new privilege, dependency change or weaker assertion, or preflight finds unexpected security/installation state or unavailable authority, stop dependent work and return BATCH-HOLD with an empty implementation allowlist. Do not switch features, synthesize errors, expand the callback's authority or reset history. Test-only coordination defects may be corrected within the single allowed file and re-reviewed before execution.

Passing this batch establishes only the enumerated real refusal atomicity and native advisory-lock deadlock recovery on the pinned target. Native retry exhaustion, commit-time serialization recovery, the recorder's own deadlock patterns, connection-handshake faults, server crash/restart durability, failover, fresh/upgrade migration acceptance, role rename/OID-reuse spoofing and enabled-book denial remain separately scoped. The existing 100 requests through a pool capped at 40 still do not establish 100 independently connected contenders behind a barrier.

Preserve [the T-CORE-02 hold](T-CORE-02-BATCH.md), [the identity review](../SOL-IDENTITY-REVIEW.md) and [the public OpenAPI freeze](OPENAPI-FREEZE.md). Session binding stays HOLD until a later explicit non-money authorization defines verified evidence, ownership, one-use replay/expiry semantics, credential handling and durable atomic effects. Full T-CORE-01/T-CORE-02 acceptance, CP-00-11, PACK/REQ-SC/TEST and DEP-00-15 obligations remain unclosed. No G1-G6 PASS or US-PH production approval is conferred.

Checks in this documentation turn cover local source, the protected migration/body source hashes, local references, whitespace and a tracked diff confined to NEXT-BATCH.md. No fresh application test, typecheck, database operation, migration application or PostgreSQL PASS is claimed. Money closed. Never ok:true.
