BATCH-OK

Authorize only the T-EXT-02 settleCustodyLeg PURE boolean-input fail-closed checker specified below. This authorizes refusal paths only. Full T-EXT-02 delivery remains HOLD; the money path remains closed. T-CORE-02 and T-LEDGER-02 remain HOLD.

Reviewed baseline: 7ed47be8c900a8c23058d5ea805bd0e0675befe0 on cursor/kita-plat08-recover-financial-authority-05a3. Landed T-PLAT-08 recoverFinancialAuthority returns unauthorized / HTTP 403, then stale_or_conflicting_command / HTTP 409, then PROVIDER_OUTCOME_UNKNOWN / HTTP 409, otherwise dependency_unavailable / HTTP 503. Reviewed its imports and refusal branches and rechecked TEST-PLAT-08: 8 passed. Combined TEST-PLAT-08 / TEST-GROW-06 / TEST-ADM-08 / TEST-FIN-05 / TEST-FIN-06 / TEST-EXT-01: 43 passed. These are checker tests, not financial, custody, settlement or recovery integration evidence.

Basis: 13-backlog.md T-EXT-02 requires wrong network, depeg and reorg never to produce available PHP cash, names CAPABILITY_UNAVAILABLE and PROVIDER_OUTCOME_UNKNOWN, and inherits M2 unauthorized errors. 07-algorithms.md G10 requires institutional custody, exact issuer/contract/network/decimals and atomic units, allowlisted destinations, separate custody/chain/off-ramp/fiat states, and signed chain/finality/custodian policies. 12-tests-gates.md M74/M75 and SC-51 prohibit PHP availability from provisional chain status and alternate-chain retry. 14-external-deps.md DEP-11 keeps stablecoin treasury disabled pending separate approvals. A pure checker can refuse supplied blockers without establishing any prerequisite. The exact branch mapping below applies only to this internal checker; it changes no frozen HTTP contract and implements no custody or settlement protocol.

All previously held tasks and release/activation gates remain HOLD, including full T-PLAT-08, T-GROW-06, T-ADM-08 and T-EXT-02 delivery, T-CORE-02, T-LEDGER-02, CP-08/CP-09 closure and DEP-11 activation. T-EXT-04 is not authorized because T-EXT-02 fits this limited scope. No dependency, production or money-path gate is cleared.

Allowed implementation files only (paths relative to apps/kita/):

- packages/domain/treasury/settle-custody-leg.ts — create the inert settleCustodyLeg checker only.
- tests/features/test-ext-02.spec.ts — create focused TEST-EXT-02 denial tests only.
- packages/contracts/src/treasury.ts — additive Ext02Input, Ext02Output and Ext02CommandContext types only; preserve all existing imports and Fin05/Fin06 contracts.

Exact required Ext02Input flag names and types (no other data fields):

```ts
readonly unauthorizedCustodyMovement: boolean;
readonly assetOrNetworkPolicyMismatch: boolean;
readonly depegOrReorgDetected: boolean;
readonly settlementUncertain: boolean;
```

These are internal denial inputs, not HTTP fields, authenticated evidence or settlement attestations. unauthorizedCustodyMovement denotes a supplied absence or invalidity of the required current, scope-bound institutional treasury authorization. assetOrNetworkPolicyMismatch denotes a supplied mismatch against required asset issuer/contract/network/decimals, atomic-unit policy or destination/network allowlist, or absence of the required signed asset/network policy. depegOrReorgDetected denotes a supplied depeg stop or chain-reorganization blocker. settlementUncertain denotes supplied unresolved custody/chain/off-ramp/fiat settlement, including provisional or insufficient finality, custody mismatch or unconfirmed actual PHP settlement. Missing or pending local/chain evidence never proves nonpayment or available fiat. The checker must not derive these flags, inspect approvals or policies, calculate depeg/finality thresholds, parse chain or fiat evidence, read a clock, query a provider or load financial state.

Define Ext02Output = never. Define Ext02CommandContext as Pick<WorkerContext, 'workId' | 'attemptGeneration'> using the existing type-only WorkerContext import in treasury.ts. The checker signature is settleCustodyLeg(ctx: Ext02CommandContext, input: Ext02Input): Promise<Result<Ext02Output, Problem>>. Context identity is unused and never establishes authority. Use type-only imports for Ext02 types from ../../contracts/src/treasury.ts and Problem/Result from ../../contracts/src/result.ts; import only the existing err/problem runtime helpers from ../../contracts/src/result.ts. Do not import the contracts runtime barrel or ok helper, add a dependency, or edit package/barrel exports. Accept no trace/capability/execution callback, transaction runner, store, evidence/policy payload, approval, credential, address, hash/nonce, account, asset/amount/decimals, balance or journal line. This checker has no diagnostic callback or other I/O; it only returns a Problem.

Required behavior, evaluated in this order:

| Condition | Exact error code | HTTP status | retryable |
|---|---|---|---|
| unauthorizedCustodyMovement === true, regardless of other flags | unauthorized | 403 | false |
| Otherwise assetOrNetworkPolicyMismatch === true, regardless of remaining flags | CAPABILITY_UNAVAILABLE | 409 | false |
| Otherwise depegOrReorgDetected === true, including when settlementUncertain is true | CAPABILITY_UNAVAILABLE | 409 | false |
| Otherwise settlementUncertain === true | PROVIDER_OUTCOME_UNKNOWN | 409 | false |
| Otherwise | dependency_unavailable | 503 | true |

CAPABILITY_UNAVAILABLE denotes a supplied inadmissible custody policy or depeg/reorg blocker; it must not claim a live capability was disabled or liquidity was frozen. PROVIDER_OUTCOME_UNKNOWN denotes supplied uncertainty only; it must not claim an authenticated provider outcome was established or durably recorded. Neither error permits fresh-key, alternate-chain or provider retry.

Return only ok: false failures with exactly a bounded, fixed, non-PII Problem and no value, operationId, fieldErrors or success payload. Use these fixed detail strings in table order:

- T-EXT-02 institutional custody movement is not authorized
- T-EXT-02 custody asset or network policy mismatch blocks settlement
- T-EXT-02 depeg or reorganization blocks custody settlement
- T-EXT-02 custody or fiat settlement remains uncertain; no available PHP cash is established
- T-EXT-02 settleCustodyLeg cannot persist custody or fiat settlement or grant financial authority: T-CORE-02 and T-LEDGER-02 remain HOLD; DEP-11 is not cleared (fail closed)

False flags never establish valid authorization, approved asset/network policy, correct units, finality, resolved outcomes, settled fiat or spendable PHP. Even all flags false must return the 503 refusal. retryable: true on that refusal permits no automatic settlement execution, inquiry scheduling, provider retry or new-key submission. Do not add another error branch/code or any successful custody/chain/off-ramp/fiat payload. No result may attest that a live gate is closed, assets are frozen, a movement was recorded or money was settled.

No persistence or database/store access, including in-memory substitute stores. No ledger/journal posting, balance mutation, executeCommand, holds store, approval creation/consumption, provider/custody/chain/adapter call, signing, credential operation, queue/outbox/timer work, inquiry, dispatch or financial execution. No minting, transfer, on-ramp/off-ramp, atomic-unit/fiat conversion, liquidity reservation/release/freeze, finality advancement, reorg reversal, compensating event, reconciliation receipt or settlement-state transition. Never authorize or return ok: true, command authority, available PHP cash or a recorded financial outcome. Do not change API/controller/worker/UI wiring, providers, runbooks, Terraform, CI, frozen OpenAPI, migrations, permissions, existing checkers, package configuration or dependencies.

TEST-EXT-02 must cover all sixteen boolean combinations with exact code/status/retryable/detail values, all precedence rules, and the all-false 503. Object.freeze every input and context and verify they remain unchanged; repeat every case and assert the same refusal. Assert the exact error-only result shape in every case, with no extra fields, value, operationId, authority, receipt, settled/frozen/final assertion, balance or available-cash payload. Use no mock store or simulated custody/chain/provider implementation. These tests do not satisfy full TEST-EXT-02, M74/M75, SC-51, PACK-PROVIDER, CP-08/CP-09 or DEP-11: authentic asset/network and allowlist validation, atomic units, transaction/nonce deduplication, finality/reorg/depeg controls, separate custody/off-ramp/fiat accounting, real PHP settlement and funded fiat refunds remain unimplemented and HOLD.

Validation required on the returned implementation head (commands run from apps/kita/):

```sh
./node_modules/.bin/vitest run tests/features/test-ext-02.spec.ts tests/features/test-plat-08.spec.ts tests/features/test-grow-06.spec.ts tests/features/test-adm-08.spec.ts tests/features/test-fin-05.spec.ts tests/features/test-fin-06.spec.ts tests/features/test-ext-01.spec.ts
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --noUncheckedIndexedAccess --exactOptionalPropertyTypes packages/contracts/src/treasury.ts
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --noUncheckedIndexedAccess --exactOptionalPropertyTypes packages/domain/treasury/settle-custody-leg.ts
./node_modules/.bin/tsc --noEmit --project packages/contracts/tsconfig.json
./node_modules/.bin/tsc --noEmit --project packages/contracts/tsconfig.json --allowImportingTsExtensions
```

Type-check baseline rechecked at the reviewed SHA: the strict treasury.ts command passes. The unmodified contracts package check fails with 15 diagnostics: ten TS5097 import-extension diagnostics and five registry diagnostics. With explicit --allowImportingTsExtensions it fails with the five existing diagnostics in commands.ts (108 TS2502; 345 TS2456) and events.ts (78 TS2502; 125 TS2456; 129 TS7006). Strict checking of the landed platform/recover-financial-authority.ts fails with those three existing events.ts diagnostics. The new checker and TEST-EXT-02 do not yet exist and have not been run. Both strict treasury.ts and new checker checks must pass on the returned head; rerun and report the full package checks separately. Do not claim failing checks pass, change config to hide them, suppress errors, waive a review gate or fix unrelated files. Any new diagnostic or need to expand scope returns to Sol as BATCH-HOLD.

Inspect final imports and diff for effects, forbidden success/authority paths and edits outside the three allowed implementation files. Return the exact implementation head, changed-file list and complete test/type-check outcomes for Codex Sol max review. Checker test success alone does not close the task or authorize money movement.

Implementation follows the established roles: Qoder CLI Efficient Agent Teams/subagents on gpu-fqaf implement the authorized checker; coordinator handles sync/bundles/GitHub; Codex Sol max reviews the returned batch. This document authorizes the next limited checker only and does not start implementation or a swarm. If it cannot fit these constraints, stop the batch and report BATCH-HOLD with the reason. T-CORE-02 remains HOLD.
