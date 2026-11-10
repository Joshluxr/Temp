BATCH-OK

Authorize only the T-IDENTITY-01 checkIdentityBinding LIMITED PURE boolean-input fail-closed checker specified below. Full T-IDENTITY-01 remains HOLD. Money path closed. Never authorize ok: true, executeCommand, ledger posting, financial execution, persistence or real stores. T-CORE-02, T-FIN-01, T-LEDGER-02 and T-REWARD-01 remain HOLD; no implementation, scaffold or new checker for those tasks is authorized.

Reviewed baseline: e4e3888c1a71eed18aebe9510834ff3ffc5b18ef on cursor/kita-quote01-build-quote-05a3. T-QUOTE-01 buildQuote has landed. Its direct err/problem imports, Quote01Output = never and refusal branches preserve unauthorized / 403, LIMIT_EXCEEDED / 409, POLICY_UNAVAILABLE / 409, then dependency_unavailable / 503. Rechecked TEST-QUOTE-01: 8 passed. Together with TEST-AUTH-01 through TEST-AUTH-07, 22 tests passed across eight files (exit 0). These are refusal tests; they do not prove identity lifecycle, executable pricing, persistence or financial authority.

Review basis: [13-backlog.md](../13-backlog.md) T-IDENTITY-01 requires rejection of replay, expired challenge, wrong ownership, reused refresh token and unsafe return URI. M2 supplies unauthorized / 403, stale_or_conflicting_command / 409 and invalid_request / 400. [09-admin-security.md](../09-admin-security.md#i1-identity-and-authorization) requires session-bound one-use state, exact return-URI allowlisting and refresh reuse detection. A separate internal checker can refuse supplied blockers without authenticating, verifying evidence, detecting reuse, reading a clock, binding a session or touching a store. The existing bindSession, registerInstrument and document-access gates remain unchanged. No HTTP schema, error mapping or production command signature changes; existing customer-object concealment rules remain in force.

A missing tests/features/test-*.spec.ts file is an inventory observation, not proof that a task is unimplemented or that adding a checker can close it. Existing identity/schema, provider, migration, database and contract artifacts remain outside this batch. All 16 supplied leftover IDs lack their matching feature-test file at the reviewed head.

Remaining-task disposition for this batch:

| Task | Disposition | Reason / work still withheld |
|---|---|---|
| T-SCOPE-01 | HOLD | Source hashes, original-spec crosswalk and accountable scope review require actual source evidence; no source recovery or coverage claim is authorized. |
| T-CONTRACT-01 | HOLD | No freeze checker selected; full freeze needs reviewed wire/event/schema/port hashes, compatibility and ownership decisions. Existing freezeContracts success helper must not be imported, called or extended in this lane. |
| T-CORE-01 | HOLD | Existing database tests do not prove complete runtime/transaction composition; pool, role, retry and commit/rollback work requires real bindings outside this lane. |
| T-CORE-02 | HOLD | Explicitly prohibited; durable operation identity, atomic command/state/event/outbox/audit, holds, limits and fenced dispatch authority remain unproved. |
| T-LEDGER-02 | HOLD | Explicitly prohibited; posting templates, evidence authority, period enforcement, balances and allocation limits require approved durable financial controls. |
| T-IDENTITY-01 | BATCH-OK for the checker below only; full task HOLD | Supplied blockers may produce refusals only. Durable sessions, contacts, instruments, consents, refresh rotation/revocation and evidence-access grants remain withheld. |
| T-ADAPTER-01 | HOLD | No adapter checker selected; real transport/signature verification needs account-scoped contracts and evidence. Existing Unknown/quarantine gates must not be expanded or activated. |
| T-REWARD-01 | HOLD | Explicitly prohibited; paired points, lot reservations, expiry/reversal caps and the financial provision bridge depend on approved ledger authority. |
| T-MIG-01 | HOLD | No migration checker selected; actual archive hashes/dispositions, import/build reachability scans and consented data handling cannot be established by flags. Preserve the archive. |
| T-INTEGRATE-01 | HOLD | Connected features, exact artifacts, real-role/concurrency tests and independent financial reconstruction remain incomplete; no G1/G2 decision is authorized. |
| T-CERT-01 | HOLD | Provider/account/method certification requires real sandbox transcripts, native-device evidence and review; no G3 closure or provider call is authorized. |
| T-LIVE-01 | HOLD | Live-pilot authority, reconciled real positions, caps and approvals are absent from this batch; no pilot, G4 entry or G5 exit is authorized. |
| T-GA-01 | HOLD | Signed exact-scope launch evidence and G1-G5 prerequisites remain open; no G6 decision or exposure change is authorized. |
| T-BASE-01 | HOLD | No boundary checker selected; archive/root isolation and GPU-to-VM bundle integrity require actual path/hash evidence; this checker grants no handoff acceptance. |
| T-RELEASE-01 | HOLD | No release checker selected; exact-candidate proof completeness, freshness and approver validation remain open; no gate closure or activation is authorized. |
| T-FIN-01 | HOLD | Explicitly prohibited; immutable nonempty balanced journals, event replay/mismatch checks, permissions and independent reconstruction require real ledger controls. |

Only the T-IDENTITY-01 checker below is selected. Other HOLD rows exclude those tasks from this batch; they do not assert that every task is incapable of a future refusal-only slice. This document replaces the prior T-QUOTE-01 next-batch authorization, which has landed, and does not expand any landed checker. All full-feature holds, CP gaps, dependency/activation gates and release gates remain open. No production, live-pilot or G1-G6 closure is authorized.

Allowed implementation files only (paths relative to apps/kita/):

- packages/domain/identity/check-identity-binding.ts — create one standalone inert checkIdentityBinding checker; do not edit or wrap session-store.ts or another existing identity function.
- tests/features/test-identity-01.spec.ts — create focused TEST-IDENTITY-01 refusal tests only.
- packages/contracts/src/auth.ts — append only Identity01Input, Identity01Output and Identity01CommandContext type declarations; add WorkerContext to its existing type-only context import if needed. Preserve all existing types, functions, imports and behavior otherwise.

No other implementation file is allowed. In particular, packages/contracts/src/identity.ts, result.ts, index.ts, generated clients, existing tests, migrations, provider ports and all stores remain untouched. This planning update edits only docs/kita-plan/addenda/NEXT-BATCH.md; the returned implementation diff is measured from its coordinator-recorded implementation base and may contain only the three implementation paths above.

Exact required Identity01Input flags (all required; no optional or additional data fields):

```ts
readonly identityOwnershipMismatch: boolean;
readonly identityEvidenceReplayed: boolean;
readonly identityChallengeExpired: boolean;
readonly refreshTokenReused: boolean;
readonly unsafeReturnUri: boolean;
```

Flag meanings are supplied blockers only:

- identityOwnershipMismatch: a supplied mismatch between the attempted binding and its required identity/session/actor scope; no referenced object or actor payload is accepted.
- identityEvidenceReplayed: supplied already-consumed identity evidence, nonce or one-use state; no evidence or nonce is accepted or looked up.
- identityChallengeExpired: a supplied expired identity/contact challenge; no challenge, timestamp or clock access is accepted.
- refreshTokenReused: supplied reuse of a refresh token from a rotated or otherwise unusable generation; no token, family, generation record or detection callback is accepted.
- unsafeReturnUri: a supplied non-allowlisted or mismatched return URI; no URI, allowlist or redirect operation is accepted.

Do not derive these flags, validate identity, consume evidence, detect replay/reuse, perform ownership checks, evaluate a URI or consult another checker. False flags prove none of those controls and never grant authorization, authentication, KYC status, session eligibility, document access, instrument verification or financial authority. The blocker categories and ordered mappings are an internal refusal contract only; they are not new public error codes or customer-object responses.

Define Identity01Output = never. Define Identity01CommandContext as Pick<WorkerContext, 'workId' | 'attemptGeneration'>. The checker signature is checkIdentityBinding(ctx: Identity01CommandContext, input: Identity01Input): Promise<Result<Identity01Output, Problem>>. Both context fields are unused metadata and establish no identity, actor, book or command authority. Do not accept CommandContext, ReadContext, full WorkerContext, transaction runners, trace/capability/execution callbacks, dependencies or additional context fields.

Use type-only imports for Identity01 types from ../../contracts/src/auth.ts and Problem/Result from ../../contracts/src/result.ts. The only runtime import is the existing err/problem helpers from ../../contracts/src/result.ts. Never import the contracts runtime barrel, auth.ts runtime, unavailable helper, ok helper, freezeContracts, node:crypto, identity functions, money utilities, platform, providers or stores. Add no dependency, runtime schema or package/barrel export. Test imports may use vitest, the new checker and direct contract type paths (including UUID from context.ts); no contracts barrel.

Required behavior in this exact order; the first true blocker wins regardless of all lower-priority flags:

| Condition | Exact error code | HTTP status | retryable | Fixed detail |
|---|---|---|---|---|
| identityOwnershipMismatch === true | unauthorized | 403 | false | T-IDENTITY-01 supplied identity ownership mismatch blocks binding |
| Otherwise identityEvidenceReplayed === true | stale_or_conflicting_command | 409 | false | T-IDENTITY-01 supplied replayed identity evidence blocks binding |
| Otherwise identityChallengeExpired === true | stale_or_conflicting_command | 409 | false | T-IDENTITY-01 supplied expired identity challenge blocks binding |
| Otherwise refreshTokenReused === true | stale_or_conflicting_command | 409 | false | T-IDENTITY-01 supplied reused refresh token blocks binding |
| Otherwise unsafeReturnUri === true | invalid_request | 400 | false | T-IDENTITY-01 supplied unsafe return URI blocks binding |
| Otherwise (all five flags false) | dependency_unavailable | 503 | true | T-IDENTITY-01 checkIdentityBinding cannot verify identity or bind a session: identity stores and T-CORE-02 remain HOLD (fail closed) |

Return only failures with exactly { ok: false, error: { code, status, retryable, detail } }. Use the fixed, bounded, non-PII detail strings above verbatim. No extra branch, error code, value, operationId, fieldErrors, session/token/grant/permit, instrument/document reference, authority payload or other result field is permitted. All flags false still refuses with 503. retryable: true authorizes no automatic retry, scheduling, callback, command execution or provider request. Never claim an identity or URI was validated, replay/reuse was detected, a challenge consumed, a session bound, a token rotated/revoked or any access granted.

No persistence or store/database access, including real, test or in-memory substitute stores. No money arithmetic or money/ledger/points path; no executeCommand, posting, holds, approvals, balance mutation, reservation, transfer/operation creation or financial outcome. No authentication/IdP/JWKS/provider/network/credential call; token minting, exchange, hashing, encryption, rotation or revocation; session/contact/instrument/consent/document mutation; signed access link, redirect, cookie, storage, queue/outbox/timer, trace/log/audit emission or state transition. No clock, randomness, filesystem, environment reads, path/hash validation or archive scan in the checker. Accept no token, cookie, claims, URI, nonce, contact data, PAN/CVV, evidence, document, approval, command key/hash, policy, amount, currency, financial payload or additional identity fields. The two unused context metadata fields are the only identities accepted.

Do not change or wire API/controller/worker/UI routes, sessions, funding/instrument flows, mobile/web auth, provider adapters or any money workflow. No changes to runbooks, infrastructure, CI, package/configuration/dependencies, frozen OpenAPI, SQL, migrations, grants, source archives or migration manifests. No production activation, deployment, publication, live pilot, GitHub merge or G1-G6 closure is authorized. T-CORE-02/T-FIN-01/T-LEDGER-02/T-REWARD-01 implementation remains prohibited.

TEST-IDENTITY-01 must cover every one of the 32 boolean combinations in an explicit independently specified expected-results table. Expected code/status/retryable/detail must be literal expectations, not computed by copying the checker's if-chain or imported implementation constants. Include all 16 ownership-mismatch combinations, all 8 remaining replay combinations, all 4 remaining expiry combinations, both remaining refresh-reuse combinations, the sole remaining unsafe-URI combination and the all-false fallback. Assert the complete exact error-only result for every case, absence of value/extra success/access/authority fields, and identical refusal on a repeated call. Object.freeze each input and context, capture their values before calling, and verify both remain unchanged. Use no mocked store, fake token/evidence, identity workflow, provider implementation, clock or randomness.

Those tests establish only supplied-blocker precedence, deterministic refusal and input/context non-mutation. They do not satisfy full T-IDENTITY-01, PACK-IDENTITY/API/SECURITY, REQ-SC-14/15, actual replay/expiry/refresh-rotation or ownership enforcement, CP-01/06, identity lifecycle, any connected feature gate or G1-G6. Missing feature-test coverage is not closed by naming this file TEST-IDENTITY-01.

Validation required on the returned implementation head (commands run from apps/kita/):

```sh
./node_modules/.bin/vitest run tests/features/test-identity-01.spec.ts tests/features/test-quote-01.spec.ts tests/features/test-auth-01.spec.ts tests/features/test-auth-02.spec.ts tests/features/test-auth-03.spec.ts tests/features/test-auth-04.spec.ts tests/features/test-auth-05.spec.ts tests/features/test-auth-06.spec.ts tests/features/test-auth-07.spec.ts
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --noUncheckedIndexedAccess --exactOptionalPropertyTypes packages/contracts/src/auth.ts
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --noUncheckedIndexedAccess --exactOptionalPropertyTypes packages/domain/identity/check-identity-binding.ts
./node_modules/.bin/tsc --noEmit --project packages/contracts/tsconfig.json
./node_modules/.bin/tsc --noEmit --project packages/contracts/tsconfig.json --allowImportingTsExtensions
```

At the reviewed SHA, strict isolated auth.ts checking passes (exit 0). The unmodified contracts package check fails (exit 2) with 15 diagnostics: ten TS5097 import-extension diagnostics in auth.ts:15, freeze-contracts.ts:10 and index.ts:5-12; plus commands.ts:108 TS2502, commands.ts:345 TS2456, events.ts:78 TS2502, events.ts:125 TS2456 and events.ts:129 TS7006. With explicit --allowImportingTsExtensions the package check fails (exit 2) with those same five registry diagnostics. These are existing failing gates, not waived or passed checks. Preserve the diagnostic identities; line movement caused solely by the allowed type-only import/additions must be explained.

The new Identity01 types, checker and TEST-IDENTITY-01 do not yet exist and have not been tested. Require the 32 new refusal cases and all 22 reviewed quote/AUTH cases to pass, plus both strict isolated checks without diagnostics. Rerun and report both full package checks separately with their actual exit statuses and complete diagnostics. Do not suppress diagnostics, alter configuration, fix unrelated files or treat existing package failures as closed. Any new diagnostic, changed failure beyond explained allowed line movement, failed checker test, need for a store or scope expansion returns to Sol as BATCH-HOLD.

Inspect the complete final diff and imports for side effects, success/access/authority paths and changes outside the three allowed implementation paths. Return the coordinator-recorded base, exact implementation head, changed-file list and complete test/type-check outcomes for Codex Sol max review. No gate or full task closes merely because refusal tests pass.

Implementation follows the established roles: Qoder CLI Efficient Agent Teams/subagents on gpu-fqaf implement the authorized checker; coordinator handles sync/bundles/GitHub; Codex Sol max reviews the returned batch. This document authorizes only the specified limited checker; it does not start implementation, a swarm, a provider interaction or a store. If it cannot fit these constraints, stop the batch and report BATCH-HOLD with the reason. Money path closed; no production, live-pilot or G1-G6 approval.
