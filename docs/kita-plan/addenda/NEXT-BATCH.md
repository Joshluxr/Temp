BATCH-OK

Authorize only `checkLedgerEvidence`, a T-FIN-01 LIMITED PURE boolean-input fail-closed checker, under the exact contract and three-file allowlist below. Full T-FIN-01 remains HOLD for every input. Money closed. Never `ok:true`. No `executeCommand`, `authorizeDispatch`, `postBusinessEvent`, posting, journals, stores or financial execution is authorized.

Planning baseline: `7a829856655ae318fa8a77346674a0a8bc6ea2ea` / PR #117, where the LIMITED T-CORE-02 `checkDurableCommandEvidence` checker is implemented. Full T-CORE-02 remains HOLD; that checker supplies no durable-command, database or money authority. The three proposed FIN-01 files are absent at this baseline. This planning update runs no implementation or application tests and makes no new claim about the landed checker's review or test results.

Selection basis: [13-backlog.md T-FIN-01](../13-backlog.md#t-fin-01--in-house-immutable-balanced-ledger) requires actual immutable balanced journals, same-key replay, scoped verified economic evidence and connected ledger execution. Its full implementation depends on T-CORE-02 and T-LEDGER-02 and remains prohibited. M2's existing `unauthorized` / 403, `stale_or_conflicting_command` / 409, `invalid_request` / 400 and `dependency_unavailable` / 503 permit deterministic refusal of supplied blockers without inspecting or implementing a ledger. Apply the same constraints as the landed CORE-02 evidence checker. Passing supplied-booleans tests proves no financial behavior.

This document replaces the previous NEXT-BATCH authorization with one explicit LIMITED checker authorization for T-FIN-01 only. Preserve all other addenda, including [T-CORE-02-BATCH.md](T-CORE-02-BATCH.md); their full-task holds persist. The landed CORE-02 checker and all other existing code remain unchanged. Full **T-FIN-01 and T-CORE-02 remain HOLD**. **T-LEDGER-02, T-REWARD-01, T-LIVE-01 and T-GA-01 remain HOLD with no new checker, implementation or scaffold authorized.** Full T-CORE-01 and every other unclosed task, prerequisite, CP, DEP, PACK and connected-feature hold persist. No production, live pilot, launch, activation, release sign-off or G1-G6 closure.

Implementation allowlist: create only these three files, relative to repository root:

- `apps/kita/packages/contracts/src/ledger-evidence.ts` — type-only `Fin01Input`, `Fin01Output` and `Fin01CommandContext` declarations.
- `apps/kita/packages/platform/check-ledger-evidence.ts` — one standalone inert `checkLedgerEvidence` checker; no other runtime export.
- `apps/kita/tests/features/test-fin-01-evidence.spec.ts` — TEST-FIN-01 supplied-blocker refusal tests only.

No existing implementation, test, contract, database or runtime file may change. Preserve `ledger.ts`, `result.ts`, `context.ts`, all barrels, command/event/problem contracts, existing checkers and tests, all of `apps/kita/packages/database/` and `apps/kita/database/`, pool/transaction/runtime/bootstrap/API modules, activation policy, provider ports/adapters, guards, frozen OpenAPI/events/SQL, migrations/grants, runbooks, infrastructure, CI, manifests, source archives, package files/exports, dependencies and configuration byte-for-byte. No generated artifact, evidence manifest, report, fixture, registry, schema, controller, command-authority module, placeholder `executeCommand`, `authorizeDispatch` or `postBusinessEvent`, store interface or in-memory substitute store. Existing untracked files are outside the batch.

This planning turn edits only `docs/kita-plan/addenda/NEXT-BATCH.md`; it does not create the three implementation files or start implementation. For a later implementation batch, the coordinator must record an exact base containing this plan and descending from the planning baseline, and the exact returned head. Any intervening change other than this planning file requires Sol review before implementation. The implementation diff from that recorded base must contain exactly the three new paths above, with no modifications, deletions or renames of existing files.

Define exactly this input contract. All five fields are required readonly booleans, with no optional or additional input fields:

~~~ts
export interface Fin01Input {
  readonly requiredReviewMissing: boolean;
  readonly ledgerIdentityOrPayloadMismatch: boolean;
  readonly journalIntegritySafetyUnproven: boolean;
  readonly postingPolicyOrPeriodSafetyUnproven: boolean;
  readonly requiredEvidenceMissing: boolean;
}

export type Fin01Output = never;

export type Fin01CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration'>;
~~~

Import `WorkerContext` only as a type from `./context.ts`. The contract file has no runtime import, export, constant, validator or initialization. These additive declarations apply only to this limited checker; they do not implement, replace or freeze the proposed full-task `postBusinessEvent` contract. Do not add them to `ledger.ts` or a package barrel. The two context fields are unused metadata; they establish no worker, actor, role, review, evidence, posting or execution authority. Do not read or validate them. Do not accept `CommandContext`, `ReadContext`, a full `WorkerContext`, trace/capability callbacks, dependencies or extra context fields. The exact checker signature is:

~~~ts
checkLedgerEvidence(ctx: Fin01CommandContext, input: Fin01Input): Promise<Result<Fin01Output, Problem>>
~~~

The flags are supplied assertions only, in the order shown:

- `requiredReviewMissing`: supplied absence of required architect, Controller, financial-backend or independent exact-head Sol review. Accept no reviewer, actor, role, signature, approval record, review date or authorization function. Do not check, collect, grant or fabricate review or approval.
- `ledgerIdentityOrPayloadMismatch`: supplied mismatch in scoped economic-event/book/policy identity, stable event key, immutable payload, same-key replay body or candidate/contract identity. Accept no event, book, customer/account identifier, policy, key, payload, hash, version, journal reference or comparison function. Do not canonicalize, hash, deduplicate, compare, replay, recover a response, resolve ownership or inspect actual conflicts.
- `journalIntegritySafetyUnproven`: supplied assertion that nonempty, balanced, single-currency and append-only immutable journal integrity, including rejection of empty, unbalanced, cross-currency or edited journals, is unproven. Accept no journal, header, line, account, amount, currency, debit, credit, balance, trial balance or fixture. Do not construct, read, validate, balance, edit, append, reverse or post any journal, even a synthetic one. Do no financial arithmetic or reconciliation.
- `postingPolicyOrPeriodSafetyUnproven`: supplied assertion that approved posting templates, active evidence/policy, scoped ownership, open/nonoverlapping periods, close enforcement, nonnegative balances, cumulative correction/allocation limits, event-key serialization or atomic command/state/journal/event/outbox/audit safety is unproven. Accept no template, policy, period, evidence, allocation, permission, transaction, driver, SQL, receipt, operation, permit, fault trace or callback. Do not implement, simulate, inspect, execute or retry posting, policy/period enforcement or a financial authority lifecycle.
- `requiredEvidenceMissing`: supplied absence of current independent EV(T-FIN-01), Controller-approved ledger/template and reconciliation proofs, CP-04 and real-role PostgreSQL/concurrency/crash-atomicity evidence, or applicable REQ-SC-05/07/08/09/10/11/19/20 evidence. Accept no test result, transcript, database observation, manifest, artifact, signature, timestamp, approval/dependency status or verification function. Do not run or accept evidence, count tests, attest ledger/PostgreSQL behavior, satisfy prerequisites or close DEP-15.

Do not derive, verify or clear these flags. False flags prove no review, matching identity/payload, verified event, journal integrity, replay safety, ownership, policy validity, period enforcement, balance/allocation safety, atomicity, permissions or execution evidence. Every real condition remains unverified, including on the all-false fallback. No evidence-accepted, ledger-verified, safe-to-post, dispatch-permitted, task-complete or gate verdict is possible. Full T-FIN-01, T-CORE-02 and T-LEDGER-02 remain HOLD in every branch.

The checker uses type-only imports for the three Fin01 types from `../contracts/src/ledger-evidence.ts` and `Problem` / `Result` from `../contracts/src/result.ts`. Its only runtime import is the existing `err` / `problem` helpers from `../contracts/src/result.ts`. Never import a runtime barrel, another checker, database/config/runtime/API/domain module, driver, pool/transaction/bootstrap helper, `executeCommand`, `authorizeDispatch`, `postBusinessEvent`, journal/command/event helper, validator/generator, success/receipt/permit/evidence/report type, `ok` / `unavailable` helper, Node module, store, provider, money utility, activation/certification/integration/release/gate runner. Add no dependency or runtime schema. New test imports may use only `vitest`, the new checker and direct new contract types, plus the type-only `UUID` from `context.ts`.

Required behavior in this exact order: the first flag equal to `true` wins regardless of every lower-priority flag. Compare each with `=== true`; add no other branch or runtime input validator.

| Condition | Exact error code | HTTP status | retryable | Fixed detail |
|---|---|---|---|---|
| `requiredReviewMissing === true` | `unauthorized` | 403 | false | T-FIN-01 supplied missing required architect, Controller or independent review blocks ledger evidence |
| Otherwise `ledgerIdentityOrPayloadMismatch === true` | `stale_or_conflicting_command` | 409 | false | T-FIN-01 supplied ledger identity or immutable payload mismatch blocks ledger evidence |
| Otherwise `journalIntegritySafetyUnproven === true` | `invalid_request` | 400 | false | T-FIN-01 supplied unproven nonempty, balanced, single-currency or immutable journal safety blocks ledger evidence |
| Otherwise `postingPolicyOrPeriodSafetyUnproven === true` | `invalid_request` | 400 | false | T-FIN-01 supplied unproven posting policy, period or atomic authority safety blocks ledger evidence |
| Otherwise `requiredEvidenceMissing === true` | `invalid_request` | 400 | false | T-FIN-01 supplied missing required ledger execution evidence blocks ledger evidence |
| Otherwise (all five flags false) | `dependency_unavailable` | 503 | true | T-FIN-01 checkLedgerEvidence cannot verify nonempty balanced single-currency immutable journals, scoped evidence and event-key replay, approved posting policies or periods, nonnegative balances or allocation limits, atomic posting or current independent Controller review and execution evidence: full T-FIN-01, T-CORE-02 and T-LEDGER-02 remain HOLD (fail closed) |

Return only failures with exactly `{ ok: false, error: { code, status, retryable, detail } }`. Use the fixed, bounded, non-PII details above verbatim; each fits the existing `problem` helper's 500-character bound. No extra code, branch, `value`, `kind`, `operationId`, `fieldErrors`, journal/reference, balance, replay/recovered response, receipt, operation, permit, report, manifest, proof, evidence, timestamp, authority or other result field. These errors classify supplied blockers only; they do not translate actual ledger/command/SQL/provider errors, implement `IDEMPOTENCY_MISMATCH` or change frozen runtime error semantics. All flags false still refuses with 503. `retryable: true` authorizes no automatic retry, lookup, recovery, evidence collection, backoff, scheduling or execution. Never `ok:true`.

No persistence or store/database access, including read-only, real, test, fake, stub or in-memory stores. No `journals`, `journal_lines`, `money_operations`, `command_keys`, accounting-period, account, policy, evidence, balance/ledger/points, operation/attempt, hold/limit/reservation or quote access. No journal header/line/reference, financial record, read model, synthetic financial fixture or substitute ledger may be accepted, created or returned. No filesystem, directory enumeration, file existence/source/artifact/archive access, environment/configuration/identity/scope/evidence inspection, import or route reachability check, schema validation, Git operation, hashing, manifest generation/comparison, subprocess, clock, randomness, network, credential access, signing/verification, cache, state transition or trace/log/audit/metric emission.

No pool/client/transaction lifecycle, SQL, roles/grants/context setting, locks, retries/backoff, listener/readiness, queue/outbox/inbox/timer or lifecycle/provider/oracle/test-runner execution by the checker or its new tests. No financial arithmetic or reconciliation, ledger posting, journal creation/read/mutation/reversal, period creation/close, reward/points path, refunds, money creation, command/transfer/operation/attempt creation, holds, balance mutation, reservation or exposure/servicing change. Accept no paths, bytes, IDs, keys, hashes, versions, timestamps, schemas, mappings, counts, manifests, proofs, artifacts, source/code, records, tokens, approvals, amounts, currencies or financial data; the two unused context metadata fields are the sole identifier exception.

Do not import, call, wrap, modify, extend, re-export or add tests for existing pool/transaction/runtime/bootstrap helpers, `validateEnvironment`, `validateBuildBaseline`, `migrateCore`, `checkCoreEvidence`, `checkDurableCommandEvidence`, another existing checker, `executeCommand`, `authorizeDispatch`, `postBusinessEvent`, `getJournal`, `closePeriod`, `reconcileScope`, `freezeContracts`, `verifyIntegration`, `certifyProvider`, `evaluateActivation` or a gate runner. Do not wire the new checker into API/controllers/workers/UI, command handlers, database/configuration/runtime/bootstrap, providers, activation/exposure/servicing, release/build/CI gates, workspace/migration scripts, guards or handoff tools. No deployment, publication, GitHub merge, live pilot, production activation or G1-G6 closure.

TEST-FIN-01 in the new `test-fin-01-evidence.spec.ts` must cover all 32 Boolean combinations in an explicit independently specified expected-results table. In flag order, include sixteen missing-review combinations, eight remaining identity/payload-mismatch combinations, four remaining journal-integrity-safety combinations, two remaining posting-policy/period-safety combinations, the sole remaining missing-evidence combination and the all-false fallback. Expected code/status/retryable/detail must be literal, independently specified expectations, with no copied if-chain or imported implementation constants. For every case assert the full exact error-only result with `toStrictEqual`, exact top-level and error keys, no `value`, `kind` or extra journal/balance/replay/receipt/permit/report/evidence/authority fields, and an identical refusal on a repeated call. Freeze each input and context, capture their values before calling, and assert both remain unchanged after each of the two calls. No filesystem/evidence/configuration fixture, environment read, runtime helper, database/store/pool/driver/transaction mock, injected callback/provider, financial data, journal, arithmetic, oracle, clock or randomness. Preserve all existing tests without edits.

These tests establish only supplied-blocker precedence, deterministic refusal and input/context non-mutation. They establish no actual TEST-FIN-01 financial acceptance, REQ-SC execution, balanced/immutable journal enforcement, same-key replay, posting, policy/period enforcement, ownership, balance/allocation protection, atomicity, database permissions, migration/concurrency/crash proof or EV(T-FIN-01). No full task, prerequisite, CP gap, PACK, DEP condition or G1-G6 closes. CP-02/03/04/05 implementation proofs, CP-10/11 and real-role PostgreSQL/DEP-15 evidence remain unverified by this checker.

Validation required on the returned implementation head, from `apps/kita/` (future review requirements, not results of this planning edit):

~~~sh
./node_modules/.bin/vitest run tests/features/test-fin-01-evidence.spec.ts tests/features/test-core-02-evidence.spec.ts tests/features/test-core-01-evidence.spec.ts tests/features/test-depend-01-evidence.spec.ts tests/features/test-depend-01.spec.ts tests/features/test-cert-01.spec.ts tests/features/test-integrate-01.spec.ts tests/features/test-scope-01.spec.ts tests/features/test-contract-01.spec.ts tests/features/test-release-01.spec.ts tests/features/test-base-01.spec.ts tests/features/test-mig-01.spec.ts tests/features/test-adapter-01.spec.ts tests/features/test-identity-01.spec.ts tests/features/test-quote-01.spec.ts tests/features/test-auth-01.spec.ts tests/features/test-auth-02.spec.ts tests/features/test-auth-03.spec.ts tests/features/test-auth-04.spec.ts tests/features/test-auth-05.spec.ts tests/features/test-auth-06.spec.ts tests/features/test-auth-07.spec.ts tests/features/test-fin-02.spec.ts tests/features/test-fin-03.spec.ts tests/features/test-fin-04.spec.ts tests/features/test-fin-05.spec.ts tests/features/test-fin-06.spec.ts tests/features/test-fin-07.spec.ts tests/features/test-fin-08.spec.ts
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --noUncheckedIndexedAccess --exactOptionalPropertyTypes packages/contracts/src/ledger-evidence.ts
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --noUncheckedIndexedAccess --exactOptionalPropertyTypes packages/platform/check-ledger-evidence.ts
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --noUncheckedIndexedAccess --exactOptionalPropertyTypes packages/contracts/src/durable-command-evidence.ts packages/platform/check-durable-command-evidence.ts packages/contracts/src/core-evidence.ts packages/platform/check-core-evidence.ts packages/contracts/src/dependency-evidence.ts packages/platform/check-dependency-evidence.ts packages/contracts/src/certification-evidence.ts packages/platform/check-certification-evidence.ts packages/contracts/src/integration-evidence.ts packages/platform/check-integration-evidence.ts packages/contracts/src/original-spec-crosswalk.ts packages/platform/check-original-spec-crosswalk.ts packages/contracts/src/contract-freeze.ts packages/platform/check-contract-freeze.ts packages/contracts/src/release.ts packages/platform/check-release-evidence.ts packages/contracts/src/workspace.ts packages/platform/check-workspace-evidence.ts
./node_modules/.bin/tsc --noEmit --project packages/contracts/tsconfig.json
./node_modules/.bin/tsc --noEmit --project packages/contracts/tsconfig.json --allowImportingTsExtensions
~~~

Require all 32 new refusal cases and all selected existing feature cases to pass without missing or skipped cases. Rerun the four existing provider-refusal cases separately: the default config excludes `tests/providers`, so merely passing that path to it is insufficient. Use this temporary reviewer harness; it writes only under `/tmp`, pins the Kita root and removes its configuration afterward. It does not authorize filesystem/subprocess work in the checker or new tests, any tracked configuration change or a real provider call. No existing database/bootstrap suite or PostgreSQL execution is authorized by this limited checker batch.

~~~sh
python3 - <<'PYTEST'
from pathlib import Path
import json
import subprocess
import tempfile

root = Path.cwd().resolve()
with tempfile.TemporaryDirectory(prefix='kita-fin01-review-', dir='/tmp') as temp:
    config = Path(temp) / 'vitest.config.mjs'
    config.write_text('export default ' + json.dumps({
        'root': str(root),
        'test': {
            'include': ['tests/providers/outcome-contract.spec.ts'],
            'environment': 'node',
            'testTimeout': 120000,
        },
    }) + ';\n', encoding='utf-8')
    completed = subprocess.run([
        str(root / 'node_modules/.bin/vitest'), 'run', '--config', str(config),
        'tests/providers/outcome-contract.spec.ts',
    ], cwd=root, check=False)
raise SystemExit(completed.returncode)
PYTEST
~~~

Require both new strict isolated checks and the existing eighteen-file isolated check above to pass without diagnostics. Rerun and report the two full contracts-package checks separately, with actual exit statuses and complete diagnostics. The prior CORE-02 plan recorded existing TS5097 extension diagnostics and TS2502/TS2456/TS7006 command/event registry diagnostics; establish the exact diagnostics again on the recorded implementation base and compare identities and locations on the returned head. These are failing gates, not waivers or passed checks. Do not suppress diagnostics, edit configuration, fix unrelated files or report existing package failures as closed. Unchanged package failures remain reported blockers to full package/task acceptance. Any new diagnostic, changed existing failure, failed/missing/skipped test or need for actual ledger/journal/command/configuration/review/evidence/identity/hash/database/store/financial access returns to Sol as BATCH-HOLD.

Inspect the full final diff and imports for side effects, success/journal/balance/replay/receipt/permit/recovery/evidence/authority paths, indirect access to forbidden helpers and changes outside the three new paths. Verify all existing files, especially `ledger.ts`, database/runtime/API/command contracts/package exports/activation/existing checkers/tests, are unchanged from the recorded implementation base. Return that base, exact returned head, changed-file list, full diff, complete test/typecheck results and blockers for Codex Sol max review. Failed review returns to Qoder as a scoped fix batch; review the updated exact head before any further decision. BATCH-OK here authorizes the limited artifact scope only; it closes no review or acceptance gate.

Future implementation follows the established roles: coordinator syncs to GPU `gpu-fqaf` through `~/.coordinator/run-batch.sh`; Qoder CLI Efficient Agent Teams/subagents implement there; bundle/download to the VM for Codex Sol max review; coordinator handles GitHub. This document starts no swarm and authorizes no merge or deployment. Stop after the limited checker passes review. If it cannot fit these constraints, report BATCH-HOLD. Full T-FIN-01 and T-CORE-02 remain HOLD. T-LEDGER-02, T-REWARD-01, T-LIVE-01 and T-GA-01 remain HOLD with no new checker. Money closed. Never `ok:true`. No posting, journals, stores, `executeCommand`, production, live pilot, launch, activation or G1-G6 closure.
