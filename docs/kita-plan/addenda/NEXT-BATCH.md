BATCH-OK

Authorize only the T-PLAT-08 recoverFinancialAuthority PURE boolean-input fail-closed checker specified below. This authorizes refusal paths only. Full T-PLAT-08 delivery remains HOLD; the money path remains closed. T-CORE-02 and T-LEDGER-02 remain HOLD.

Reviewed baseline: 724c4ff2e13310333194e2be4b3b5559b06dff6b on cursor/kita-grow06-execute-auto-conversion-05a3. Landed T-GROW-06 executeAutoConversion returns unauthorized / HTTP 403, then VERSION_CONFLICT / HTTP 409, then LIMIT_EXCEEDED / HTTP 409, otherwise dependency_unavailable / HTTP 503. Rechecked TEST-GROW-06: 8 passed; combined TEST-GROW-06 / TEST-ADM-08 / TEST-PLAT-05 / TEST-PLAT-07: 30 passed. These are checker tests, not financial integration or recovery evidence.

Basis: 13-backlog.md T-PLAT-08 requires old-writer fencing and reconciliation of uncertain external payments before financial reopen, and names PROVIDER_OUTCOME_UNKNOWN. Its shared M2 errors include unauthorized 403 and stale/conflicting command 409. 11-infrastructure.md K4 requires independent workload/provider-credential fencing, independent reconstruction of the uncertainty window, reconciled positions, and Finance/Security/incident-command sign-off. 12-tests-gates.md M96/M97, SC-46 and REQ-SC-20 prohibit treating a missing restored row as proof of no remote payment. A pure checker can refuse supplied blockers without establishing any of these prerequisites. The exact branch mapping below is limited to this internal checker; it does not change a frozen HTTP contract or implement a recovery protocol.

All previously held tasks and release/activation gates remain HOLD, including full T-GROW-06, T-ADM-08, T-ADM-06, T-PLAT-07 and T-PLAT-08 delivery, T-CORE-02, T-LEDGER-02 and the other financial commands. CP-05/CP-10/CP-11 and G08 recovery evidence are not satisfied. T-EXT-02 and T-EXT-04 are not authorized in this batch because T-PLAT-08 fits the limited scope. No dependency, production or money-path gate is cleared.

Allowed implementation files only (paths relative to apps/kita/):

- packages/platform/recover-financial-authority.ts — create the inert recoverFinancialAuthority checker only.
- tests/features/test-plat-08.spec.ts — create focused TEST-PLAT-08 denial tests only.
- packages/contracts/src/platform.ts — additive Plat08Input, Plat08Output and Plat08CommandContext types only; add WorkerContext to the existing type-only context import as needed and preserve all existing contracts.

Exact required Plat08Input flag names and types (no other data fields):

```ts
readonly unauthorizedReopen: boolean;
readonly oldWriterNotFenced: boolean;
readonly uncertaintyWindowUnreconciled: boolean;
```

These are internal denial inputs, not HTTP fields, authenticated evidence or recovery attestations. unauthorizedReopen denotes a supplied absence or invalidity of the required current, scope-bound Finance/Security/incident-command reopen authorization. oldWriterNotFenced denotes a supplied failure to establish that former workload identities/provider credentials cannot submit, through independent revocation/fencing or a proven safe submission gateway. A DB lease, attempt generation, process restart or elapsed RTO alone never establishes that fencing. uncertaintyWindowUnreconciled denotes supplied incomplete independent external history, an unresolved external instruction/outcome, or unreconciled movements/positions within the potentially lost window, including lost queue data. Absent local commands/attempts never prove no payment. The checker must not derive flags, inspect backups/WAL/credentials/signatures, validate an approval, read a clock, query a provider or load financial state.

Define Plat08Output = never. Define Plat08CommandContext as Pick<WorkerContext, 'workId' | 'attemptGeneration'>. The checker signature is recoverFinancialAuthority(ctx: Plat08CommandContext, input: Plat08Input): Promise<Result<Plat08Output, Problem>>. Context identity is unused and never establishes authority. Use type-only imports for Plat08 types from ../contracts/src/platform.ts and Problem/Result from ../contracts/src/result.ts; import only the existing err/problem runtime helpers from ../contracts/src/result.ts. Do not import the contracts runtime barrel or ok helper, add a dependency, or edit package/barrel exports. Accept no trace/capability/execution callback, transaction runner, store, backup/WAL/history payload, approval, provider credential, account, amount, balance or journal line. This checker has no diagnostic callback or other I/O; it only returns a Problem.

Required behavior, evaluated in this order:

| Condition | Exact error code | HTTP status | retryable |
|---|---|---|---|
| unauthorizedReopen === true, regardless of other flags | unauthorized | 403 | false |
| Otherwise oldWriterNotFenced === true, including when uncertaintyWindowUnreconciled is true | stale_or_conflicting_command | 409 | false |
| Otherwise uncertaintyWindowUnreconciled === true | PROVIDER_OUTCOME_UNKNOWN | 409 | false |
| Otherwise | dependency_unavailable | 503 | true |

The fencing refusal uses the existing shared stale_or_conflicting_command code for conflicting submission authority. It must not claim a version comparison was performed or imply that changing a generation fences provider credentials. The unknown-outcome refusal is not a retry instruction, proof of nonpayment, or permission to send under a new key.

Return only ok: false failures with exactly a bounded, fixed, non-PII Problem and no value, operationId, fieldErrors or success payload. Use these fixed detail strings in table order:

- T-PLAT-08 financial reopen is not authorized
- T-PLAT-08 former writer is not independently fenced; financial submission cannot reopen
- T-PLAT-08 uncertainty window is not independently reconciled; provider outcomes remain unknown
- T-PLAT-08 recoverFinancialAuthority cannot persist recovery or grant financial submission authority: recovery stores are unavailable; T-CORE-02 and T-LEDGER-02 remain HOLD (fail closed)

False flags never establish verified fencing, complete history, reconciled balances/positions, valid approvals, recovered authority or eligibility to reopen. Even all flags false must return the 503 refusal. retryable: true on that refusal permits no automatic recovery execution, provider retry, inquiry scheduling or new-key submission. Do not add another error branch/code or a successful continued-stop/recovery payload. No result may attest that a live submission gate was closed or any live system is currently fenced.

No persistence or database/store access, including in-memory substitute stores. No ledger/journal posting, balance mutation, executeCommand, holds store, approval creation/consumption, provider/adapter call, cloud/IAM/KMS/credential operation, backup/restore/WAL operation, queue/outbox/timer work, inquiry, dispatch or financial execution. No reconstruction/import of attempts, commands, economic events, projections or audit anchors. No fence/generation advancement, credential revocation, financial rewind, reservation/release, clearing of unknown/in-flight authority, gate toggle or reopening. Never authorize or return ok: true, command authority, recovery approval, a reconciliation receipt or a recorded state transition. Do not change API/controller/worker/UI wiring, runbooks, Terraform, CI, frozen OpenAPI, migrations, permissions, existing checkers, package configuration or dependencies.

TEST-PLAT-08 must cover all eight boolean combinations, both denial precedence rules, the all-false 503, and exact code/status/retryable/detail values. Object.freeze every input and context and verify they remain unchanged; repeating the same inputs must produce the same refusal. Assert the exact error-only result shape on every case, with no extra fields, value, operationId, authority, receipt, state change, recovered/fenced/reconciled assertion or submission-enabled result. Use no mock store or simulated recovery/provider implementation. These tests do not satisfy full TEST-PLAT-08, M96/M97, SC-46, REQ-SC-20 or G08: independent old-writer fencing, external-history reconstruction, reconciliation, real DB/provider restore races and signed financial reopen remain unimplemented and HOLD.

Validation required on the returned implementation head (commands run from apps/kita/):

```sh
./node_modules/.bin/vitest run tests/features/test-plat-08.spec.ts tests/features/test-grow-06.spec.ts tests/features/test-adm-08.spec.ts tests/features/test-plat-05.spec.ts tests/features/test-plat-07.spec.ts
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --noUncheckedIndexedAccess --exactOptionalPropertyTypes packages/contracts/src/platform.ts
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --noUncheckedIndexedAccess --exactOptionalPropertyTypes packages/platform/recover-financial-authority.ts
./node_modules/.bin/tsc --noEmit --project packages/contracts/tsconfig.json
./node_modules/.bin/tsc --noEmit --project packages/contracts/tsconfig.json --allowImportingTsExtensions
```

Type-check baseline rechecked at the reviewed SHA: the strict platform.ts command fails with three existing diagnostics in events.ts (78 TS2502; 125 TS2456; 129 TS7006). The unmodified contracts package check fails with 15 diagnostics: ten TS5097 import-extension diagnostics and five registry diagnostics. With explicit --allowImportingTsExtensions it fails with the five existing diagnostics in commands.ts (108 TS2502; 345 TS2456) and events.ts (78 TS2502; 125 TS2456; 129 TS7006). Strict checking of the landed schedules/execute-auto-conversion.ts also fails with those five diagnostics through its contracts barrel import. The new checker does not yet exist and its strict command must be run on the returned implementation. Do not claim failing checks pass, change config to hide them, suppress errors, waive a review gate or fix unrelated files. Record baseline failures separately; any new diagnostic or need to expand scope returns to Sol as BATCH-HOLD.

Inspect final imports and diff for effects, forbidden success/authority paths and edits outside the three allowed implementation files. Return the exact implementation head, changed-file list and complete test/type-check outcomes for Codex Sol max review. Checker test success alone does not close the task or authorize money movement.

Implementation follows the established roles: Qoder CLI Efficient Agent Teams/subagents on gpu-fqaf implement the authorized checker; coordinator handles sync/bundles/GitHub; Codex Sol max reviews the returned batch. This document authorizes the next limited checker only and does not start implementation or a swarm. If it cannot fit these constraints, stop the batch and report BATCH-HOLD with the reason. T-CORE-02 remains HOLD.
