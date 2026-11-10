BATCH-OK

Money closed. Never ok:true. No executeCommand, money_operations access, session minting, identity/KYC success, provider calls, live traffic, pilot, launch, deployment or G1-G6 closure.

Baseline: 4d2e1ce17614b49ec89168c3a25dff52426bdd33 (4d2e1ce, PR #123). The leftover LIMITED PURE checkers are exhausted. This is the later concrete scope decision for one non-money persistence slice. It supersedes the previous NEXT-BATCH.md in full. It authorizes no additional checker and does not reopen full T-CORE-02 or any money task.

BATCH-OK means that the implementation scope below is frozen. It is not an implementation PASS, PostgreSQL test result or permission to activate a runtime. This turn edits only docs/kita-plan/addenda/NEXT-BATCH.md; no application code, migration, test, configuration or generated file is created now.

## Exact implementation allowlist

A subsequent implementation batch may create exactly these five new files, and may edit no existing file:

~~~text
apps/kita/packages/database/migrations/005_non_money_refusal.sql
apps/kita/packages/database/src/non-money-refusal-store.ts
apps/kita/packages/database/__tests__/non-money-refusal-store.spec.ts
apps/kita/packages/database/__tests__/non-money-refusal-postgres.spec.ts
apps/kita/packages/database/__tests__/helpers/non-money-refusal-pg.ts
~~~

These paths are absent at the baseline. No directory glob, additional helper, dependency, manifest, lockfile, barrel export, public contract, route, client, worker, migration ledger, checksum artifact or runtime wiring is included. Existing untracked files are outside the batch. Preserve every existing migration, including 001_core.sql and 004_identity_access.sql, byte for byte, and preserve the other copies of 001_core.sql. Do not create the full-task 002_command_authority.sql or command-authority.ts.

## One operation and its complete contract

Freeze the internal storage operation string to recordNonMoneyRefusal.v1. Its sole effect is to insert or recover a permanently rejected command_keys row. It does not attempt another operation, accept business work, create a resource or grant execution authority.

This is a storage-only namespace explicitly frozen by this addendum. It is not a public CommandOperationId, endpoint or member of COMMAND_OPERATIONS. Do not cast it into CommandEnvelope/CommandReceipt, edit the operation registry or expose a private HTTP/RPC contract. The [public OpenAPI freeze](OPENAPI-FREEZE.md) remains intact.

The only TypeScript entry point is recordNonMoneyRefusal(pool, input), in the new source file, imported directly by its tests. The pool is trusted infrastructure, never request data. Input must be a plain object with exactly two own data properties:

| Field | Frozen rule |
|---|---|
| idempotencyKey | Full-string ASCII [A-Za-z0-9_-], 16-128 bytes. No trimming, normalization or coercion. |
| requestTag | Full-string ASCII [A-Za-z0-9_-], 1-64 bytes. An opaque non-PII test/service label, not a financial payload, credential or business-object reference. |

Reject null, arrays, accessors, missing/extra properties, wrong types, Unicode, whitespace and out-of-range lengths before checking out a connection. There is no caller-supplied actor, book, operation, role, request hash, refusal code, response JSON, resource ID, callback or transaction option. Direct SQL calls must independently reject invalid/null key and tag values before writing.

Canonicalization version rr1 is the exact UTF-8 byte sequence below, with the validated tag substituted, no spaces, escapes or trailing newline:

~~~json
{"requestTag":"<requestTag>","schemaVersion":1}
~~~

The database computes request_hash as rr1: followed by the 64 lowercase hexadecimal characters of SHA-256 over those bytes, using pg_catalog.sha256 and explicit UTF-8 conversion. The constrained alphabet makes this encoding unambiguous. The key is not part of the payload hash; book, actor and operation are the separate identity dimensions. Do not accept a supplied digest or hash PostgreSQL's JSON display formatting.

Every newly committed row and every matching replay has exactly this stored response and returned result:

~~~json
{"ok":false,"error":{"code":"CAPABILITY_UNAVAILABLE","status":503,"retryable":false,"detail":"Command execution is unavailable."}}
~~~

Use a local failure-only return type whose discriminator can only be false. Do not use a success-capable Result union, success helper, void return, acknowledgment object, receipt, operation ID, resource ID or replay/success flag. Returning the fixed refusal establishes no business acceptance. A persistence error must not be replaced with that stored-result claim.

Freeze other returned failures to the same ok:false/error envelope, without additional fields:

| Condition | error.code / status / retryable / detail |
|---|---|
| Invalid input; SQLSTATE 22023 | invalid_request / 400 / false / "Invalid refusal-record request." |
| Missing, revoked or invalid database binding; KRF01 or 42501 | unauthorized / 403 / false / "Refusal-record scope is unavailable." |
| Same scoped key, different rr1 payload; KRF02 | IDEMPOTENCY_MISMATCH / 409 / false / "Idempotency key is bound to a different request." |
| Stored-row integrity violation; KRF03 | dependency_unavailable / 503 / false / "Refusal-record integrity is unavailable." |
| Connection/commit uncertainty, exhausted retry or other database failure | dependency_unavailable / 503 / true / "Refusal persistence is unconfirmed; retry the same key." |

SQLSTATEs KRF01-KRF03 are reserved to these cases in the new function. Map structured codes, never error-message text. Do not leak SQL, credentials, another scope's data or raw driver errors through the return value.

## Trusted scope and database authority

The actor is an operator-provisioned service principal, not a customer or a purported authenticated human. PostgreSQL's authenticated session_user is the trust root. No application login, bearer token, cookie, IdP exchange or session binding is implemented.

The migration creates kita.non_money_refusal_principals with exactly login_oid (oid primary key), login_name (name, unique, not null), book_id (uuid, not null, FK to books) and actor_id (text, not null). Actor IDs must be refusal-service: followed by 1-64 ASCII letters, digits, underscores or hyphens. Require UNIQUE(book_id, actor_id). This is an authorization mapping, not another idempotency store.

Only the migration owner may provision bindings out of band. Each authenticated database login maps to exactly one book/actor pair; both its catalog OID and name must match. A dropped/recreated login cannot inherit an old binding by name. Bindings are immutable: reject UPDATE and DELETE. Revocation removes runtime membership or login access and preserves key history. No provisioning function or credential creation is reachable from the store.

Create these two new NOLOGIN roles, both NOSUPERUSER, NOCREATEDB, NOCREATEROLE, NOINHERIT, NOREPLICATION and NOBYPASSRLS:

| Role | Final authority |
|---|---|
| kita_refusal_recorder | Schema USAGE and EXECUTE on only kita.record_non_money_refusal(text,text). No table privileges, ownership or membership in another role. |
| kita_refusal_definer | Owns only the new SQL entry point; schema USAGE; SELECT on the binding table and books(id,status); minimum column SELECT/INSERT needed on command_keys. No UPDATE, DELETE, TRUNCATE, schema CREATE, other role membership or financial-function privilege. |

Abort the migration if either role name already exists; do not silently reuse an unknown role. Temporary migration-owner membership/schema privileges needed to transfer function ownership must be removed before commit. The definer must not own command_keys, books or the binding table.

Runtime connections authenticate directly as separately provisioned restricted LOGIN principals. Their only application-role membership is kita_refusal_recorder, with inherited privileges, no ADMIN or SET option, and no elevated role attributes or object ownership. No shared owner connection followed by SET ROLE qualifies as runtime evidence. The store issues no SET ROLE or SET SESSION AUTHORIZATION.

Freeze the sole SQL entry point to kita.record_non_money_refusal(p_key text, p_tag text) RETURNS jsonb, SECURITY DEFINER, owned by kita_refusal_definer. Set its search_path to pg_catalog,pg_temp; qualify all application objects and built-ins. Use static parameterized SQL only. Revoke PUBLIC privileges on every new table/function, including trigger helpers, and grant runtime execution only on this entry point to kita_refusal_recorder. Grant nothing new to kita_api, kita_worker, kita_posting or kita_auditor. Assert the final grants and role memberships before the migration commits.

On every call, derive the binding from session_user, check the authenticated login's restricted attributes and allowed membership, and require its bound book to exist with status disabled. Check scope before looking up a key. Missing/invalid binding, revoked membership or any other book status refuses without writing or disclosing whether a key exists. Do not trust current_user inside SECURITY DEFINER, custom GUCs, application_name, supplied claims or caller-set scope variables.

This scope deliberately supports only individually bound service logins on disabled books. A shared multi-customer pool or production authentication integration needs a separate decision.

## Additive migration and immutable storage

005_non_money_refusal.sql is one transactional additive migration over the existing 001 + 004 schema. It creates only the mapping, roles, entry point, and constraints/guards needed for this reserved operation. It inserts no binding, book, customer, command key or financial row. Abort atomically if the reserved operation already has rows or a new object name collides; do not adopt, rewrite or delete legacy records.

Reuse kita.command_keys and its UNIQUE(book_id,actor_id,operation,key). The only inserted values are database-generated id/created_at, bound book_id/actor_id, the fixed operation, validated key, computed rr1 hash, state rejected, resource_id NULL and the exact refusal response. No running, succeeded or unknown row is ever written. Do not add a second idempotency table.

Add database enforcement conditional on this operation only:

- INSERT requires the fixed refusal shape, a non-null rr1 hash in the frozen format, permitted key/actor alphabets, state rejected and resource_id NULL. A nullable CHECK expression must not let an invalid row pass.
- Reserved-operation INSERT is permitted only through the definer with the authenticated binding; runtime principals cannot insert directly.
- Reject every UPDATE/DELETE of a reserved row and every attempt to rename another row into this operation. Protect identity, scope, hash, state, result and timestamps.
- Do not alter constraints, lifecycle or access for other operations, enable global RLS, broaden existing role grants or create a generic executor.

Retention is indefinite for this slice: no expiry, cleanup, overwrite, key reuse or delete path. Keep revoked principals' existing refusals. Unexpected stored state/hash version/resource/response refuses as KRF03; it never upgrades or repairs the row.

The only application data reads are the login binding, its book's id/status and that binding's reserved-operation key. The only application data write is the reserved command_keys INSERT. No reads or writes of money_operations, transfers, attempts, holds, limits/liquidity reservations, ledger, balances, points, providers, sessions, contacts, instruments, consent, events, outbox or audit state are authorized. No post_journal, authorizeDispatch or other command function may be invoked.

## Transactions, contention and recovery

The source must use the existing withSerializable helper with fixed maxAttempts 3 and retryDelayMs 50. Each attempt owns one checkout for BEGIN ISOLATION LEVEL SERIALIZABLE, the one scoped function call, COMMIT and any rollback. Expose no work callback or transaction options.

Use the existing unique identity to converge contenders. Insert-or-reload must not use ON CONFLICT DO UPDATE. A contender whose serializable snapshot cannot yet see the winning row retries with SQLSTATE 40001, rather than inventing a response. Validate the stored scope, state, hash version, resource, response and required metadata before comparing the request hash; only an intact row may produce a replay or mismatch. The existing helper retries only 40001/40P01 on a fresh transaction.

A matching same-scope key returns the original fixed refusal only after COMMIT acknowledgment. A different tag with that key returns 409 without changing the original row. The same textual key under a different authorized book/actor is a distinct identity, never a lookup or overwrite of the first scope.

Before commit, rollback or process death leaves no row. After commit, a new connection/process must recover the original refusal. Loss of COMMIT acknowledgment returns the unconfirmed failure, discards an unusable connection, and permits recovery only by retrying the same scope/key/tag. Do not automatically invent a fresh key, clear history, infer rollback from a timeout or report a committed result without evidence. No external effect occurs inside the transaction.

## Required PostgreSQL evidence

Real PostgreSQL 18 is mandatory for acceptance of this slice. Mock/static tests alone, owner-only runs and skipped PostgreSQL cases cannot establish durability or isolation.

The new helper must require an explicit KITA_REFUSAL_TEST_OWNER_URL, with no default credentials or target. Pin it to kita_test at 127.0.0.1:54339/kita_core_test on a dedicated disposable PostgreSQL 18 cluster with max_connections at least 128. Validate the URL and actual server/database/login before any mutation. Refuse initially nonempty/unrecognized targets, other hosts/ports/databases, wrong engine versions and production credentials. Do not install/start a service, reset a shared database or use live data implicitly.

Start each installation scenario from empty test schemas and absent new roles. The helper may clean up only schemas/roles it created and tracked in this same run after validating the initially empty dedicated target; it must refuse unknown leftovers, never reset a shared target or drop the database. Apply the complete unmodified 001_core.sql, 004_identity_access.sql and new 005 file in order. Record file hashes. Do not call the existing migration runner's repository-local .applied.json path or the legacy resetTestDatabase helper. The current PG test helper defaults to another target, and test-plat-02.spec.ts still expects migration versions [1] despite 004 already existing. Neither is evidence for this new migration; neither may be edited here. This focused harness does not fix or certify the existing migration lifecycle.

After schema installation, the helper may create only disabled test books, immutable service bindings and ephemeral restricted login fixtures: kita_refusal_test_a and kita_refusal_test_b for different actors in one book, kita_refusal_test_c in a different book, and kita_refusal_test_unbound with membership but no binding. Generate credentials in memory; never commit/log them. For the negative book-status case, close a disabled fixture book; never set sandbox or live. The upgrade fixture may seed one unrelated rejected non-money key before 005, with resource_id NULL and the fixed refusal response, solely to verify preservation. Migration/setup authority is separate from runtime pools. No customer or session fixtures, successful business responses or financial rows are allowed.

The new PostgreSQL suite must exercise the following, with actual connections and observable database effects:

| Required case | Required observation |
|---|---|
| Fresh install, additive upgrade and rollback | 001 + 004 + 005 install; upgrade from 001 + 004 preserves an unrelated rejected non-money key; object/role/reserved-namespace collisions abort without partial new authority. Existing SQL bytes and unrelated grants remain unchanged. |
| Real runtime authority | Independently authenticated A/B/C/unbound connections; capture session_user/current_user outside the definer. Actual SELECT/INSERT/UPDATE/DELETE/TRUNCATE against command_keys/bindings are denied. SET ROLE to definer/posting/owner and SET SESSION AUTHORIZATION escalation fail. Owner/catalog checks alone do not count. |
| Scope isolation and spoofing | B/C cannot recover A's row; reusing its textual key creates only their own identities. Forged input scope is rejected; caller-set GUCs, search_path, temp objects and application_name do not change binding. Unbound/revoked/recreated-login and non-disabled-book calls refuse without a row. |
| Canonical hash and validation | Independently calculated golden UTF-8/SHA-256 vectors, boundary keys/tags, malformed direct SQL calls and unknown/extra source fields. Invalid inputs write nothing; supplied hashes/operations/results cannot enter the store. |
| Replay and mismatch | A commits one rejected row; independent connections and a new Node process recover the same id/hash/result/created_at. A changed valid tag gives 409 and preserves every original field. No test accepts arbitrary historical JSON as a refusal. |
| At least 100 simultaneous contenders | At least 100 independent authenticated runtime connections start behind a reproducible barrier for one scope/key/tag; do not serialize them through a smaller pool. Exactly one row remains and completed calls converge on its refusal. Also force a known winner before changed-tag contenders and observe only mismatches, without overwrites. Log retry exhaustion honestly. |
| Transaction failure and crash | Real rollback and backend/process termination before COMMIT leave no partial row. A real committed row survives client process restart. Suppress delivery of an actual COMMIT acknowledgment and observe unconfirmed failure followed by same-key recovery. Fault wrappers must still send SQL/COMMIT to PostgreSQL. |
| Retry behavior | Deterministic PostgreSQL lock/snapshot barriers produce actual 40001 and 40P01 failures, recovery and bounded exhaustion. Keep test contention within keys/bindings or PostgreSQL advisory locks. Verify fresh transactions, cleanup and unchanged identity; manufactured Boolean evidence or mocked SQLSTATEs are insufficient for this row. |
| Immutable refusal boundary | Direct forbidden mutations fail under real restricted logins; isolated owner probes also demonstrate the reserved-operation constraints/guards, including operation renaming and null response. No reachable result grants business success or execution authority. |
| No financial or identity authority | Catalog ACL/membership/function-privilege inspection covers both the runtime and definer. Observe actual application SQL and nested SQL or actual relation-access observations to prove the function touches only approved objects. No data SQL against financial/identity tables is part of these tests; no financial function or provider is exercised. |

Use the new unit spec for input/output validation, fixed error mapping, commit-result ordering and cleanup faults. It supplements the PostgreSQL suite. It must not become another supplied-evidence checker.

Freeze the future validation commands, run from the repository root after explicit test-cluster provisioning and owner URL configuration:

~~~sh
npm --prefix apps/kita run typecheck --workspace @kita/database
KITA_PG_TEST=0 KITA_REFUSAL_PG_TEST=0 npm --prefix apps/kita run test --workspace @kita/database -- __tests__/non-money-refusal-store.spec.ts
KITA_PG_TEST=0 KITA_REFUSAL_PG_TEST=1 npm --prefix apps/kita run test --workspace @kita/database -- --fileParallelism=false __tests__/non-money-refusal-postgres.spec.ts
KITA_PG_TEST=0 KITA_REFUSAL_PG_TEST=0 npm --prefix apps/kita run test --workspace @kita/database
~~~

When KITA_REFUSAL_PG_TEST=1, missing configuration, an unreachable server or an unavailable required case must fail the focused run, never skip or substitute a mock. Ordinary unit runs may visibly skip the unselected PG suite; that supplies no PG evidence. Record every failure/skip and compare existing diagnostics against the baseline. A new failure cannot be waived as pre-existing, and any necessary edit outside the five paths requires another scope decision.

This VM cannot run those PostgreSQL tests with its current setup: no psql/postgres/initdb/pg_ctl, Docker or Podman is on PATH; no PostgreSQL server binaries were found at the standard /usr/lib/postgresql location; no configured PostgreSQL URL/PG connection variables were found; and no listener was observed on 54339 or the legacy helper's 55432. The pg driver and local Vitest/TypeScript binaries exist, but they do not supply a database. No server/dependency provisioning or PostgreSQL test was run in this documentation turn. Provision the isolated engine on the authorized implementation/test executor before claiming acceptance; absence of this environment evidence does not reopen money.

## Review and remaining holds

Subsequent implementation follows the operator roles: Astra/xhigh planning within this freeze, Sol/max directing and independent review, GPU gpu-fqaf Qoder Efficient coding, and coordinator GitHub handling. Do not use the batch script or dispatch a swarm in this documentation-only turn.

Review must show exact base/head, the complete five-file diff, unchanged protected-file hashes, actual runtime-role logs, test commands, concurrency/fault observations and all failures/skips. Send substantive failures back to Qoder. This document authorizes no merge or deployment.

Preserve [T-CORE-02-BATCH.md](T-CORE-02-BATCH.md), [the identity review](../SOL-IDENTITY-REVIEW.md) and all prior bounded reviews. Their unavailable session/instrument behavior and full-task holds remain in force. The sole new authorization is the isolated refusal-record persistence slice frozen here; executeCommand and the remainder of T-CORE-02 stay HOLD.

All other unclosed full tasks, CP-00-11 gaps, PACK/REQ-SC/TEST obligations and DEP-00-15 conditions remain unclosed, including T-CORE-01 runtime/migration acceptance, identity, ledger, posting authority, rewards, integration, certification, pilot and launch. No G1-G6 pass, production-readiness claim or live work is granted.

Checks for this turn are limited to the first-line decision, exact new allowlist, local references, whitespace and a diff confined to NEXT-BATCH.md. No application build, typecheck, unit test or PostgreSQL result is asserted.
