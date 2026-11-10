BATCH-OK

Authorize only `checkDurableCommandEvidence`, a T-CORE-02 LIMITED PURE boolean-input fail-closed checker, under the exact contract and three-file allowlist below. Full T-CORE-02 remains HOLD for every input. Money closed. Never `ok:true`. No `executeCommand`, `authorizeDispatch`, `money_operations` access, command authority, stores or financial execution is authorized.

Planning baseline: `025d3ec956c2c81b2868ac5c2535f76781568d4e`, the exhausted-checker BATCH-HOLD, descending from `bb1177df427ae04f2eee458bf43bb256e299508d` / PR #114 (`checkCoreEvidence`). The inventory of leftover checkers for other IDs remains exhausted. This is one explicit new limited-checker authorization for T-CORE-02. The three proposed files are absent at this baseline. No proposed implementation has been run or tested by this documentation update.

Selection basis: [13-backlog.md T-CORE-02](../13-backlog.md#t-core-02--implement-durable-commands-operations-subject-holds-limit-buckets-and-non-transfer-financial-work-identities) requires immutable command payloads and scoped identities, durable idempotency and response recovery, fenced authority, subject holds, limits, ownership and atomic command/state/event/outbox/audit. Its full implementation uses `executeCommand` and `money_operations` and remains prohibited. M2's existing `unauthorized` / 403, `stale_or_conflicting_command` / 409, `invalid_request` / 400 and `dependency_unavailable` / 503 support deterministic refusal of supplied blockers without implementing or inspecting any of those systems. Apply the same restrictions as the landed CORE-01 evidence checker; passing supplied-booleans tests proves no durable behavior.

This document replaces the previous NEXT-BATCH authorization. Its only exception to the prior T-CORE-02 no-new-checker restriction is the three new files below. Preserve all other addenda, including [T-CORE-02-BATCH.md](T-CORE-02-BATCH.md); their full-task holds persist. Older CORE-01 implementation permissions and conditional reviews confer no database, runtime, bootstrap, command, schema or package-export permission here. Full **T-CORE-02, T-FIN-01, T-LEDGER-02, T-REWARD-01, T-LIVE-01 and T-GA-01 remain HOLD**. No implementation, scaffold or new checker for the other five tasks is authorized. Full T-CORE-01 and all other unclosed task, prerequisite, CP, DEP, PACK and connected-feature holds persist. No production, live pilot, launch, activation, release sign-off or G1-G6 closure.

Implementation allowlist: create only these three files, relative to repository root:

- `apps/kita/packages/contracts/src/durable-command-evidence.ts` — type-only `Core02Input`, `Core02Output` and `Core02CommandContext` declarations.
- `apps/kita/packages/platform/check-durable-command-evidence.ts` — one standalone inert `checkDurableCommandEvidence` checker; no other runtime export.
- `apps/kita/tests/features/test-core-02-evidence.spec.ts` — TEST-CORE-02 supplied-blocker refusal tests only.

No existing implementation, test, contract, database or runtime file may change. Preserve `result.ts`, `context.ts`, all barrels, command/event/problem contracts, existing checkers and tests, all of `apps/kita/packages/database/` and `apps/kita/database/`, pool/transaction/runtime/bootstrap/API modules, activation policy, provider ports/adapters, guards, frozen OpenAPI/events/SQL, migrations/grants, runbooks, infrastructure, CI, manifests, source archives, package files/exports, dependencies and configuration byte-for-byte. No generated artifact, evidence manifest, report, fixture, registry, schema, controller, command-authority module, placeholder `executeCommand` or `authorizeDispatch`, store interface or in-memory substitute store. Existing untracked files are outside the batch.

This planning turn edits only `docs/kita-plan/addenda/NEXT-BATCH.md`; it does not create the three implementation files or start implementation. For a later implementation batch, the coordinator must record an exact base containing this plan and descending from the planning baseline, and the exact returned head. Any intervening change other than this planning file requires Sol review before implementation. The implementation diff from that recorded base must contain exactly the three new paths above, with no modifications, deletions or renames of existing files.

Define exactly this input contract. All five fields are required readonly booleans, with no optional or additional input fields:

~~~ts
export interface Core02Input {
  readonly requiredReviewMissing: boolean;
  readonly commandIdentityOrPayloadMismatch: boolean;
  readonly durableAuthoritySafetyUnproven: boolean;
  readonly subjectHoldOrLimitSafetyUnproven: boolean;
  readonly requiredEvidenceMissing: boolean;
}

export type Core02Output = never;

export type Core02CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration'>;
~~~

Import `WorkerContext` only as a type from `./context.ts`. The contract file has no runtime import, export, constant, validator or initialization. The two context fields are unused metadata; they establish no worker, actor, role, review, evidence or execution authority. Do not accept `CommandContext`, `ReadContext`, a full `WorkerContext`, callbacks, dependencies or extra context fields. The exact checker signature is:

~~~ts
checkDurableCommandEvidence(ctx: Core02CommandContext, input: Core02Input): Promise<Result<Core02Output, Problem>>
~~~

The flags are supplied assertions only, in the order shown:

- `requiredReviewMissing`: supplied absence of required architect, financial-backend or independent exact-head Sol review. Accept no reviewer, actor, role, signature, approval record, review date or authorization function. Do not check, collect, grant or fabricate review or approval.
- `commandIdentityOrPayloadMismatch`: supplied mismatch in command scope, immutable payload, candidate/contract identity, idempotency key/body, quote use, parent ownership or authority generation. Accept no command, key, body, canonical payload, hash, quote, version, book/customer/parent identifier, generation comparison or comparison function. Do not canonicalize, hash, deduplicate, compare candidates, resolve ownership or inspect actual conflicts.
- `durableAuthoritySafetyUnproven`: supplied assertion that durable idempotency, original-response recovery, economic-movement deduplication, single unresolved/fenced authority, unknown-prior-attempt handling or atomic command/state/event/outbox/audit safety is unproven. Accept no command receipt, operation, attempt, permit, fence, event, outbox record, audit record, transaction, driver, SQL, fault trace or callback. Do not implement, simulate, inspect, execute or retry a durable command or authority lifecycle.
- `subjectHoldOrLimitSafetyUnproven`: supplied assertion that subject-scoped holds, customer safety locks, hold/dispatch interleavings, ordered locks, scoped limit buckets/reservations or nested book/customer/parent ownership safety is unproven. Accept no subject, hold, lock, bucket, reservation, policy, limit, amount, account or financial data. Do not read, create, validate, acquire, mutate or release any hold, lock, bucket or reservation; do not compute a balance or limit.
- `requiredEvidenceMissing`: supplied absence of current independent EV(T-CORE-02), CP-02/03/05 migration/concurrency/crash-atomicity and actual-role permission proofs, or required REQ-SC-01–05/15/17/20 evidence. Accept no test result, transcript, database observation, manifest, artifact, signature, timestamp, approval/dependency status or verification function. Do not run or accept evidence, count tests, attest PostgreSQL behavior, satisfy prerequisites or close DEP-15.

Do not derive, verify or clear these flags. False flags prove no review, matching identity/payload, safe authority, durable response recovery, idempotency, ownership, hold/limit enforcement, atomicity, fencing, permissions or execution evidence. Every real condition remains unverified, including on the all-false fallback. No evidence-accepted, safe-to-execute, dispatch-permitted, task-complete or gate verdict is possible. Full T-CORE-02 and its dependent full tasks remain HOLD in every branch.

The checker uses type-only imports for the three Core02 types from `../contracts/src/durable-command-evidence.ts` and `Problem` / `Result` from `../contracts/src/result.ts`. Its only runtime import is the existing `err` / `problem` helpers from `../contracts/src/result.ts`. Never import a runtime barrel, another checker, database/config/runtime/API module, driver, pool/transaction/bootstrap helper, `executeCommand`, `authorizeDispatch`, command/event helper, validator/generator, success/receipt/permit/evidence/report type, `ok` / `unavailable` helper, Node module, store, provider, money utility, activation/certification/integration/release/gate runner. Add no dependency or runtime schema. New test imports may use only `vitest`, the new checker and direct new contract types, plus the type-only `UUID` from `context.ts`.

Required behavior in this exact order: the first flag equal to `true` wins regardless of every lower-priority flag. Compare each with `=== true`; add no other branch or runtime input validator.

| Condition | Exact error code | HTTP status | retryable | Fixed detail |
|---|---|---|---|---|
| `requiredReviewMissing === true` | `unauthorized` | 403 | false | T-CORE-02 supplied missing required architect or independent review blocks durable command evidence |
| Otherwise `commandIdentityOrPayloadMismatch === true` | `stale_or_conflicting_command` | 409 | false | T-CORE-02 supplied command identity or immutable payload mismatch blocks durable command evidence |
| Otherwise `durableAuthoritySafetyUnproven === true` | `invalid_request` | 400 | false | T-CORE-02 supplied unproven durable command or fenced authority safety blocks durable command evidence |
| Otherwise `subjectHoldOrLimitSafetyUnproven === true` | `invalid_request` | 400 | false | T-CORE-02 supplied unproven subject hold or limit safety blocks durable command evidence |
| Otherwise `requiredEvidenceMissing === true` | `invalid_request` | 400 | false | T-CORE-02 supplied missing required durable command execution evidence blocks durable command evidence |
| Otherwise (all five flags false) | `dependency_unavailable` | 503 | true | T-CORE-02 checkDurableCommandEvidence cannot verify durable commands, idempotency or response recovery, scoped ownership, fenced authority, subject holds, limit buckets, atomic command/state/event/outbox/audit or current independent review and execution evidence: full T-CORE-02 remains HOLD (fail closed) |

Return only failures with exactly `{ ok: false, error: { code, status, retryable, detail } }`. Use the fixed, bounded, non-PII details above verbatim. No extra code, branch, `value`, `kind`, `operationId`, `fieldErrors`, receipt, recovered response, operation, permit, report, manifest, proof, evidence, timestamp, authority or other result field. These errors classify supplied blockers only; they do not translate actual command/SQL/provider errors or change frozen runtime error semantics. All flags false still refuses with 503. `retryable: true` authorizes no automatic retry, lookup, recovery, evidence collection, backoff, scheduling or execution. Never `ok:true`.

No persistence or store/database access, including read-only, real, test, fake, stub or in-memory stores. No `money_operations`, `command_keys`, operations/attempts, hold/limit/reservation, balance/ledger/points or quote access. No filesystem, directory enumeration, file existence/source/artifact/archive access, environment/configuration/identity/scope/evidence inspection, import or route reachability check, schema validation, Git operation, hashing, manifest generation/comparison, subprocess, clock, randomness, network, credential access, signing/verification, cache, state transition or trace/log/audit/metric emission. No pool/client/transaction lifecycle, SQL, roles/grants/context setting, locks, retries/backoff, listener/readiness, queue/outbox/inbox/timer or lifecycle/provider/oracle/test-runner execution by the checker or its new tests. No financial arithmetic or reconciliation, ledger posting, reward/points path, refunds, money creation, command/transfer/operation/attempt creation, holds, balance mutation, reservation or exposure/servicing change. Accept no paths, bytes, IDs, keys, hashes, versions, timestamps, schemas, mappings, counts, manifests, proofs, artifacts, source/code, records, tokens, approvals, amounts, currencies or financial data; the two unused context metadata fields are the sole identifier exception.

Do not import, call, wrap, modify, extend, re-export or add tests for existing pool/transaction/runtime/bootstrap helpers, `validateEnvironment`, `validateBuildBaseline`, `migrateCore`, `checkCoreEvidence`, another existing checker, `executeCommand`, `authorizeDispatch`, `reconcileScope`, `freezeContracts`, `verifyIntegration`, `certifyProvider`, `evaluateActivation` or a gate runner. Do not wire the new checker into API/controllers/workers/UI, command handlers, database/configuration/runtime/bootstrap, providers, activation/exposure/servicing, release/build/CI gates, workspace/migration scripts, guards or handoff tools. No deployment, publication, GitHub merge, live pilot, production activation or G1-G6 closure.

TEST-CORE-02 in the new `test-core-02-evidence.spec.ts` must cover all 32 Boolean combinations in an explicit independently specified expected-results table. In flag order, include sixteen missing-review combinations, eight remaining identity/payload-mismatch combinations, four remaining durable-authority-safety combinations, two remaining subject-hold/limit-safety combinations, the sole remaining missing-evidence combination and the all-false fallback. Expected code/status/retryable/detail must be literal, independently specified expectations, with no copied if-chain or imported implementation constants. For every case assert the full exact error-only result with `toStrictEqual`, exact top-level and error keys, no `value`, `kind` or extra receipt/permit/report/evidence/authority fields, and an identical refusal on a repeated call. Freeze each input and context, capture their values before calling, and assert both remain unchanged after both calls. No filesystem/evidence/configuration fixture, environment read, runtime helper, database/store/pool/driver/transaction mock, fake callback/provider, financial data, oracle, clock or randomness. Preserve all existing tests without edits.

These tests establish only supplied-blocker precedence, deterministic refusal and input/context non-mutation. They establish no actual REQ-SC execution, durable idempotency, recovery, atomicity, ownership, hold/limit enforcement, fencing, database permissions, migration/concurrency/crash proof or EV(T-CORE-02). No full task, prerequisite, CP gap, PACK, DEP condition or G1-G6 closes. In particular CP-02/03/05 implementation proofs, CP-10/11 and real-role PostgreSQL/DEP-15 evidence remain unverified by this checker.

Validation required on the returned implementation head, from `apps/kita/` (these are future review requirements, not results of this planning edit):

~~~sh
./node_modules/.bin/vitest run tests/features/test-core-02-evidence.spec.ts tests/features/test-core-01-evidence.spec.ts tests/features/test-depend-01-evidence.spec.ts tests/features/test-depend-01.spec.ts tests/features/test-cert-01.spec.ts tests/features/test-integrate-01.spec.ts tests/features/test-scope-01.spec.ts tests/features/test-contract-01.spec.ts tests/features/test-release-01.spec.ts tests/features/test-base-01.spec.ts tests/features/test-mig-01.spec.ts tests/features/test-adapter-01.spec.ts tests/features/test-identity-01.spec.ts tests/features/test-quote-01.spec.ts tests/features/test-auth-01.spec.ts tests/features/test-auth-02.spec.ts tests/features/test-auth-03.spec.ts tests/features/test-auth-04.spec.ts tests/features/test-auth-05.spec.ts tests/features/test-auth-06.spec.ts tests/features/test-auth-07.spec.ts
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --noUncheckedIndexedAccess --exactOptionalPropertyTypes packages/contracts/src/durable-command-evidence.ts
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --noUncheckedIndexedAccess --exactOptionalPropertyTypes packages/platform/check-durable-command-evidence.ts
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --noUncheckedIndexedAccess --exactOptionalPropertyTypes packages/contracts/src/core-evidence.ts packages/platform/check-core-evidence.ts packages/contracts/src/dependency-evidence.ts packages/platform/check-dependency-evidence.ts packages/contracts/src/certification-evidence.ts packages/platform/check-certification-evidence.ts packages/contracts/src/integration-evidence.ts packages/platform/check-integration-evidence.ts packages/contracts/src/original-spec-crosswalk.ts packages/platform/check-original-spec-crosswalk.ts packages/contracts/src/contract-freeze.ts packages/platform/check-contract-freeze.ts packages/contracts/src/release.ts packages/platform/check-release-evidence.ts packages/contracts/src/workspace.ts packages/platform/check-workspace-evidence.ts
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
with tempfile.TemporaryDirectory(prefix='kita-core02-review-', dir='/tmp') as temp:
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

Require both new strict isolated checks and the existing sixteen-file isolated check above to pass without diagnostics. Rerun and report the two full contracts-package checks separately, with actual exit statuses and complete diagnostics. The CORE-01 planning record reported existing TS5097 extension diagnostics and TS2502/TS2456/TS7006 command/event registry diagnostics; those were failing gates, not waivers or passed checks. Compare exact diagnostic identities and locations with the recorded implementation base, whose existing files must remain unchanged. Do not suppress diagnostics, edit configuration, fix unrelated files or report existing package failures as closed. Any new diagnostic, changed existing failure, failed/missing test or need for actual command/configuration/review/evidence/identity/hash/database/store/financial access returns to Sol as BATCH-HOLD.

Inspect the full final diff and imports for side effects, success/receipt/permit/recovery/evidence/authority paths, indirect access to forbidden helpers and changes outside the three new paths. Verify all existing files, especially database/runtime/API/command contracts/package exports/activation/tests, are unchanged from the recorded implementation base. Return that base, exact returned head, changed-file list, full diff, complete test/typecheck results and blockers for Codex Sol max review. Failed review returns to Qoder as a scoped fix batch; review the updated exact head before any further decision.

Future implementation follows the established roles: coordinator syncs to GPU `gpu-fqaf` through `~/.coordinator/run-batch.sh`; Qoder CLI Efficient Agent Teams/subagents implement there; bundle/download to the VM for Codex Sol max review; coordinator handles GitHub. This document starts no swarm and authorizes no merge or deployment. Stop after the limited checker passes review. If it cannot fit these constraints, report BATCH-HOLD. Full T-CORE-02 and the five other remaining full-task HOLDs persist. Money closed. Never `ok:true`. No production, live pilot, launch, activation or G1-G6 closure.
