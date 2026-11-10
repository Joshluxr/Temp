BATCH-HOLD

Implementation allowlist: []

No next implementation batch is authorized at this head. The existing refusal recorder provides real non-money persistence, but its remaining acceptance gaps and the absence of verified customer authority prevent a safe handoff to another product store. Adding a boolean checker, caller-supplied evidence flag or another unavailable stub would not advance that goal. This handoff replaces the previous BATCH-OK and its two-file implementation allowlist.

Money closed. Never ok:true. No executeCommand or money_operations access. Session bind and bindSession activation remain HOLD, including session/token creation, rotation and revocation. Identity/KYC success, financial execution, posting, rewards and provider calls remain HOLD. No general T-CORE-02 or T-IDENTITY-01 authorization. Runtime activation, live traffic, deployment, integration acceptance, certification, pilot, launch and G1-G6 closure remain HOLD.

Source base: 0ecda66601b60bf835cb0e606bc406ce3ad13bc6 (0ecda66), confirmed as local HEAD. The operator identifies [PR #128](https://github.com/Joshluxr/Temp/pull/128) and reports all 27 PostgreSQL cases passing after the atomicity victim-checkpoint and close-lifecycle repairs. This is attributed execution evidence. This documentation turn performs no fresh application test, typecheck, PostgreSQL run, database operation or independent runtime-log review; it grants no merge or production approval.

Source review recognizes the repairs in 0ecda66: acquisition counts follow actual checkout; transaction/release events follow completion; both first-attempt backend identities are retained; the native 40P01 event identifies the victim; victim release precedes an independent row/lock checkpoint before survivor commit; both application-pool closes are awaited through allSettled. Shared owner connects now enter cleanup coverage, and fixture-pool closure awaits all returned close promises. Preserve these improvements and every existing regression.

The following acceptance gaps remain visible in the source. The reported passing count does not exercise or establish all of these failure paths; these findings do not assert that the operator's run failed.

| Source at 0ecda66 | Unclosed acceptance requirement |
|---|---|
| apps/kita/packages/database/__tests__/helpers/non-money-refusal-pg.ts:159-165,202-208,227-233,325-331 | Every owner-client end failure is swallowed under “connect may have failed,” including after a successful connect and successful queries. A close failure can disappear from acceptance. Preserve a primary failure while retaining secondary cleanup failures, and fail a previously successful path when cleanup fails. Partial fixture provisioning also lacks credential-free accounting if setup fails before returning its fixture object. |
| apps/kita/packages/database/__tests__/non-money-refusal-atomicity-postgres.spec.ts:58-80,94-106,219-225,265-270,287-302,390-410,433-447 | Gates and started invocations lack immediate rejection handling; retaining a promise in pending does not handle its rejection. Cleanup rejects gates that may never have been awaited. Suite-owned observer connects still precede their cleanup blocks. Failure settlement and resource closure therefore remain incomplete despite the improved successful path. |
| apps/kita/packages/database/__tests__/non-money-refusal-atomicity-postgres.spec.ts:125-144,164,288-297,418-455,494-498 | statement_timeout is selected without assertion; actual-login OID/attributes, effective membership, immutable binding, distinct backend identities and relevant lock/deadlock settings are incompletely asserted. Advisory-lock observations lack full database/two-integer namespace and unexpected-participant checks. Survivor persistence is checked only by count before retry, and final sequence regexes do not prove the complete per-attempt transaction/release order. |

These are review findings, not permission to repair the named files under this handoff. No previous allowlist carries forward implicitly. All 27 existing PostgreSQL cases, native-constructor and offline refusal regressions remain preservation obligations; none may be removed, weakened, split or skipped to present acceptance.

The preferred next product direction is durable communication-preference/consent persistence, with marketing suppression and lawful service-notice handling kept explicit. Its prerequisites are unresolved at this head:

| Candidate | Missing authority or contract |
|---|---|
| Communication preferences/consent | apply-communication-consent.ts takes marketingCampaignDespiteOptOut; Grow08Input carries no concrete preference change, verified customer evidence, governing consent reference or expected version. Grow07CommandContext contains only worker identity/trace fields. This supplies neither customer ownership nor an atomic consent/preferences/idempotency/audit contract. |
| Contact verification | verify-contact.ts accepts contactVerified as a boolean. Its current success type claims transfer authorization. Challenge evidence, one-use consumption, expiry/attempt handling, destination privacy and durable customer ownership are unresolved. A schema or typed assertion cannot substitute for verified evidence. |
| Support messages | append-support-message.ts accepts wrongAccountOrCrossCaseAttachment as a boolean and a worker-only context. There is no concrete message/attachment input or verified same-customer, same-case authority contract. |
| Recipients | create-recipient.ts relies on serverSideOwned/clientClaimedValidated flags; institution validation, protected destination data and durable ownership remain unavailable. This lane also depends on provider and financial boundaries that remain closed. |
| Sessions | bindSession remains an unavailable gate with an opaque CommandContext. The explicit session-bind HOLD prevents choosing it as a substitute persistence lane. |

The refusal principal's database login/OID binding proves only its fixed refusal-service scope in a disabled book. It cannot authorize customer preferences, contacts, cases, recipients, sessions or identity evidence. Do not reinterpret it as customer authentication, accept ownership booleans, introduce an owner-login bypass or seed trusted customer/session/KYC evidence to unlock a store. Existing table DDL and the frozen public OpenAPI alone do not supply those missing semantics.

A later reviewed BATCH-OK for real non-money persistence must identify one store and freeze its concrete contract before implementation: trusted evidence provenance and scope; the authoritative customer/book ownership lookup or explicitly service-owned scope; minimal stored data and privacy handling; expiry/replay/version rules where applicable; exact durable effects and idempotency scope; atomic write/audit boundaries; least-privilege SQL authority; and committed, conflicting, rejected and unconfirmed outcomes that preserve Never ok:true. Any internal committed-write return must have a concrete data contract without manufacturing session, identity or command success.

That handoff must also resolve or explicitly disposition the source findings above, name an exact base and finite file allowlist, and require independent committed-row, replay/conflict, concurrent-call, rollback and failure-cleanup evidence through directly authenticated restricted connections. A returned refusal or checker verdict alone cannot establish persistence. The later review must explain any remaining acceptance limitations; another passing count cannot silently close them. This paragraph defines prerequisites only and authorizes no contract edit, migration, test change or execution now.

Freeze all implementation files, tests/helpers, exports, contracts, routes, workers, runtime configuration, manifests, lockfiles and dependencies. Freeze every migration, every 001 copy, apps/kita/sql/CHECKSUMS.txt, migration ledgers, protected plans and historical reviews. Add no schema object, privilege, fixture, checker, snapshot, generated report or repository evidence artifact. Preserve unrelated tracked and untracked work. This turn edits only docs/kita-plan/addenda/NEXT-BATCH.md.

Preserve these source hashes:

| File | SHA-256 |
|---|---|
| apps/kita/packages/database/migrations/005_non_money_refusal.sql | 1a6b1f45f9fe5d6b29dee3a7bb58146dcc58154530ac9145b7da37c11ac55e07 |
| apps/kita/packages/database/migrations/006_non_money_refusal_conflict.sql | faffadc5a42d024a425e6c39ac0855c2fa02fa5365aa55fef64a0befecdc10c7 |

Preserve the installed 001 + 004 + 005 + 006 refusal state: kita.record_non_money_refusal(text,text), returning jsonb, its OID, owner kita_refusal_definer, LANGUAGE plpgsql, SECURITY DEFINER, fixed search_path = pg_catalog, pg_temp and ACLs. Its actual catalog prosrc remains pinned to 3950 UTF-8 bytes and SHA-256 a6140caff93ff7a014ee33ae6c32bb669f8bd75322580fdaafc9c3179f76898a, including surrounding newlines. Preserve immutable principal bindings, scoped uniqueness, the reserved-row shape constraint and both enabled immutability triggers. These are preservation requirements, not a claim of a fresh catalog inspection.

The committed stored refusal remains exactly:

~~~json
{"ok":false,"error":{"code":"CAPABILITY_UNAVAILABLE","status":503,"retryable":false,"detail":"Command execution is unavailable."}}
~~~

Preserve the exact existing invalid-input, unauthorized, integrity, changed-tag 409 and unconfirmed-persistence envelopes. A durable rejected row remains a refusal; it conveys no customer or command authority. Preserve recordNonMoneyRefusal, default real-pg adapter behavior, SERIALIZABLE execution, three total attempts, structured 40001/40P01 retry whitelisting and the default 50 ms backoff.

The previously provisioned target remains PostgreSQL 18.6 at 127.0.0.1:54339/kita_core_test with explicit KITA_REFUSAL_TEST_OWNER_URL and no fallback credentials. Preserve the separate KITA_REFUSAL_PG_TEST selection and KITA_PG_TEST=0 isolation. This HOLD authorizes no connection, fixture provisioning, migration application, reset, installation repair, history deletion, role change, setting change or test-target expansion. Keep credentials, URLs, password-bearing SQL and credential-bearing configuration/error objects out of evidence.

Preserve [the T-CORE-02 hold](T-CORE-02-BATCH.md), [the identity review](../SOL-IDENTITY-REVIEW.md), [the public OpenAPI freeze](OPENAPI-FREEZE.md) and the standing session-bind HOLD. Full T-CORE-01/T-CORE-02 acceptance, CP-00-11, PACK/REQ-SC/TEST and DEP-00-15 obligations remain unclosed. US-PH production readiness remains unapproved.

Standing roles remain: Cursor Grok coordinates sync/bundles/GitHub only; Astra/xhigh plans; Sol/max directs and independently reviews; Qoder CLI Efficient Agent Teams/subagents implement a separately approved batch on gpu-fqaf through ~/.coordinator/run-batch.sh. This documentation turn dispatches no swarm, implements no product code and performs no GitHub mutation, merge or deployment. Any later merge requires its own applicable review, tests and merge gates against the exact final head.

Documentation verification is limited to local source/reference review, the 005/006 source hashes, SQL checksum verification, whitespace and a tracked diff confined to NEXT-BATCH.md. No new PostgreSQL PASS or release-gate closure is claimed. Implementation allowlist remains []. Money closed. Never ok:true.
