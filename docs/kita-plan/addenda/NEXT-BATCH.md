BATCH-HOLD

Source base: 416594d24aac7dcc1be16e4e52dfb34eabee8a6a (416594d), confirmed as local HEAD on `cursor/kita-core02-refusal-pg-evidence-05a3`; operator-designated [PR #128](https://github.com/Joshluxr/Temp/pull/128).

Implementation allowlist: []

SQL/application consent-persistence allowlist: []

Refusal helper/suite fix allowlist: []

No next implementation batch is authorized. This handoff replaces the previous BATCH-OK. Its two-file T-GROW-08 CONTRACT ONLY batch has landed; that allowlist is exhausted and no earlier allowlist carries forward. This documentation turn rewrites only `docs/kita-plan/addenda/NEXT-BATCH.md`. It dispatches no Qoder work.

The landed normative contract remains `T-GROW-08/consent-persistence/v1` in [T-GROW-08-CONSENT-PERSISTENCE-CONTRACT.md](T-GROW-08-CONSENT-PERSISTENCE-CONTRACT.md), with type-only declarations in `apps/kita/packages/contracts/src/communication-consent-persistence.ts`. Preserve both files unchanged, without barrel exports, runtime imports, validators, factories, resolvers, stubs or application wiring. Contract completion establishes specification only; it does not establish persisted customer preferences, trusted evidence, TEST-GROW-08 closure or implementation permission.

Precise blocker: no genuine trusted customer-session evidence producer/verifier or bound customer-instruction evidence issuer exists at 416594d. The contract requires server-side possession verification of an already bound customer session under the frozen `customerBearer` or `customerSession` plus CSRF/origin rules, current revocation/expiry checks and authoritative same-customer/book ownership. It also requires an immutable, single-use instruction record bound to that authority, the exact normalized replacement and expected version, operation, key, governing document and expiry. Type declarations for `authorityRef`, `SessionAuthorityEvidence`, `instructionEvidenceRef` or `CustomerInstructionEvidence` produce none of this proof.

The existing `apps/kita/packages/domain/identity/session-store.ts` still returns `err(unavailable('bindSession'))`; session bind remains expressly HOLD. `applyCommunicationConsent` remains a fail-closed checker over `marketingCampaignDespiteOptOut` and a worker-only `Grow07CommandContext`, not a customer authority source or persistence implementation. An OIDC claim object, decoded token, raw session ID, session table row, worker identity, caller ownership/verification boolean, fixture or seeded evidence cannot unlock the store. The refusal login/OID binding authorizes only its fixed refusal-service scope in a disabled book; it cannot authorize a customer preference write. No owner-login bypass, broad grant, superuser connection, role switch or fabricated customer/session/KYC evidence is permitted.

The contract also leaves storage prerequisites unresolved: same-customer/book preference-to-consent enforcement, immutable ownership, single-use instruction consumption, scoped terminal receipts, restricted persistence authority, approved book preference-write scope, atomic audit locking and bounded settlement/cleanup. Existing DDL and a frozen OpenAPI do not supply these primitives or trusted possession evidence. SQL/application consent persistence remains HOLD even if a proposed implementation merely adds another unavailable stub. No migration, schema scaffold, privilege design, first-row provisioning, unsubscribe-token flow, evidence producer or public route is authorized by this handoff.

To reconsider a production consent slice, a later review must first establish a genuine trusted evidence producer and its executable provenance/possession/ownership path, without treating this HOLD as permission to activate session bind. A new handoff must then name an exact source base and finite file allowlist, settle the storage/authority/audit/settlement prerequisites, disposition the open refusal findings below and require independent committed-row, consent, receipt and audit evidence. It must cover replay and changed-body conflict, version and evidence conflicts, revoked/foreign/cross-book authority, missing dependencies, concurrent calls, rollback at each write boundary, lost-COMMIT recovery and cleanup failures through directly authenticated restricted connections. The landed contract supplies the normative details; it grants no automatic implementation phase.

Money closed. Never ok:true, including internal receipts and replays. No executeCommand or money_operations access. Session bind and bindSession activation remain HOLD, including session/token creation, rotation and revocation. Identity/KYC success, financial execution, posting, rewards and provider calls remain HOLD. No general T-CORE-02 or T-IDENTITY-01 authorization. Runtime activation, live traffic, deployment, integration acceptance, certification, pilot, launch and G1-G6 closure remain HOLD. Marketing opt-out and necessary lawful service-notice requirements remain explicit in the landed contract; no sending capability or suppression of necessary notices is authorized.

The two open refusal test/helper findings remain open and frozen. The operator's previous report of 27 passing PostgreSQL cases is attributed evidence only; it does not close these findings or establish their failure-path coverage. Paths in the following table are relative to `apps/kita/packages/database/`.

| Open finding | Required disposition; no repair authorized here |
|---|---|
| `__tests__/helpers/non-money-refusal-pg.ts` swallows owner-client end failures, including after successful connects/queries; partial fixture provisioning lacks complete credential-free cleanup accounting before a fixture object is returned. | Preserve primary failures and retain secondary cleanup failures; fail an otherwise successful path when cleanup fails. Account for partial setup without leaking URLs, secrets, password-bearing SQL or configuration/error objects. The helper remains frozen. |
| `__tests__/non-money-refusal-atomicity-postgres.spec.ts` lacks immediate rejection handling for gates and started calls; cleanup can reject unused gates, and suite-owned observer connects still occur outside cleanup coverage. | Retaining a promise in `pending` is not rejection handling or complete settlement. Every started operation and acquired resource needs accounted settlement/closure without masking primary or secondary failures. The suite remains frozen. |

Additional atomicity acceptance gaps also remain open: actual-login OID/attributes/effective membership and immutable principal bindings; distinct backend identities; statement/lock/deadlock setting assertions; the full database/two-integer advisory-lock namespace and unexpected participants; complete survivor row contents before victim retry; and full per-attempt transaction/release ordering. A passing count cannot replace these assertions. No finding is downgraded or declared fixed by this documentation rewrite.

Preserve the 0ecda66 repairs: acquisition counts follow actual checkout; transaction/release events follow completion; both first-attempt backend identities are retained; the native 40P01 event identifies the victim; victim release precedes an independent row/lock checkpoint before survivor commit; application-pool closes and returned fixture-pool close promises are awaited. Shared owner-connect cleanup coverage already present must not regress. Preserve all 27 existing PostgreSQL cases, native-constructor and offline refusal regressions without removal, weakening, splitting or skipping to present acceptance. Any helper/suite repair requires its own later reviewed finite allowlist and preserves every refusal/SQL/wire freeze below.

Preserve these exact source hashes:

| File | SHA-256 |
|---|---|
| `apps/kita/packages/database/migrations/005_non_money_refusal.sql` | `1a6b1f45f9fe5d6b29dee3a7bb58146dcc58154530ac9145b7da37c11ac55e07` |
| `apps/kita/packages/database/migrations/006_non_money_refusal_conflict.sql` | `faffadc5a42d024a425e6c39ac0855c2fa02fa5365aa55fef64a0befecdc10c7` |
| `docs/kita-plan/openapi/kita-v1.yaml` | `f8f98d45c4c09098412da2504ed140211471859b3dee2be1d27be724d65eb49c` |
| `docs/kita-plan/addenda/T-GROW-08-CONSENT-PERSISTENCE-CONTRACT.md` | `81d2e5377083be37927b148ea813dcde5b8c4f3149fde26a71b21527e79ef044` |
| `apps/kita/packages/contracts/src/communication-consent-persistence.ts` | `98506d7023ae93fac690f830fd5a209a950b16d1c13c18a02e3480dbed5aa8db` |

Preserve the installed 001 + 004 + 005 + 006 refusal state: `kita.record_non_money_refusal(text,text)`, returning jsonb, its OID, owner `kita_refusal_definer`, LANGUAGE plpgsql, SECURITY DEFINER, fixed `search_path = pg_catalog, pg_temp` and ACLs. Its catalog prosrc remains pinned to 3950 UTF-8 bytes and SHA-256 `a6140caff93ff7a014ee33ae6c32bb669f8bd75322580fdaafc9c3179f76898a`, including surrounding newlines. Preserve immutable principal bindings, scoped uniqueness, reserved-row shape and both enabled immutability triggers. These are preservation requirements, not a fresh catalog inspection.

The committed stored refusal remains exactly:

~~~json
{"ok":false,"error":{"code":"CAPABILITY_UNAVAILABLE","status":503,"retryable":false,"detail":"Command execution is unavailable."}}
~~~

Preserve the exact existing invalid-input, unauthorized, integrity, changed-tag 409 and unconfirmed-persistence envelopes; `recordNonMoneyRefusal`; default real-pg behavior; SERIALIZABLE execution; three total attempts; structured 40001/40P01 retry whitelisting; and the default 50 ms backoff. A durable rejected row conveys no customer, session or command authority.

Freeze every implementation, test/helper, contract/export, route, worker, runtime configuration, manifest, lockfile and dependency. Freeze every migration, every 001 copy, `apps/kita/sql/CHECKSUMS.txt`, migration ledger, protected plan and historical review. Add no schema object, privilege, fixture, checker, generated report or repository evidence artifact. Preserve unrelated tracked and untracked work. This turn edits only NEXT-BATCH.md; implementation, consent SQL/app and helper/suite allowlists remain empty.

The previously provisioned refusal target remains PostgreSQL 18.6 at `127.0.0.1:54339/kita_core_test`, with explicit `KITA_REFUSAL_TEST_OWNER_URL` and no fallback credentials. Preserve separate `KITA_REFUSAL_PG_TEST` selection and `KITA_PG_TEST=0` isolation. This HOLD authorizes no database connection, fixture provisioning, migration application, reset, repair, history deletion, role/setting change or target expansion. Credentials and connection URLs stay out of evidence.

Preserve [the T-CORE-02 hold](T-CORE-02-BATCH.md), [the identity review](../SOL-IDENTITY-REVIEW.md), [the public OpenAPI freeze](OPENAPI-FREEZE.md) and the standing session-bind HOLD. `docs/kita-plan/openapi/kita-v1.yaml` remains the authoritative public wire; no new endpoint, method, request/response field or alias is authorized. Full T-CORE-01/T-CORE-02 acceptance, CP-00-11, PACK/REQ-SC/TEST and DEP-00-15 obligations remain unclosed. US-PH production readiness remains unapproved.

Standing roles remain: Cursor Grok coordinates sync/bundles/GitHub only; Astra/xhigh plans; Sol/max directs and independently reviews; Qoder CLI Efficient Agent Teams/subagents implement only a separately authorized finite allowlist on gpu-fqaf through `~/.coordinator/run-batch.sh`. This turn dispatches no swarm, implements no product code and performs no GitHub mutation, merge or deployment. Any later merge requires applicable review, tests and merge gates against the exact final head.

Documentation verification for this rewrite is limited to local source/reference review, the listed source hashes, existing SQL checksum verification, whitespace and a tracked diff confined to NEXT-BATCH.md. No fresh application test, typecheck, PostgreSQL run, database inspection, independent runtime-log review, persistence PASS, merge approval or release-gate closure is claimed. Implementation allowlist remains []. Money closed. Never ok:true.
