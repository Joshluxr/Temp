BATCH-OK

Authorize only the T-GROW-06 executeAutoConversion PURE boolean-input fail-closed checker specified below. This authorizes refusal paths only. Full T-GROW-06 delivery remains HOLD; the money path remains closed. T-CORE-02 remains HOLD.

Reviewed baseline: 9492c05671373e1d42225a99a7ff195ef0d1bde5 on cursor/kita-adm08-release-policy-05a3. Landed T-ADM-08 releasePolicy returns unauthorized / HTTP 403, then APPROVAL_STALE / HTTP 409, then VERSION_CONFLICT / HTTP 409, otherwise dependency_unavailable / HTTP 503. Rechecked TEST-ADM-08: 8 passed; combined TEST-ADM-08 / TEST-WAL-04 / TEST-GROW-05 / TEST-TX-10: 14 passed. These are checker tests, not financial integration evidence.

Basis: 13-backlog.md T-GROW-06 and 07-algorithms.md G10 require an explicit one-shot funded-wallet mandate, revoke-version checks, fresh executable terms within every bound, and atomic mandate/funds reservation. 06-api-contracts.md F1/F2 and its automation contract provide shared unauthorized/version/limit errors. 12-tests-gates.md M68 / SC-41 require revoked-before-reserve to win, with in-flight execution retained after dispatch and unknown outcomes never freed for another execution. A pure checker can refuse supplied denial conditions without deriving or proving any of these prerequisites. It cannot establish atomic ordering, reserve funds, or satisfy M68 / SC-41.

Holds remain: full T-GROW-06, T-ADM-08 and T-ADM-06 delivery; T-CORE-02, T-LEDGER-02, T-QUOTE-01, full T-WAL-04, T-GROW-05 and T-PLAT-05 delivery, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-TX-01, T-TX-05, T-TX-06, T-TX-10, T-FUND-02 and T-FUND-03. CP-03/CP-08 and DEP-12 remain unresolved for activation. No other hold or release gate is cleared. The fallback tasks T-PLAT-08 / T-EXT-02 / T-EXT-04 are not authorized in this batch because T-GROW-06 fits the limited scope.

Allowed implementation files only (paths relative to apps/kita/):

- packages/domain/schedules/execute-auto-conversion.ts — create the inert executeAutoConversion checker only.
- tests/features/test-grow-06.spec.ts — create focused TEST-GROW-06 denial tests only.
- packages/contracts/src/schedules.ts — additive Grow06Input, Grow06Output and Grow06CommandContext types only; preserve the existing Tx10 contracts unchanged.

Exact required Grow06Input flag names and types (no other data fields):

```ts
readonly revokedMandate: boolean;
readonly staleRevokeVersion: boolean;
readonly wouldViolateMandateBounds: boolean;
```

These are internal denial inputs, not HTTP fields, authenticated evidence or permission to spend. revokedMandate denotes a supplied revocation already effective before the proposed reservation; it never means an in-flight conversion was cancelled. staleRevokeVersion denotes a supplied mismatch against the mandate's current revocation/version state. wouldViolateMandateBounds denotes a supplied violation of the explicit currency-pair, net-rate/minimum-receive, source/fee/daily/total, expiry or one-shot execution-count bounds. The checker must not load a mandate, compare numeric rates/amounts, read a clock, evaluate balances/compliance, or derive any flag. Missing consent, an unverified prerequisite or an unknown execution outcome can never become permission through false flags.

Define Grow06Output = never. Define Grow06CommandContext as Pick<WorkerContext, 'workId' | 'attemptGeneration' | 'trace'>, reusing the existing WorkerContext import. The checker signature is executeAutoConversion(ctx: Grow06CommandContext, input: Grow06Input): Promise<Result<Grow06Output, Problem>>. Reuse existing err/problem helpers and ProblemCode values. Do not import the ok helper, add a runtime dependency or add a barrel export. Accept no execution callback, transaction runner, capability probe, mandate object/ID, quote, amount, rate, funds, accounts, journal lines or balances. The only permitted diagnostic effect is the existing redacted ctx.trace, if used, with fixed event name execute_auto_conversion_fail_closed and exactly these three boolean fields. No other callbacks or I/O are allowed.

Required behavior, evaluated in this order:

| Condition | Exact error code | HTTP status | retryable |
|---|---|---|---|
| revokedMandate === true, regardless of other flags | unauthorized | 403 | false |
| Otherwise staleRevokeVersion === true, including when wouldViolateMandateBounds is true | VERSION_CONFLICT | 409 | false |
| Otherwise wouldViolateMandateBounds === true | LIMIT_EXCEEDED | 409 | false |
| Otherwise | dependency_unavailable | 503 | true |

Return only ok: false failures, with fixed bounded non-PII details and no operationId or success payload. The 503 detail must state that mandate/schedule persistence and reservation/execution authority are unavailable and T-CORE-02 / T-LEDGER-02 remain HOLD. False flags never establish a live unrevoked mandate, a fresh quote, an available balance, compliance clearance, valid consent, an unconsumed occurrence or execution eligibility. Do not add COMPLIANCE_HOLD, INSUFFICIENT_FUNDS, RATE_STALE, POLICY_UNAVAILABLE or any other branch/code in this limited batch; those full-feature decisions remain unavailable. A 409 limit refusal must not claim that a mandate was armed, paused or modified.

No persistence or database/store access, including in-memory substitute stores. No ledger/journal posting, balance mutation, executeCommand, holds store, approval creation/consumption, provider/adapter call, queue/outbox/timer work, dispatch or financial execution. No mandate creation/arming/pausing/revocation/consumption, reservation/release, schedule_run or operation creation, quote creation/acceptance, conversion, consent/receipt issuance, notification or bank debit. No retry/inquiry scheduling or clearing of unknown/in-flight authority. Never authorize or return ok: true, command authority, a recorded state transition or a claim that a conversion or cancellation happened. Do not change API/controller/worker/UI wiring, frozen OpenAPI, migrations, permissions, existing checkers, package configuration or dependencies.

TEST-GROW-06 must cover all eight boolean combinations, both denial precedence rules, and exact code/status/retryable triples. Freeze every input and verify it is unchanged; every result must be error-only with no value, operationId, mandate/schedule/run/conversion identifier, armed/paused/revoked result, reservation, receipt or command authority. Check the 503 hold detail and, if tracing is used, the fixed name and exactly the three boolean fields. Use no mock store or simulated conversion implementation. These tests do not satisfy the full TEST-GROW-06 / M68 / SC-41 revoke-reservation race, quote/balance/compliance, one-shot/unknown, consent or provider gates.

Validation required on the returned implementation head (commands run from apps/kita/):

```sh
./node_modules/.bin/vitest run tests/features/test-grow-06.spec.ts tests/features/test-adm-08.spec.ts tests/features/test-wal-04.spec.ts tests/features/test-grow-05.spec.ts tests/features/test-tx-10.spec.ts
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --noUncheckedIndexedAccess --exactOptionalPropertyTypes packages/contracts/src/schedules.ts
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --noUncheckedIndexedAccess --exactOptionalPropertyTypes packages/domain/schedules/execute-auto-conversion.ts
./node_modules/.bin/tsc --noEmit --project packages/contracts/tsconfig.json
./node_modules/.bin/tsc --noEmit --project packages/contracts/tsconfig.json --allowImportingTsExtensions
```

Type-check baseline at the reviewed SHA: isolated schedules.ts passes strict checking. The unmodified contracts package check fails with 15 diagnostics: ten TS5097 import-extension diagnostics and five registry diagnostics. With the explicit --allowImportingTsExtensions command-line option, the package check fails with the five existing diagnostics in commands.ts (108 TS2502; 345 TS2456) and events.ts (78 TS2502; 125 TS2456; 129 TS7006). The same strict checker-inclusive command above, applied to the landed admin/release-policy.ts instead, also fails with those five diagnostics. Do not claim these checks pass, change tsconfig to hide them, suppress errors, waive a review gate or fix unrelated files in this authorization. Record the baseline failures separately; any new diagnostic or need to expand scope returns to Sol as BATCH-HOLD. The domain tsconfig includes only src and alone does not check this new schedules module.

Inspect final imports and diff for effects, forbidden success/authority paths and edits outside the three allowed implementation files. Return the exact implementation head, changed-file list and complete test/type-check outcomes for Codex Sol max review. Checker test success alone does not close the task or authorize money movement.

Implementation follows the established roles: Qoder CLI Efficient Agent Teams/subagents on gpu-fqaf implement the authorized checker; coordinator handles sync/bundles/GitHub; Codex Sol max reviews the returned batch. This document authorizes the next limited checker only and does not start implementation or a swarm. If it cannot fit these constraints, stop the batch and report BATCH-HOLD with the reason. T-CORE-02 remains HOLD.
