BATCH-OK

Authorize a non-money persistence fix: make the existing default PostgreSQL pool adapter enforce its configured statement, connection/acquisition and idle timeouts. Require real PostgreSQL cancellation, rollback, connection lifecycle and committed-refusal evidence through the existing persistence path. A boolean checker, supplied evidence flag, mocked database outcome or final error envelope alone cannot satisfy this batch.

Money closed. Never ok:true. No executeCommand or money_operations access. Session bind, bindSession activation, session/token creation or rotation, identity/KYC success, financial execution, ledger/posting, rewards, provider calls, runtime activation, live traffic, deployment, integration acceptance, certification, pilot, launch and G1-G6 closure remain HOLD. This authorizes only the bounded persistence adapter slice below; it does not reopen general T-CORE-02 or T-IDENTITY-01 command authority.

Implementation source base: 43892f0ecb0eff3f584404819fabb0be77ccdf39 (43892f0), [PR #128](https://github.com/Joshluxr/Temp/pull/128). Compare implementation and protected files against that exact head, allowing only the subsequent NEXT-BATCH.md handoff. No GitHub mutation, merge, deployment or operator dispatch is authorized by this documentation turn.

Accept the operator-reported PostgreSQL 18.6 baseline: 21 cases passing, comprising the existing 13 persistence cases and 8 privilege/history cases, plus 9 refusal unit cases passing. The privilege/history batch is implemented. Do not repeat its implementation, reopen stale-snapshot discovery, reapply migrations, repeat temporary definer membership grants or replace the existing regression cases. These results remain attributed to the operator; this turn inspected local source and installed driver source, without connecting to PostgreSQL or rerunning application tests.

The next concrete defect is in apps/kita/packages/database/src/pool.ts. The default adapter passes PoolConfigInput directly to new pg.Pool. Its statementTimeoutMs, connectionTimeoutMs and idleTimeoutMs names are not the native options consumed by the installed pg 8.16.3 and pg-pool sources. Those sources consume statement_timeout, connectionTimeoutMillis and idleTimeoutMillis respectively. Existing injected-driver tests inspect the internal configuration and do not prove this translation or actual timeout enforcement. Correct this boundary before extending persistence toward session binding. This is a source finding, not a claimed live timeout reproduction.

The current turn edits only docs/kita-plan/addenda/NEXT-BATCH.md. It implements no product code, starts no swarm, runs no application test and performs no database operation. The complete subsequent implementation allowlist is:

| File | Permitted change |
|---|---|
| apps/kita/packages/database/src/pool.ts | Translate the existing normalized configuration to native pg options only at the default adapter's Pool-constructor boundary. |
| apps/kita/packages/database/__tests__/t-core-01-pg-adapter.spec.ts | New offline regression suite observing the default adapter's actual native-constructor arguments and preserving configuration isolation. |
| apps/kita/packages/database/__tests__/non-money-refusal-timeouts-postgres.spec.ts | New opt-in suite with the four real PostgreSQL cases below, including suite-local bounded observation and coordination. |

No other implementation file is authorized. Preserve all existing test files and helpers byte-for-byte, including the 13-case persistence suite, 8-case security suite, 9-case refusal unit suite and existing pool/transaction tests. Freeze transaction.ts, non-money-refusal-store.ts, exports, contracts, runtime configuration, routes, workers, manifests, lockfiles and dependencies. Do not add another helper, fixture file, snapshot, generated report or repository evidence artifact. Keep credential-free evidence in the operator's review output. Preserve unrelated tracked and untracked work.

At the native constructor boundary, apply exactly this mapping:

| Existing normalized option | Native pg.Pool option |
|---|---|
| connectionString | connectionString, unchanged |
| max | max, unchanged |
| statementTimeoutMs | statement_timeout |
| connectionTimeoutMs | connectionTimeoutMillis |
| idleTimeoutMs | idleTimeoutMillis |

Build a separate native options object. Preserve values and omit absent optional properties; introduce no new default, environment lookup, URL rewriting or fallback. Do not pass the three internal timeout property names to pg. Preserve DatabaseBindings, PoolConfigInput, ManagedPool.config and the injected PoolDriver contract, including their current normalized names and immutable per-instance configuration. Existing injected drivers must receive the same shape they received before this fix.

Preserve lazy driver loading, absence of import/construction-time connections, explicit per-instance ownership and shutdown, credential redaction and the existing public API. No new configuration field, connection layer, global pool, mutable shared configuration, public export or package reorganization is permitted. Do not broaden this into unrelated pool lifecycle or validation fixes. Do not substitute query_timeout, a Promise.race rejection or a session-level SET statement for the configured native statement_timeout. Do not alter connection strings to make a test pass.

The offline suite must exercise createPool without its injected-driver option and intercept the pg module's Pool constructor. Trigger the lazy constructor through a real adapter operation against the constructor stub. With distinct positive values, assert all five native mappings, absence of internal timeout names, omission of unspecified native keys, and unchanged public/injected-driver configuration. Check separate default-adapter instances with distinct configurations and that construction/import opens no connection. Existing pool tests stay unchanged. The regression must fail against the source base because the native timeout options are absent, then pass with the mapping fix. Do not represent constructor-stub observations as PostgreSQL evidence or fabricate database SQLSTATEs.

All migrations, every 001 copy, apps/kita/sql/CHECKSUMS.txt, migration ledgers and historical reviews are frozen. Preserve these source hashes:

| File | SHA-256 |
|---|---|
| apps/kita/packages/database/migrations/005_non_money_refusal.sql | 1a6b1f45f9fe5d6b29dee3a7bb58146dcc58154530ac9145b7da37c11ac55e07 |
| apps/kita/packages/database/migrations/006_non_money_refusal_conflict.sql | faffadc5a42d024a425e6c39ac0855c2fa02fa5365aa55fef64a0befecdc10c7 |

Recognize the existing 001 + 004 + 005 + installed 006 state. The installed recorder remains kita.record_non_money_refusal(text,text), returning jsonb, owned by kita_refusal_definer, LANGUAGE plpgsql, SECURITY DEFINER, with fixed search_path = pg_catalog, pg_temp. Its actual prosrc must be 3950 UTF-8 bytes, including leading/trailing newlines, with SHA-256 a6140caff93ff7a014ee33ae6c32bb669f8bd75322580fdaafc9c3179f76898a. Hash catalog bytes, not a reconstructed definition. Preserve its OID, body, owner, ACLs, reserved-row constraint, scoped uniqueness and both immutability triggers/functions.

Database execution is confined to the already provisioned PostgreSQL 18.6 target at 127.0.0.1:54339/kita_core_test, through explicitly supplied KITA_REFUSAL_TEST_OWNER_URL with no fallback credentials. Select the suite with KITA_REFUSAL_PG_TEST=1 and keep KITA_PG_TEST=0. Collection/import when unselected must open no connection or provision fixtures. A selected run with missing configuration, an unavailable target or failed preflight fails; it must not silently skip or substitute mocks.

Before fixture mutation, perform read-only preflight through a directly authenticated kita_test connection. Require server_version_num = 180006, the exact database, session_user = current_user = kita_test, NOSUPERUSER CREATEROLE, kita schema ownership and the actual authority for the existing restricted fixture provisioning. Inspect relevant role attributes and full membership rows, including grantor and ADMIN/INHERIT/SET options; self-membership is not provisioning proof. Verify the installed function and protections above, enabled ordinary-session triggers, session_replication_role = origin, fsync=on, full_page_writes=on and synchronous_commit=on. Require zero temporary kita_test-granted memberships in kita_refusal_definer. Preserve any pre-existing ADMIN-only bootstrap membership separately by grantor/options. No installation, repair, reset or grant escalation is permitted.

Reuse provisionRefusalFixtures unchanged: at most four new restricted logins and two disabled books per suite setup, with the existing immutable bindings and recorder grants. Create no customer, identity, session, token or financial fixture. No book may be enabled. All new writes after that fixture setup must use the existing refusal SQL function under a directly authenticated restricted login and the reserved operation recordNonMoneyRefusal.v1. No committed direct command_keys DML, history cleanup, role rename/drop, rebinding, elevated runtime login or new schema/table/function is authorized.

For every application backend, use the default createPool path with the real installed pg driver and no injected driver. On the same checked-out connection, establish session_user = current_user = the expected fixture login, its login OID and backend PID, restricted role attributes, effective recorder membership and synchronous_commit=on. Independently confirm that login OID/name's immutable binding and disabled book through an owner observer. Owner-plus-SET ROLE cannot supply runtime evidence. Retain the established lack of direct table privileges, schema CREATE, ADMIN authority and effective paths to privileged roles; grant nothing to facilitate the new cases.

Suite-local owner observers and the one restricted blocking client may use real pg.Client with correctly named finite native timeouts. They supply observation and coordination only. They must not replace the default adapter on the application path. A forwarding observation wrapper may record native errors, query completion order and releases, and perform read-only identity/setting observations; it must forward application SQL and parameters unchanged. It must not implement retries, transaction recovery, result mapping or synthetic errors.

Implement exactly four named PostgreSQL cases:

| Case | Required real evidence |
|---|---|
| Native options and committed persistence | Construct two default-adapter pools with distinct finite statementTimeoutMs values and finite connectionTimeoutMs/idleTimeoutMs. Observe each backend's actual statement_timeout through current_setting, with independent pool identities and unchanged synchronous_commit=on. Through unchanged recordNonMoneyRefusal, commit a fresh refusal and independently observe its complete reserved row. Same-tag replay and changed-tag 409 preserve that row. Closing one pool leaves the other usable for its own scoped refusal. |
| Native statement cancellation and recovery | A directly authenticated restricted blocking client begins a transaction and calls the existing SQL function for a fresh key/tag, leaving only that insertion uncommitted. Invoke unchanged recordNonMoneyRefusal for the same scope/key through a default-adapter pool with a short configured statement timeout. Require the actual driver to raise 57014 while waiting on that conflict, followed by application ROLLBACK/release and the exact unconfirmed envelope below, with one total attempt and no COMMIT. Roll back and close the blocker unconditionally. Fresh independent observation then finds zero rows. After removing the blocker, a separate ordinary same-key store call must commit exactly one refusal row and replay it unchanged. |
| Native bounded acquisition | Use a default-adapter pool with max=1 and a short connectionTimeoutMs. Hold its one real, identity-verified checkout and request another checkout. Require that second promise to reject from the real pg-pool acquisition timer while the first remains held, within a generous finite upper bound. A test watchdog cannot satisfy this assertion. Do not put a writing callback behind the pending acquisition. After the native rejection and holder release, require a normal store call through the same pool to commit one fresh refusal and replay it; no orphan pending checkout or leaked connection may remain. |
| Native idle removal and replay | Through a default-adapter pool with a short idleTimeoutMs, commit a fresh refusal and retain the actual writer PID/backend_start and complete row. A separate default-adapter observation pool authenticated as the same restricted login must first positively observe that exact backend while its checkout is held. After release, observe its disappearance within a finite window materially shorter than pg-pool's default idle timeout, without closing the writer pool or signaling PostgreSQL. A later store replay through the writer pool must use a newly established authenticated backend and preserve the complete original row. A changed tag still returns the exact 409 without changing history. |

Use explicit short timeout values and generous observation bounds appropriate to the isolated target. Record configured values, observed statement_timeout values, actual native error codes where present, completion order and elapsed intervals. Acquisition timeouts are native driver errors and need not have a PostgreSQL SQLSTATE; do not invent one. Verify the actual settings rather than asserting only configuration fields. If URL/environment settings override the intended native settings, report the observed conflict and HOLD; do not silently strip parameters, change the operator's URL or issue compensating SET commands.

The blocking transaction is restricted, suite-owned and always rollback-only. Its function result is an uncommitted coordination observation, not proof of a persisted refusal. Await its ROLLBACK on success and every failure path, close it, then observe committed state independently. Verify authenticated identity, binding and durability settings on the blocking connection as well. Activity observations must target only the known fixture PID/backend_start, use a same-login observer and establish visibility before testing disappearance; masked/null statistics cannot prove a backend closed. No owner mutation, table-wide lock, trigger disabling, replication-role change, persistent/global server setting change, backend termination, process signaling, restart, privileged monitoring grant or external network fault proxy is authorized.

The statement-cancellation case must capture the structured 57014 from the real function query before application mapping. A timeout message, deliberate rejected promise, sleep-only query or final 503 alone is insufficient. Confirm exactly one application checkout/attempt, SERIALIZABLE BEGIN, the failed function query, awaited ROLLBACK and release before response delivery. There must be no retry for 57014 and no hidden outer retry. Recovery is a separate explicitly identified invocation after blocker cleanup, not an extension of the original attempt budget.

Preserve the existing maximum of three total SERIALIZABLE attempts, structured 40001/40P01 retry whitelist, backoff and commit/rollback/release behavior. Preserve every existing refusal, mismatch, unauthorized, invalid-input and integrity envelope. Never return or store a successful command/session response, relax validation, alter the reserved operation or add client-selected scope.

The committed stored/returned refusal remains exactly:

~~~json
{"ok":false,"error":{"code":"CAPABILITY_UNAVAILABLE","status":503,"retryable":false,"detail":"Command execution is unavailable."}}
~~~

The changed-tag result remains exactly:

~~~json
{"ok":false,"error":{"code":"IDEMPOTENCY_MISMATCH","status":409,"retryable":false,"detail":"Idempotency key is bound to a different request."}}
~~~

The canceled application's unconfirmed result remains exactly:

~~~json
{"ok":false,"error":{"code":"dependency_unavailable","status":503,"retryable":true,"detail":"Refusal persistence is unconfirmed; retry the same key."}}
~~~

An unconfirmed response is not passing evidence of a committed refusal. After both transactions roll back in the cancellation case, zero committed rows must be observed before the separately identified recovery call.

Give each case fresh random keys and valid tags, with no ordering dependency or reuse of prior-suite history. All reserved-row observations use book_id, actor_id, operation and key, with id as an additional identity check once known. Compare id, book_id, actor_id, operation, key, request_hash, state, resource_id, response and created_at before/after replay. Preserve timestamp precision, for example with created_at::text. Require exactly one row per committed full scope, state rejected, resource_id NULL, the exact stored refusal and independently computed rr1 SHA-256 over UTF-8 canonical bytes {"requestTag":"<tag>","schemaVersion":1}. Observe through fresh owner connections; do not use an application's returned hash as the oracle. Never inspect financial or identity data.

Bound connection establishment, statements, lock waits, each case, hooks, observation polling and shutdown. Bound the blocker as well as application writers. Watchdogs must close only suite-owned connections, await outstanding work and report any late actual outcome; their expiration never counts as native timeout evidence. Explicitly release every acquired client and await every pool/client closure on success and failure. Preserve the primary error and report cleanup failures. Do not rely on process exit, fire-and-forget close, an unobserved promise or deletion of persisted fixtures.

Review the complete three-file implementation diff and native-constructor regression before database execution. After source review and successful preflight, validation from the repository root is:

~~~sh
npm --prefix apps/kita run typecheck --workspace @kita/database
KITA_PG_TEST=0 KITA_REFUSAL_PG_TEST=0 npm --prefix apps/kita run test --workspace @kita/database
KITA_PG_TEST=0 KITA_REFUSAL_PG_TEST=1 npm --prefix apps/kita run test --workspace @kita/database -- --fileParallelism=false __tests__/non-money-refusal-timeouts-postgres.spec.ts __tests__/non-money-refusal-security-postgres.spec.ts __tests__/non-money-refusal-postgres.spec.ts
node --test apps/kita/database/tests/checksums.test.mjs
git diff --check
~~~

Also run sha256sum -c CHECKSUMS.txt with working directory apps/kita/sql and verify the protected 005/006 hashes above. Compare every tracked implementation path outside the allowlist against 43892f0. The offline run must pass the new constructor regression and retain all 9 refusal unit passes and existing applicable tests. The selected PostgreSQL run must execute all 4 new cases plus the unchanged 13+8 baseline: 25 passing, zero failing, zero skipped. Do not count unselected-suite skips, a beforeAll failure, empty selection or filtered-out cases as database acceptance. Report exact commands, exit statuses, counts and diagnostics without editing outside the allowlist.

Return the approved documentation reference, source base, implementation head, tested head, complete diff, source-base failing constructor regression, passing checks and protected-file comparisons for independent Sol/max review. Include the actual resolved driver versions, target/security preflight, configured/native timeout observations, directly authenticated backend identities, raw native cancellation/acquisition provenance, transaction order, idle-backend disappearance and fresh scoped before/after row observations. Reconfirm function OID/body/owner/ACLs, triggers, existing role/security state and zero temporary installer memberships after execution. Account separately for the permitted new fixture principals and recorder grants. Redact credentials, URLs, password-bearing role creation statements and credential-bearing error/configuration objects.

Subsequent implementation follows the standing roles: coordinator syncs to GPU gpu-fqaf and routes Qoder CLI Efficient Agent Teams/subagents through ~/.coordinator/run-batch.sh; Qoder implements there; coordinator bundles/downloads; Codex gpt-6.1-sol at max independently reviews on the VM. Astra/xhigh planning stays within this freeze. Cursor Grok remains coordinator only. Failed review returns to Qoder as a scoped fix batch. This documentation turn starts none of those actions. Any separately authorized merge still requires review, tests and merge gates against the exact final head.

If preflight finds unexpected installation/security state or unavailable authority, or the fix requires broader API/configuration changes, dependency changes, transaction/store changes, schema or privilege changes, or exposes another substantive defect, stop dependent work and return BATCH-HOLD with an empty implementation allowlist. Do not quietly switch features, grant authority, weaken assertions or reset history. Test-only defects may be corrected within the allowlist and re-reviewed before execution.

Passing this batch establishes only correct native timeout propagation and the enumerated real non-money persistence/lifecycle behavior on the pinned test target. It does not establish connection-handshake fault recovery, crash/restart durability, failover, real 40P01 recovery, native retry exhaustion, commit-time serialization recovery, fresh/upgrade migration acceptance or the still-open 100 independently connected contenders behind a barrier. The existing 100 requests through a pool capped at 40 do not close that contention requirement. Role rename/OID-reuse spoofing and enabled-book denial evidence remain separately scoped.

Preserve [the T-CORE-02 hold](T-CORE-02-BATCH.md), [the identity review](../SOL-IDENTITY-REVIEW.md) and [the public OpenAPI freeze](OPENAPI-FREEZE.md). Session binding remains HOLD until a later explicit non-money authorization defines real verified evidence, ownership, one-use replay/expiry semantics, credential handling and durable atomic effects; this adapter fix supplies none of that authority. Full T-CORE-01/T-CORE-02 acceptance, CP-00-11, PACK/REQ-SC/TEST and DEP-00-15 obligations remain unclosed. No G1-G6 PASS or US-PH production approval is conferred.

Checks in this documentation turn cover the local source head, inspected driver option names, protected migration/body source hashes, local references, whitespace and a tracked diff confined to NEXT-BATCH.md. No fresh build, typecheck, application test, database timeout reproduction, migration application or PostgreSQL PASS is claimed. Money closed. Never ok:true.
