BATCH-OK

Authorize only the T-EXT-04 executeBatch PURE boolean-input fail-closed checker specified below. This authorizes refusal paths only. Full T-EXT-04 delivery remains HOLD; the money path remains closed. T-CORE-02 and T-LEDGER-02 remain HOLD. Never authorize ok: true, ledger work, executeCommand or real stores.

Reviewed baseline: d7f01e6fc2055051e8635bbe9fe1238af4c4800d on cursor/kita-ext02-settle-custody-leg-05a3, the supplied PR #101 head. Reviewed the landed T-EXT-02 imports, contracts and refusal branches: unauthorized / HTTP 403, asset/network mismatch or depeg/reorg CAPABILITY_UNAVAILABLE / HTTP 409, settlement uncertainty PROVIDER_OUTCOME_UNKNOWN / HTTP 409, otherwise dependency_unavailable / HTTP 503. Rechecked TEST-EXT-02: 16 passed. Together with TEST-EXT-03, TEST-ADM-05, TEST-TX-01, TEST-PLAT-08, TEST-GROW-06, TEST-ADM-08, TEST-FIN-05, TEST-FIN-06 and TEST-EXT-01, 67 tests passed across ten files in two runs. These are checker tests, not batch, financial, custody or settlement integration evidence.

Basis: 13-backlog.md T-EXT-04 requires approval bound to ordered items and currency totals, immutable paid items and retries restricted to proven unsubmitted items. It names APPROVAL_STALE and LIMIT_EXCEEDED and inherits M2 unauthorized and stale/conflicting-command errors. 07-algorithms.md G10 requires KYB/signatory authority, protected encrypted CSV, item-specific drafts/quotes/allocations and normal dispatch gates; changes invalidate aggregate approval. 12-tests-gates.md M72/M73 and SC-52 require exact approval binding and prohibit repeating paid items after a partial batch/crash. F2 in 06-api-contracts.md distinguishes PROVIDER_OUTCOME_UNKNOWN from ordinary retryable rejection. DEP-12 in 14-external-deps.md keeps this product disabled pending its separate approvals. A pure checker can refuse supplied blockers without establishing any prerequisite. The exact mapping below is internal only; it changes no frozen HTTP contract and implements no batch or payout protocol.

All previously held tasks and release/activation gates remain HOLD, including full T-EXT-02, T-EXT-03 and T-EXT-04 delivery, T-TX-01, T-ADM-05, T-CORE-02, T-LEDGER-02, CP-08/CP-09 closure, DEP-11 and DEP-12 activation. T-QUOTE-01 is not authorized because T-EXT-04 fits this limited scope. No dependency, production or money-path gate is cleared. This document replaces the prior next-checker authorization; it does not expand the landed EXT-02 checker.

Allowed implementation files only (paths relative to apps/kita/):

- packages/domain/business/execute-batch.ts — create the inert executeBatch checker only.
- tests/features/test-ext-04.spec.ts — create focused TEST-EXT-04 denial tests only.
- packages/contracts/src/business.ts — additive Ext04Input, Ext04Output and Ext04CommandContext types only; add WorkerContext to the existing type-only context.ts import and preserve all Ext03 imports and contracts.

Exact required Ext04Input flag names and types (no other data fields):

```ts
readonly unauthorizedBatchExecution: boolean;
readonly approvalStale: boolean;
readonly limitExceeded: boolean;
readonly paidItemWouldBeRetried: boolean;
readonly itemSubmissionUncertain: boolean;
```

These are internal denial inputs, not HTTP fields, authenticated evidence or approval/dispatch attestations:

- unauthorizedBatchExecution denotes a supplied absence or invalidity of required current, scope-bound business KYB/signatory execution authorization. Personal KYC and a second login of the same person cannot supply that authority.
- approvalStale denotes a supplied stale, invalidated or mismatched approval binding, including a change to CSV contents, ordered item/quote hashes, target versions or aggregate currency totals.
- limitExceeded denotes a supplied item or aggregate limit breach. It carries no amount, currency, threshold or policy payload.
- paidItemWouldBeRetried denotes a supplied attempt to include an already-paid item in a rerun/retry, including under a fresh item or command identity.
- itemSubmissionUncertain denotes supplied unresolved, unknown, pending or possibly submitted item execution, including absence of definitive evidence that a candidate item is unsubmitted. A timeout, missing local record or lack of a paid status never proves nonpayment or safe resubmission.

The checker must not derive these flags, authenticate signatories, inspect or consume approvals, parse CSV, hash or compare rows/quotes, sum currency totals, evaluate policies/limits, read a clock, query a provider or load batch/financial state. False flags never prove valid KYB, current approval, valid quotes, limits compliance, an unpaid/unsubmitted item or retry eligibility. No combination grants authority.

Define Ext04Output = never. Define Ext04CommandContext as Pick<WorkerContext, 'workId' | 'attemptGeneration'> using a type-only import from ./context.ts. The checker signature is executeBatch(ctx: Ext04CommandContext, input: Ext04Input): Promise<Result<Ext04Output, Problem>>. Context identity is unused and never establishes authority. Use type-only imports for Ext04 types from ../../contracts/src/business.ts and Problem/Result from ../../contracts/src/result.ts; import only the existing err/problem runtime helpers from ../../contracts/src/result.ts. Do not import the contracts runtime barrel, ok helper, existing business checker or platform implementation. Add no dependency or package/barrel export.

Accept no trace/capability/execution callback, transaction runner, store, worker payload, business/batch/item/operation identity, CSV/file, quote/hash, evidence, approval, credential, account, amount/currency, balance or journal line. The two context identity fields above are the only context fields. This checker has no diagnostic callback or other I/O; it only returns a Problem. Do not copy the trace callback or success-shaped output contracts from older checkers into this lane.

Required behavior, evaluated in this exact order:

| Condition | Exact error code | HTTP status | retryable |
|---|---|---|---|
| unauthorizedBatchExecution === true, regardless of other flags | unauthorized | 403 | false |
| Otherwise approvalStale === true, regardless of remaining flags | APPROVAL_STALE | 409 | false |
| Otherwise limitExceeded === true, regardless of remaining flags | LIMIT_EXCEEDED | 409 | false |
| Otherwise paidItemWouldBeRetried === true, including when itemSubmissionUncertain is true | stale_or_conflicting_command | 409 | false |
| Otherwise itemSubmissionUncertain === true | PROVIDER_OUTCOME_UNKNOWN | 409 | false |
| Otherwise | dependency_unavailable | 503 | true |

Return only ok: false failures with exactly a bounded, fixed, non-PII Problem and no value, operationId, fieldErrors or success payload. Use these fixed detail strings in table order:

- T-EXT-04 batch execution is not authorized
- T-EXT-04 batch approval is stale or no longer binds the ordered items and currency totals
- T-EXT-04 supplied item or aggregate limit breach blocks batch execution
- T-EXT-04 a paid batch item cannot be retried
- T-EXT-04 item submission remains uncertain; no retry is authorized
- T-EXT-04 executeBatch cannot persist batch or item state or grant payout authority: T-CORE-02 and T-LEDGER-02 remain HOLD; DEP-12 is not cleared (fail closed)

The 403/409 errors describe supplied blockers only; they do not attest that live authorization, approval invalidation, a limit decision, a paid item or a provider outcome was authenticated, stored or enforced. PROVIDER_OUTCOME_UNKNOWN records nothing durably and permits no new-key submission or provider retry. Even all flags false must return the 503 refusal. retryable: true on that refusal permits no automatic execution, retry scheduling, inquiry or submission. Add no other branch/code or batch/item result. No result may claim that an item was preserved, paid, rolled back, resumed, safely retried or recorded, or that a live gate was enforced.

No persistence or database/store access, including in-memory substitute stores. No ledger/journal posting, balance mutation, executeCommand, holds store, approval creation/consumption, KYB or signatory update, provider/adapter call, credential operation, queue/outbox/timer work, inquiry, dispatch or financial execution. No batch/item/transfer creation, status transition, partial-result aggregation, quote construction/acceptance, currency arithmetic, allocation, reservation/release, deduplication record, fresh identity or compensating event. Never authorize or return ok: true, command authority, payout eligibility, a dispatch/retry permit or a recorded financial outcome. Do not change API/controller/worker/UI wiring, providers, runbooks, Terraform, CI, frozen OpenAPI, migrations, permissions, existing checkers, package configuration or dependencies.

TEST-EXT-04 must cover all 32 boolean combinations with exact code/status/retryable/detail values, every precedence rule and the all-false 503. Object.freeze every input and context and verify they remain unchanged; repeat every case and assert the same refusal. Assert the exact error-only result shape in every case, with no extra fields, value, operationId, authority, permit, per-item result, receipt, paid/preserved assertion, balance or payout payload. Use no mock store, simulated batch workflow or provider implementation. These tests do not satisfy full TEST-EXT-04, M72/M73, SC-52, PACK-AUTOMATION, PACK-PROVIDER, PACK-API, CP-08/CP-09 or DEP-12: authentic KYB/signatory checks, protected CSV validation, exact ordered approval binding, item quotes/currency totals, durable item identities/states, normal financial gates, paid-item immutability and crash-safe partial-batch retry remain unimplemented and HOLD.

Validation required on the returned implementation head (commands run from apps/kita/):

```sh
./node_modules/.bin/vitest run tests/features/test-ext-04.spec.ts tests/features/test-ext-02.spec.ts tests/features/test-ext-03.spec.ts tests/features/test-adm-05.spec.ts tests/features/test-tx-01.spec.ts tests/features/test-plat-08.spec.ts tests/features/test-grow-06.spec.ts tests/features/test-adm-08.spec.ts tests/features/test-fin-05.spec.ts tests/features/test-fin-06.spec.ts tests/features/test-ext-01.spec.ts
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --noUncheckedIndexedAccess --exactOptionalPropertyTypes packages/contracts/src/business.ts
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --noUncheckedIndexedAccess --exactOptionalPropertyTypes packages/domain/business/execute-batch.ts
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --noUncheckedIndexedAccess --exactOptionalPropertyTypes packages/contracts/src/treasury.ts packages/domain/treasury/settle-custody-leg.ts
./node_modules/.bin/tsc --noEmit --project packages/contracts/tsconfig.json
./node_modules/.bin/tsc --noEmit --project packages/contracts/tsconfig.json --allowImportingTsExtensions
```

Type-check baseline rechecked at the reviewed SHA: strict treasury.ts plus settle-custody-leg.ts passes. Strict business.ts fails before any EXT-04 change with three existing events.ts diagnostics (78 TS2502; 125 TS2456; 129 TS7006), reached through its existing WorkerIdentity type import from platform.ts. The unmodified contracts package check fails with 15 diagnostics: ten TS5097 import-extension diagnostics and five registry diagnostics. With explicit --allowImportingTsExtensions it fails with the five existing diagnostics in commands.ts (108 TS2502; 345 TS2456) and events.ts (78 TS2502; 125 TS2456; 129 TS7006).

The new checker, types and TEST-EXT-04 do not yet exist and have not been tested. All checker tests and the strict treasury/custody check must pass on the returned head. Strict business.ts and the new checker must introduce no diagnostics beyond the unchanged three-event baseline above; report each actual exit status and diagnostic. Rerun and report both full package checks separately. Existing failures remain failing gates; this authorization does not mark them passed or close them. Do not change configuration, suppress diagnostics, waive a review gate or fix unrelated files. Any new diagnostic, failed checker test, changed baseline failure or need to expand scope returns to Sol as BATCH-HOLD.

Inspect final imports and the complete diff for effects, forbidden success/authority paths and edits outside the three allowed implementation files. Return the exact implementation head, changed-file list and complete test/type-check outcomes for Codex Sol max review. Checker test success alone does not close the task or authorize money movement. No GitHub merge, publication or deployment is authorized.

Implementation follows the established roles: Qoder CLI Efficient Agent Teams/subagents on gpu-fqaf implement the authorized checker; coordinator handles sync/bundles/GitHub; Codex Sol max reviews the returned batch. This document authorizes the next limited checker only and does not start implementation or a swarm. If it cannot fit these constraints, stop the batch and report BATCH-HOLD with the reason. T-CORE-02 remains HOLD.
