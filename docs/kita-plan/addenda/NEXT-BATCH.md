BATCH-OK

Authorize only the T-CORE-01 supplied core-boundary blockers checkCoreEvidence LIMITED PURE boolean-input fail-closed checker specified below. Full T-CORE-01 remains HOLD. Money path closed. Never authorize ok: true, executeCommand, ledger access or posting, financial execution, persistence or stores. T-CORE-02, T-FIN-01, T-LEDGER-02 and T-REWARD-01 remain HOLD; no implementation, scaffold or new checker for those tasks is authorized. T-LIVE-01 and T-GA-01 remain HOLD with no implementation or new checker authorized. No production, live pilot or G1-G6 closure is authorized.

Planning baseline: 0d095a20d48f95638fd921bf43dce1bcd9fabef4 on cursor/kita-depend01-check-dependency-evidence-05a3 ([PR #113](https://github.com/Joshluxr/Temp/pull/113); inspected PR head matches this commit, open and unmerged). T-DEPEND-01 checkDependencyEvidence is present as a refusal-only checker; full T-DEPEND-01 remains HOLD. Local rechecks at this exact head: all 509 existing feature cases across nineteen files passed (including 32 TEST-DEPEND-01 evidence and seven existing activation-policy cases, exit 0); all four existing tests/providers/outcome-contract.spec.ts cases passed separately (exit 0) with the temporary configuration below; strict isolated checking of the fourteen existing files listed below passed together (exit 0). Both full contracts package checks still fail as recorded below. These results establish no real pool/transaction/runtime verification, dependency acceptance, capability enablement, task completion or gate closure. The three proposed implementation files are absent at this baseline; no proposed implementation has been tested.

Selection basis: [13-backlog.md T-CORE-01](../13-backlog.md#t-core-01--establish-target-transaction-runtime-configuration-and-api-composition-boundaries) requires explicit target transaction/runtime/API composition boundaries, pool isolation, rollback/commit faults, bounded 40001/40P01 retries and exhaustion, missing/unsafe-binding refusal, server/client import boundaries, least-privilege roles, SET LOCAL context, ordered locks and no external network work in transactions. M2 requires independent exact-candidate EV(task) review and supplies unauthorized / 403, stale_or_conflicting_command / 409, invalid_request / 400 and dependency_unavailable / 503. These requirements support supplied-blocker refusals without constructing, validating or executing those boundaries. [COMPLETENESS-PASS.md CP-00, CP-05, CP-10 and CP-11](../COMPLETENESS-PASS.md) and [14-external-deps.md DEP-15](../14-external-deps.md) remain open. Historical mock-test/conditional-review records and existing package exports do not establish current full EV(T-CORE-01), real-role PostgreSQL proof or prerequisite completion. Full T-SCOPE-01, T-BASE-01, T-CONTRACT-01 and T-PLAT-01 prerequisites are not satisfied or bypassed by landed refusal checkers or this batch.

For this batch, this document is the sole implementation authorization and replaces the previous NEXT-BATCH.md T-DEPEND-01 authorization. Preserve all other addenda. Older permissions in T-CORE-01-BATCH.md and the conditional status in SOL-CORE01-REVIEW.md do not authorize database, transaction, runtime, bootstrap or package-export work here. Do not import, call, wrap, modify, extend, re-export or add new tests for existing pool/transaction/runtime/bootstrap helpers, validateEnvironment, validateBuildBaseline, migrateCore, reconcileScope, freezeContracts, evaluateReleaseGates, verifyIntegration, certifyProvider, evaluateActivation or another checker. No full task, prerequisite, CP gap, DEP condition, PACK acceptance or gate is satisfied by this checker.

Selection decisions:

| Candidate | Decision | One-line reason |
|---|---|---|
| T-CORE-01 supplied core-boundary blockers only | BATCH-OK for checkCoreEvidence below only; full task HOLD | Five supplied booleans permit deterministic refusals without inspecting bindings, resolving imports, constructing a pool, executing a transaction or accepting evidence. |
| T-CORE-02 / T-FIN-01 / T-LEDGER-02 / T-REWARD-01 | HOLD; prohibited | Durable command authority, money/ledger/finance/reward execution, scaffolds and new checkers remain outside authorization. |
| T-LIVE-01 | HOLD; prohibited | Live-pilot preparation, execution, reconciliation and a new checker are expressly outside authorization. |
| T-GA-01 | HOLD; prohibited | Launch decisions, staged exposure and a new checker are expressly outside authorization. |
| Production / live pilot / G1-G6 | HOLD; prohibited | No activation, deployment, release sign-off, gate runner or gate closure is authorized. |

Implementation allowlist: create only these three files, relative to repository root:

- apps/kita/packages/contracts/src/core-evidence.ts — type-only Core01Input, Core01Output and Core01CommandContext declarations.
- apps/kita/packages/platform/check-core-evidence.ts — one standalone inert checkCoreEvidence checker with no other runtime export.
- apps/kita/tests/features/test-core-01-evidence.spec.ts — TEST-CORE-01 supplied-blocker refusal tests only, separate from existing database/bootstrap tests.

No existing implementation, test, database or runtime file is allowed to change. In particular, all of apps/kita/packages/database/, apps/kita/database/, apps/kita/packages/platform/runtime.ts, apps/kita/packages/platform/validate-environment.ts, apps/kita/apps/api/, and existing database/bootstrap tests are outside the allowlist and must remain byte-for-byte unchanged. Preserve result.ts, context.ts, index.ts, problem/command/event contracts, all landed checkers, platform validators/workers/gate runners, activation-policy.ts, activation.ts, test-depend-01.spec.ts, provider ports/adapters/contracts, OpenAPI/events/SQL, migrations/grants, guards, manifests, source archives, package files/exports and configuration. No barrel, package export, dependency or generated artifact. Do not create or change a runtime/configuration layer, binding schema, database driver/factory, transaction runner, API entry, role/grant definition, evidence manifest, report, fixture or registry. This planning update edits only docs/kita-plan/addenda/NEXT-BATCH.md; existing untracked files are outside the batch. The coordinator must record an exact implementation base containing this plan and descending from the planning baseline, and the exact returned head. Changes between the planning baseline and implementation base other than this planning file require Sol review before implementation. The implementation diff from that recorded base may contain only the three new implementation paths above.

Define exactly this input contract; all five flags are required readonly booleans and there are no optional fields or other accepted input fields:

~~~ts
export interface Core01Input {
  readonly requiredReviewMissing: boolean;
  readonly compositionBoundaryMismatch: boolean;
  readonly runtimeBindingsMissingOrUnsafe: boolean;
  readonly transactionOrPoolSafetyUnproven: boolean;
  readonly requiredEvidenceMissing: boolean;
}
~~~

The flags are supplied assertions only, in the order shown:

- requiredReviewMissing: supplied absence of required architect, pool/runtime/role or independent exact-head Sol review. Accept no actor, reviewer, role, identity, signature, approval record, review date, acknowledgment or authorization function. Do not grant, check, collect or fabricate review or approval.
- compositionBoundaryMismatch: supplied mismatch in target/workspace/API composition or server/client import boundaries, including candidate/contract identity. Accept no path, import/module/package graph, source, target descriptor, head, version, hash, route, actor/entity/identity scope or comparison function. Do not resolve imports, inspect reachability, compare candidates or determine ownership.
- runtimeBindingsMissingOrUnsafe: supplied assertion that required runtime bindings are missing or unsafe. Accept no environment map, process.env, binding name/value, database URL, port, credential, validated binding object, schema or validation function. Do not inspect or validate configuration, apply defaults, sanitize credentials, construct a pool, open a listener, publish readiness or attempt startup.
- transactionOrPoolSafetyUnproven: supplied assertion that required pool/transaction safety is unproven, including isolation/ownership, same-client serializable begin/commit/rollback, finite 40001/40P01 retry/exhaustion, rollback/release/discard ordering and cleanup, least-privilege roles, SET LOCAL context, ordered locks or no external side effects in transaction callbacks. Accept no pool, client, driver, SQL, role/grant, command, callback, transaction runner, structured driver error, attempt budget, backoff or fault trace. Do not implement, simulate, validate, execute or retry any transaction or pool lifecycle. This flag is not an actual SQLSTATE/exhaustion classifier or proof of a defect.
- requiredEvidenceMissing: supplied absence of required current core execution evidence, including actual pool/transaction faults, fail-closed runtime/startup and server/client-boundary proof, real-role PostgreSQL verification or the independent EV(T-CORE-01) record. Accept no evidence document, test result, transcript, DB observation, dependency/approval status, manifest, artifact, signature, timestamp or verification function. Do not run or accept evidence, count tests, compare results, attest PostgreSQL behavior or close DEP-15.

Do not derive, verify or clear these flags. False flags prove no review, candidate identity, safe binding, pool isolation, serializable/rollback/commit/retry behavior, correct role/context/lock/cleanup handling, API/server-client separation or execution evidence. All real conditions remain unverified in every branch, including the all-false fallback. No startup, commit, readiness, permission, evidence acceptance, safe-to-execute or task-complete verdict is possible. Full T-CORE-01 and all dependent full tasks remain HOLD for every input. No sandbox, database, provider, financial, activation or release gate opens.

Define Core01Output = never. Define Core01CommandContext as Pick<WorkerContext, 'workId' | 'attemptGeneration'> using a type-only import from ./context.ts. The exact signature is checkCoreEvidence(ctx: Core01CommandContext, input: Core01Input): Promise<Result<Core01Output, Problem>>. Both context fields are unused metadata and establish no worker, actor, role, review, evidence, pool, transaction or command authority. Do not accept CommandContext, ReadContext, full WorkerContext, trace/capability/execution callbacks, dependencies or extra context fields. The contract type file has no runtime import, export, constant, validator or initialization.

The checker uses type-only imports for Core01 types from ../contracts/src/core-evidence.ts and Problem/Result from ../contracts/src/result.ts. Its only runtime import is the existing err/problem helpers from ../contracts/src/result.ts. Never import a runtime barrel, database/config/runtime/API module, pg/driver, validateEnvironment, validateRuntimeBindings, withSerializable, pool factory, bootstrap helper, source/import inspector, another checker, any success/binding/transaction/report/evidence/permit type, ok/unavailable helper, node module, validator/generator, activation/certification/integration/release/gate runner, provider, store or money utility. Add no dependency or runtime schema. New test imports may use vitest, the new checker and direct new contract type paths (plus UUID from context.ts); no existing runtime, database, platform/domain/provider barrel or helper.

Required behavior in this exact order; the first flag equal to true wins regardless of every lower-priority flag. Compare flags with === true; add no other branch or runtime input validator:

| Condition | Exact error code | HTTP status | retryable | Fixed detail |
|---|---|---|---|---|
| requiredReviewMissing === true | unauthorized | 403 | false | T-CORE-01 supplied missing required architect or independent review blocks core evidence |
| Otherwise compositionBoundaryMismatch === true | stale_or_conflicting_command | 409 | false | T-CORE-01 supplied target/API/server-client composition boundary mismatch blocks core evidence |
| Otherwise runtimeBindingsMissingOrUnsafe === true | invalid_request | 400 | false | T-CORE-01 supplied missing or unsafe runtime bindings block core evidence |
| Otherwise transactionOrPoolSafetyUnproven === true | invalid_request | 400 | false | T-CORE-01 supplied unproven transaction or pool safety blocks core evidence |
| Otherwise requiredEvidenceMissing === true | invalid_request | 400 | false | T-CORE-01 supplied missing required core execution evidence blocks core evidence |
| Otherwise (all five flags false) | dependency_unavailable | 503 | true | T-CORE-01 checkCoreEvidence cannot verify target/API/server-client boundaries, safe runtime bindings, pool isolation, serializable rollback/commit/retry/cleanup behavior, least-privilege roles or current independent review and execution evidence: full T-CORE-01 remains HOLD (fail closed) |

Return only failures with exactly { ok: false, error: { code, status, retryable, detail } }. Use the bounded, non-PII detail strings above verbatim. No extra branch, code, value, kind, operationId, fieldErrors, binding/diagnostic array, SQLSTATE, attempt/retry count, pool/client/transaction object, readiness/permission verdict, report, evaluatedAt, manifest, proof, evidence, authority or other result field. These are supplied-blocker errors; they do not translate actual startup/driver/transaction errors or change existing runtime error semantics. All flags false still refuses with 503. retryable: true authorizes no automatic retry, lookup, configuration repair, pool checkout, transaction, backoff, evidence/review collection, scheduling, provider call, activation or command execution. Never return or manufacture validated bindings, a committed result, a dispatch permit, approval, evidence acceptance or a gate decision.

No persistence or store/database access, including real, test or in-memory substitute stores. No filesystem, directory enumeration, file existence check, source/artifact/archive access, import/binding/route reachability check, schema validation, actual configuration/identity/scope/evidence inspection, Git operation, hashing, manifest generation/comparison, environment read, subprocess, clock, randomness, network, credential access, signature verification/signing, queue/outbox/timer, trace/log/audit/metric emission, cache or state transition. No pool construction/checkout/shutdown, client query/release/discard, BEGIN/COMMIT/ROLLBACK, role/context setting, lock acquisition, retry/backoff, listener/readiness, lifecycle/provider/oracle/test-runner execution by the checker or its new tests. No money arithmetic/reconciliation, ledger/points path, executeCommand, posting, holds, balance mutation, reservation, exposure/servicing change, transfer/operation creation or financial outcome. Accept no paths, bytes, IDs, hashes, versions, timestamps, schemas, registries, mappings, counts, manifests, proofs, artifacts, code, test results, consent/identity records, accounts, tokens, approvals, cap values, amounts, currencies or financial data. The two unused context metadata fields are the only identifiers accepted.

Do not wire the checker into database/configuration/runtime/bootstrap, validateEnvironment, validateBuildBaseline, migrateCore, existing evidence checkers, activation/exposure/servicing workflows, release/gate runners, build/CI gates, API/controllers/workers/UI, workspace/migration scripts, guards, handoff tools, providers or any money workflow. No changes to runbooks, infrastructure, CI, packages/configuration/dependencies/exports, generated clients, frozen OpenAPI/events/SQL, migrations, grants, inventories, manifests, source archives or target-copy decisions. No deployment, production activation, publication, live pilot, GitHub merge or G1-G6 closure. T-CORE-02/T-FIN-01/T-LEDGER-02/T-REWARD-01, T-LIVE-01 and T-GA-01 implementation remains prohibited.

TEST-CORE-01 in the new test-core-01-evidence.spec.ts must cover all 32 boolean combinations in an explicit independently specified expected-results table. In the flag order above, include all sixteen missing-review combinations, all eight remaining composition-mismatch combinations, all four remaining missing/unsafe-binding combinations, both remaining unproven-transaction/pool-safety combinations, the sole remaining missing-evidence combination and the all-false fallback. Expected code/status/retryable/detail must be literal expectations, not computed by copying the checker's if-chain or importing implementation constants. Assert the complete exact error-only result with toStrictEqual, exact top-level/error keys and absence of value/kind/extra binding/transaction/readiness/report/evidence/authority fields for every case. Assert an identical refusal on a repeated call. Object.freeze each input and context, capture their values before calling and verify both remain unchanged after both calls. Use no filesystem fixture, source/configuration/evidence bytes, environment, runtime helper, DB/pool/driver/transaction mock, fake callback/provider, financial data, oracle, clock or randomness. Preserve all existing tests without edits.

These tests establish only supplied-blocker precedence, deterministic refusal and input/context non-mutation. They do not prove the actual T-CORE-01 pool/transaction/runtime/API behavior, server/client boundary, role/context/lock safety, real PostgreSQL verification or EV(T-CORE-01). They do not satisfy full T-CORE-01, T-SCOPE-01, T-BASE-01, T-CONTRACT-01, T-PLAT-01/02, T-DEPEND-01, T-CERT-01, T-INTEGRATE-01, T-RELEASE-01, any related task, CP gap, PACK acceptance, dependency/activation condition or G1-G6. Existing source/scope, migration, workspace/handoff, contract, integration, certification and enablement holds remain open.

Validation required on the returned implementation head (run from apps/kita/):

~~~sh
./node_modules/.bin/vitest run tests/features/test-core-01-evidence.spec.ts tests/features/test-depend-01-evidence.spec.ts tests/features/test-depend-01.spec.ts tests/features/test-cert-01.spec.ts tests/features/test-integrate-01.spec.ts tests/features/test-scope-01.spec.ts tests/features/test-contract-01.spec.ts tests/features/test-release-01.spec.ts tests/features/test-base-01.spec.ts tests/features/test-mig-01.spec.ts tests/features/test-adapter-01.spec.ts tests/features/test-identity-01.spec.ts tests/features/test-quote-01.spec.ts tests/features/test-auth-01.spec.ts tests/features/test-auth-02.spec.ts tests/features/test-auth-03.spec.ts tests/features/test-auth-04.spec.ts tests/features/test-auth-05.spec.ts tests/features/test-auth-06.spec.ts tests/features/test-auth-07.spec.ts
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --noUncheckedIndexedAccess --exactOptionalPropertyTypes packages/contracts/src/core-evidence.ts
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --noUncheckedIndexedAccess --exactOptionalPropertyTypes packages/platform/check-core-evidence.ts
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --noUncheckedIndexedAccess --exactOptionalPropertyTypes packages/contracts/src/dependency-evidence.ts packages/platform/check-dependency-evidence.ts packages/contracts/src/certification-evidence.ts packages/platform/check-certification-evidence.ts packages/contracts/src/integration-evidence.ts packages/platform/check-integration-evidence.ts packages/contracts/src/original-spec-crosswalk.ts packages/platform/check-original-spec-crosswalk.ts packages/contracts/src/contract-freeze.ts packages/platform/check-contract-freeze.ts packages/contracts/src/release.ts packages/platform/check-release-evidence.ts packages/contracts/src/workspace.ts packages/platform/check-workspace-evidence.ts
./node_modules/.bin/tsc --noEmit --project packages/contracts/tsconfig.json
./node_modules/.bin/tsc --noEmit --project packages/contracts/tsconfig.json --allowImportingTsExtensions
~~~

Rerun the existing provider refusal suite using the following temporary configuration. The default Kita config excludes tests/providers; passing that file to the default config does not establish a provider test result. This validation harness writes only under /tmp, pins the root to the current Kita slice and removes the temporary config afterward; it is not an implementation file or permission to change tracked configuration. Filesystem/subprocess activity here belongs to the reviewer harness; the checker and its new tests remain inert. These four existing provider refusal cases exercise no real provider and certify no outcome. No existing database/bootstrap suite or PostgreSQL execution is authorized by this checker batch.

~~~sh
python3 - <<'PYTEST'
from pathlib import Path
import json
import subprocess
import tempfile

root = Path.cwd().resolve()
with tempfile.TemporaryDirectory(prefix='kita-core01-review-', dir='/tmp') as temp:
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

At the planning baseline, the unmodified contracts package check fails (exit 2) with 15 diagnostics. With explicit --allowImportingTsExtensions it fails (exit 2) with the same five registry diagnostics below. Both were rerun at 0d095a2. These are existing failing gates, not waived or passed checks:

| Existing diagnostic location (relative to apps/kita/) | Code | Diagnostic |
|---|---|---|
| packages/contracts/src/auth.ts(15,39) | TS5097 | An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled. |
| packages/contracts/src/commands.ts(108,14) | TS2502 | 'COMMAND_OPERATIONS' is referenced directly or indirectly in its own type annotation. |
| packages/contracts/src/commands.ts(345,13) | TS2456 | Type alias 'CommandOperationId' circularly references itself. |
| packages/contracts/src/events.ts(78,14) | TS2502 | 'DOMAIN_EVENT_TYPES' is referenced directly or indirectly in its own type annotation. |
| packages/contracts/src/events.ts(125,13) | TS2456 | Type alias 'DomainEventType' circularly references itself. |
| packages/contracts/src/events.ts(129,27) | TS7006 | Parameter 't' implicitly has an 'any' type. |
| packages/contracts/src/freeze-contracts.ts(10,61) | TS5097 | An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled. |
| packages/contracts/src/index.ts(5,15), (6,15), (7,15), (8,15), (9,15), (10,15), (11,15), (12,15) — eight diagnostics | TS5097 | An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled. |

Require all 32 new refusal cases and all 509 baseline feature cases to pass (541 feature cases across twenty files), the four existing provider cases to pass separately, both new strict isolated checks and the existing fourteen-file strict isolated check above to pass without diagnostics. Rerun and report both full contracts package checks separately with actual exit statuses and complete diagnostics. Preserve the exact existing diagnostic identities and locations because all existing files are outside the allowlist. Do not suppress diagnostics, change configuration, fix unrelated files or treat existing package failures as closed. This planning decision validates no subsequent implementation. Any new diagnostic, changed existing failure, failed/missing test, need for actual configuration/import/identity/review/evidence/DB/pool/transaction/provider/financial/hash/store access or scope expansion returns to Sol as BATCH-HOLD.

Inspect the complete final diff and imports for side effects, success/binding/transaction/readiness/permission/report/evidence/authority paths, indirect access to database/runtime/bootstrap/activation/certification/integration/release/gate runners or other checkers, and changes outside the three allowed implementation paths. Explicitly verify all existing database, runtime, API, package/export, activation and test paths are unchanged from the recorded implementation base. Return the coordinator-recorded implementation base, exact implementation head, changed-file list, full diff and complete test/type-check outcomes for Codex Sol max review. No full task, connected feature or gate closes merely because refusal tests pass.

Implementation follows the established roles: Qoder CLI Efficient Agent Teams/subagents on gpu-fqaf implement the authorized checker; coordinator handles sync/bundles/GitHub; Codex Sol max reviews the returned batch. This document authorizes only the specified limited checker; it does not start implementation, a swarm, database/runtime/API repair, configuration inspection, evidence collection/acceptance, lifecycle/provider/financial-oracle runs, hashing, release assembly, a gate runner, an activation or a store. If the checker cannot fit these constraints, stop the batch and report BATCH-HOLD with the reason. Money path closed; full T-CORE-01, T-CORE-02/T-FIN-01/T-LEDGER-02/T-REWARD-01 and T-LIVE-01/T-GA-01 remain HOLD; no production, live-pilot or G1-G6 approval.
