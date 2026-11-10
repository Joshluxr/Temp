BATCH-OK

Authorize only the T-INTEGRATE-01 integration-blockers checkIntegrationEvidence LIMITED PURE boolean-input fail-closed checker specified below. Full T-INTEGRATE-01 remains HOLD. Money path closed. Never authorize ok: true, executeCommand, ledger posting, financial execution, persistence or stores. T-CORE-02, T-FIN-01, T-LEDGER-02 and T-REWARD-01 remain HOLD; no implementation, scaffold or new checker for those tasks is authorized. T-LIVE-01 and T-GA-01 remain HOLD with no implementation or new checker authorized. No production, live pilot or G1-G6 closure is authorized.

Planning baseline: 70747ff61e1d87b36afa51c99207302f3c4138ae on cursor/kita-scope01-check-original-spec-crosswalk-05a3 (PR #110 supplied by the operator). T-SCOPE-01 checkOriginalSpecCrosswalk has landed as a refusal-only checker; full T-SCOPE-01 remains HOLD. Local rechecks at this exact head: TEST-SCOPE-01 64 passed; together with TEST-CONTRACT-01, TEST-RELEASE-01, TEST-BASE-01, TEST-MIG-01, TEST-ADAPTER-01, TEST-IDENTITY-01, TEST-QUOTE-01 and TEST-AUTH-01 through TEST-AUTH-07, 342 feature tests passed across fifteen files (exit 0). The four existing tests/providers/outcome-contract.spec.ts cases passed separately (exit 0) using a temporary configuration because the default Kita Vitest include covers only tests/features. Strict isolated checking of original-spec-crosswalk.ts, check-original-spec-crosswalk.ts, contract-freeze.ts, check-contract-freeze.ts, release.ts, check-release-evidence.ts, workspace.ts and check-workspace-evidence.ts passed together (exit 0). The full contracts package checks still fail as recorded below. These results establish no integration, scope acceptance, certification, release authority or gate closure. The three proposed T-INTEGRATE-01 files are absent at this baseline; no proposed implementation has been tested.

Selection basis: [13-backlog.md T-INTEGRATE-01](../13-backlog.md#t-integrate-01--wire-and-verify-every-feature-api-operation-ui-worker-and-operating-procedure-on-one-candidate) requires one exact candidate and refuses missing implementation, skipped scenarios, stale head and unexplained financial breaks. [12-tests-gates.md L9](../12-tests-gates.md#l9-six-sequential-release-stages) requires exact-head Sol review, complete integration and real execution evidence for G1/G2. CP-05 and CP-11 in [COMPLETENESS-PASS.md](../COMPLETENESS-PASS.md) remain open. Backlog M2 supplies unauthorized / 403, stale_or_conflicting_command / 409, invalid_request / 400 and dependency_unavailable / 503. These requirements support a disconnected supplied-blocker refusal contract only. This batch does not perform verifyIntegration, wire a feature, inspect a candidate, collect evidence, run a lifecycle or financial oracle, reconcile money or make a G1/G2 decision.

For this batch, this document is the sole implementation authorization and replaces the previous NEXT-BATCH.md T-SCOPE-01 authorization. Preserve all other addenda; their older broader permissions do not authorize work in this batch. Do not import, call, wrap, modify, extend, re-export or test verifyIntegration, evaluateReleaseGates, reconcileScope, freezeContracts, evaluateActivation, certifyProvider or their success/report/hash/clock/execution paths. No full task, prerequisite, CP gap, DEP condition or gate is satisfied by this checker.

Selection decisions in operator preference order:

| Candidate | Decision | Reason |
|---|---|---|
| T-INTEGRATE-01 supplied integration blockers only | BATCH-OK for checkIntegrationEvidence below only; full task HOLD | Supplied booleans permit deterministic refusals without artifact inspection, integration bindings, workflow execution, persistence or money. |
| T-CERT-01 | HOLD; not authorized in this batch | Defer behind the selected T-INTEGRATE-01 checker; actual certification still requires provider/account/method sandbox, device, acknowledgment and Finance evidence. |
| T-DEPEND-01 | HOLD; not authorized in this batch | Defer behind the selected checker; existing activation policy stays unchanged and no DEP approvals, evidence collection or enablement is authorized. |
| T-CORE-01 | HOLD for new work in this batch | Defer behind the preferred checker; existing pool, transaction, runtime and API composition boundaries are outside this allowlist. |
| T-LIVE-01 | HOLD; prohibited | Live-pilot preparation, execution, reconciliation and a new checker are expressly outside authorization. |
| T-GA-01 | HOLD; prohibited | Launch decisions, staged exposure and a new checker are expressly outside authorization. |
| T-CORE-02 / T-FIN-01 / T-LEDGER-02 / T-REWARD-01 | HOLD; prohibited | Money-path execution, durable command authority, ledger/finance/reward implementation, scaffolds and new checkers remain outside authorization. |
| Production / live pilot / G1-G6 | HOLD; prohibited | No activation, deployment, gate runner, release sign-off or gate closure is authorized. |

Implementation allowlist: create only these three files, relative to repository root:

- apps/kita/packages/contracts/src/integration-evidence.ts — type-only Integrate01Input, Integrate01Output and Integrate01CommandContext declarations.
- apps/kita/packages/platform/check-integration-evidence.ts — one standalone inert checkIntegrationEvidence checker with no other runtime export.
- apps/kita/tests/features/test-integrate-01.spec.ts — TEST-INTEGRATE-01 supplied-blocker refusal tests only.

No other implementation file is allowed. Preserve all existing files, including contracts/result.ts, context.ts, index.ts, commands.ts, events.ts, all landed checkers, platform validators/gate runners, activation-policy.ts, providers/ports.ts, all OpenAPI/events/SQL, guards, manifests, source archives and existing tests. No barrel or package export. Do not create or change integration bindings, tests/e2e/full-lifecycle.spec.ts, tests/concurrency/financial-races.spec.ts, tests/release/coverage.spec.ts, evidence/releases/manifest.schema.json or any integration/coverage/evidence report, manifest or schema. This planning update edits only docs/kita-plan/addenda/NEXT-BATCH.md; existing untracked files are outside the batch. The coordinator must record an exact implementation base containing this plan and descending from the planning baseline, and the exact returned head. Changes between the planning baseline and implementation base other than this planning file require Sol review before implementation. The implementation diff from that recorded base may contain only the three new implementation paths above.

Define exactly this input contract; all six flags are required readonly booleans and there are no optional fields or other accepted input fields:

~~~ts
export interface Integrate01Input {
  readonly requiredReviewMissing: boolean;
  readonly candidateMismatch: boolean;
  readonly candidateStale: boolean;
  readonly requiredImplementationMissing: boolean;
  readonly requiredScenarioSkipped: boolean;
  readonly unexplainedFinancialBreakPresent: boolean;
}
~~~

The flags are supplied assertions only, in the order shown:

- requiredReviewMissing: supplied absence of required architect or exact-head Sol integration review. Accept no reviewer identity, role, approval record, signature or authorization-checking function.
- candidateMismatch: supplied mismatch between the proposed integration candidate and the candidate referenced by integration evidence. Accept no candidate, commit, artifact, digest, version, evidence reference or comparison function.
- candidateStale: supplied stale integration candidate/head. Accept no head, timestamp, freshness window, clock or Git lookup. Do not determine staleness.
- requiredImplementationMissing: supplied absence of a required feature/API/UI/worker/operating-procedure implementation. Accept no implementation, feature/operation map, binding, file, module, inventory or reachability-checking function.
- requiredScenarioSkipped: supplied skipped required integration scenario. Accept no scenario, result, test runner, coverage map, exclusion list, fixture or execution callback.
- unexplainedFinancialBreakPresent: supplied presence of an unexplained financial break blocking integration. This is a bare refusal assertion; accept no financial data, journal, balance, bank/provider statement, oracle or reconciliation function. Do not calculate, investigate, repair or clear a break.

Do not derive, verify or clear these flags. False flags prove no review, candidate identity/freshness, implementation completeness, scenario execution, explained financial positions or integration coverage. Every integration prerequisite and all actual evidence remain unverified in every branch, including the all-false fallback. Do not infer feature connectivity, code completeness, internal verification, certification eligibility, dependency satisfaction or release readiness. Full T-INTEGRATE-01 and all dependent full tasks remain HOLD for every input. No financial, activation or release gate opens.

Define Integrate01Output = never. Define Integrate01CommandContext as Pick<WorkerContext, 'workId' | 'attemptGeneration'> using a type-only import from ./context.ts. The exact signature is checkIntegrationEvidence(ctx: Integrate01CommandContext, input: Integrate01Input): Promise<Result<Integrate01Output, Problem>>. Both context fields are unused metadata and establish no worker, actor, reviewer, candidate, integration or command authority. Do not accept CommandContext, ReadContext, full WorkerContext, transaction runners, trace/capability/execution callbacks, dependencies or extra context fields. The contract type file has no runtime import, export, constant, validator or initialization.

The checker uses type-only imports for Integrate01 types from ../contracts/src/integration-evidence.ts and Problem/Result from ../contracts/src/result.ts. Its only runtime import is the existing err/problem helpers from ../contracts/src/result.ts. Never import a runtime barrel, verifyIntegration, evaluateReleaseGates, reconcileScope, freezeContracts, evaluateActivation, certifyProvider, ReleaseCandidate, ReleaseScope, GateReport, any success/report/evidence type, ok/unavailable helpers, node modules, crypto, validators, generators, release/gate runners, providers, stores, money utilities or another checker. Add no dependency or runtime schema. Test imports may use vitest, the new checker and direct contract type paths (including UUID from context.ts); no contract/platform/provider barrel or existing integration/scope/freeze/activation helper.

Required behavior in this exact order; the first flag equal to true wins regardless of every lower-priority flag. Compare flags with === true; add no other branch or runtime input validator:

| Condition | Exact error code | HTTP status | retryable | Fixed detail |
|---|---|---|---|---|
| requiredReviewMissing === true | unauthorized | 403 | false | T-INTEGRATE-01 supplied missing required architect or exact-head Sol integration review blocks integration evidence |
| Otherwise candidateMismatch === true | stale_or_conflicting_command | 409 | false | T-INTEGRATE-01 supplied candidate mismatch blocks integration evidence |
| Otherwise candidateStale === true | stale_or_conflicting_command | 409 | false | T-INTEGRATE-01 supplied stale candidate blocks integration evidence |
| Otherwise requiredImplementationMissing === true | invalid_request | 400 | false | T-INTEGRATE-01 supplied missing required implementation blocks integration evidence |
| Otherwise requiredScenarioSkipped === true | invalid_request | 400 | false | T-INTEGRATE-01 supplied skipped required scenario blocks integration evidence |
| Otherwise unexplainedFinancialBreakPresent === true | invalid_request | 400 | false | T-INTEGRATE-01 supplied unexplained financial break blocks integration evidence |
| Otherwise (all six flags false) | dependency_unavailable | 503 | true | T-INTEGRATE-01 checkIntegrationEvidence cannot verify exact-candidate identity, freshness, review, implementation connectivity, scenario execution or financial-break disposition: full T-INTEGRATE-01 remains HOLD (fail closed) |

Return only failures with exactly { ok: false, error: { code, status, retryable, detail } }. Use the bounded, non-PII detail strings above verbatim. No extra branch, code, value, kind, operationId, fieldErrors, report, finding, candidate/scope/freeze/gate state, blocker list, count, digest, manifest, proof, permission, evidence, authority or other result field. All flags false still refuses with 503. retryable: true authorizes no automatic retry, candidate lookup, evidence collection, review collection, scheduling, activation or command execution. Return no complete/verified/accepted/eligible/ready/covered verdict, GateReport, integration/coverage report, ReleaseEvidenceBundle or G1/G2 decision. Never claim integration, implementation completeness, financial reconciliation, acceptance, approval or readiness.

No persistence or store/database access, including real, test or in-memory substitute stores. No filesystem, directory enumeration, file existence check, artifact/source/archive access, import/binding/route reachability checks, schema validation, feature/operation/scenario coverage or set comparison, actual candidate comparison/freshness check, OpenAPI lint/generation/drift scan, Git operation, hashing, manifest generation/comparison, environment read, subprocess, clock, randomness, network, credentials, signature verification/signing, queue/outbox/timer, trace/log/audit/metric emission, cache or state transition. No test-runner, lifecycle, concurrency, physical-device, provider or financial-oracle execution by the checker or its new tests. No money arithmetic, financial reconciliation, ledger/points path, executeCommand, posting, holds, approval, balance mutation, reservation, transfer/operation creation or financial outcome. Accept no paths, bytes, IDs, hashes, versions, timestamps, schemas, registries, mappings, counts, manifests, proofs, artifacts, code, test results, consent/identity records, accounts, tokens, provider references/outcomes, approvals, cap values, amounts, currencies or financial data. The two unused context metadata fields are the only identifiers accepted.

Do not wire the checker into verifyIntegration, release/gate runners, build/CI gates, API/controllers/workers/UI, workspace/migration scripts, guards, handoff tools, provider ports or any money workflow. No changes to runbooks, infrastructure, CI, packages/configuration/dependencies, generated clients, frozen OpenAPI/events/SQL, migrations, grants, inventories, manifests, source archives or target-copy migration decisions. No deployment, production activation, publication, live pilot, GitHub merge or G1-G6 closure. T-CORE-02/T-FIN-01/T-LEDGER-02/T-REWARD-01, T-LIVE-01 and T-GA-01 implementation remains prohibited.

TEST-INTEGRATE-01 must cover all 64 boolean combinations in an explicit independently specified expected-results table. In the flag order above, include all 32 missing-review combinations, all 16 remaining candidate-mismatch combinations, all eight remaining stale-candidate combinations, all four remaining missing-implementation combinations, both remaining skipped-scenario combinations, the sole remaining unexplained-financial-break combination and the all-false fallback. Expected code/status/retryable/detail must be literal expectations, not computed by copying the checker's if-chain or importing implementation constants. Assert the complete exact error-only result with toStrictEqual, exact top-level/error keys and absence of value/kind/extra candidate/report/evidence/authority fields for every case. Assert an identical refusal on a repeated call. Object.freeze each input and context, capture their values before calling and verify both remain unchanged after both calls. Use no filesystem fixture, source/artifact/candidate bytes, mappings, actual coverage or candidate validation, hash/signature, mocked store, fake provider, financial data, oracle, clock or randomness. Preserve all existing tests without edits.

These tests establish only supplied-blocker precedence, deterministic refusal and input/context non-mutation. They do not prove exact-candidate identity/freshness, review, connected implementation, scenario execution, financial reconciliation or EV(T-INTEGRATE-01). They do not satisfy full T-INTEGRATE-01, T-SCOPE-01, T-CONTRACT-01, T-BASE-01, T-CERT-01, T-DEPEND-01, T-CORE-01, T-RELEASE-01, any related task, CP gap, PACK acceptance, dependency/activation condition or G1-G6. Existing source/scope, migration, workspace/handoff, contract, integration, certification and enablement holds remain open.

Validation required on the returned implementation head (run from apps/kita/):

~~~sh
./node_modules/.bin/vitest run tests/features/test-integrate-01.spec.ts tests/features/test-scope-01.spec.ts tests/features/test-contract-01.spec.ts tests/features/test-release-01.spec.ts tests/features/test-base-01.spec.ts tests/features/test-mig-01.spec.ts tests/features/test-adapter-01.spec.ts tests/features/test-identity-01.spec.ts tests/features/test-quote-01.spec.ts tests/features/test-auth-01.spec.ts tests/features/test-auth-02.spec.ts tests/features/test-auth-03.spec.ts tests/features/test-auth-04.spec.ts tests/features/test-auth-05.spec.ts tests/features/test-auth-06.spec.ts tests/features/test-auth-07.spec.ts
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --noUncheckedIndexedAccess --exactOptionalPropertyTypes packages/contracts/src/integration-evidence.ts
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --noUncheckedIndexedAccess --exactOptionalPropertyTypes packages/platform/check-integration-evidence.ts
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --noUncheckedIndexedAccess --exactOptionalPropertyTypes packages/contracts/src/original-spec-crosswalk.ts packages/platform/check-original-spec-crosswalk.ts packages/contracts/src/contract-freeze.ts packages/platform/check-contract-freeze.ts packages/contracts/src/release.ts packages/platform/check-release-evidence.ts packages/contracts/src/workspace.ts packages/platform/check-workspace-evidence.ts
./node_modules/.bin/tsc --noEmit --project packages/contracts/tsconfig.json
./node_modules/.bin/tsc --noEmit --project packages/contracts/tsconfig.json --allowImportingTsExtensions
~~~

Rerun the existing provider refusal suite using the following temporary configuration. The default Kita config excludes tests/providers; passing that file to the default config does not establish a provider test result. This validation harness writes only under /tmp, pins the root to the current Kita slice and removes the temporary config afterward; it is not an implementation file or permission to change tracked configuration. Filesystem/subprocess activity here belongs to the reviewer harness; the checker and its new tests remain inert.

~~~sh
python3 - <<'PYTEST'
from pathlib import Path
import json
import subprocess
import tempfile

root = Path.cwd().resolve()
with tempfile.TemporaryDirectory(prefix='kita-integrate01-review-', dir='/tmp') as temp:
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

At the planning baseline, the unmodified contracts package check fails (exit 2) with 15 diagnostics. With explicit --allowImportingTsExtensions it fails (exit 2) with the same five registry diagnostics below. Both were rerun at 70747ff. These are existing failing gates, not waived or passed checks:

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

Require all 64 new refusal cases and all 342 baseline scope/contract/release/workspace/migration/adapter/identity/quote/AUTH cases to pass (406 feature cases across sixteen files), the four existing provider cases to pass separately, both new strict isolated checks and the existing strict isolated scope/contract/release/workspace check above to pass without diagnostics. Rerun and report both full contracts package checks separately with actual exit statuses and complete diagnostics. Preserve the exact existing diagnostic identities and locations because all existing files are outside the allowlist. Do not suppress diagnostics, change configuration, fix unrelated files or treat existing package failures as closed. This planning decision validates no subsequent implementation. Any new diagnostic, changed existing failure, failed/missing test, need for actual candidate/review/implementation/scenario/coverage/financial/hash/store access or scope expansion returns to Sol as BATCH-HOLD.

Inspect the complete final diff and imports for effects, success/coverage/report/evidence/authority paths, indirect access to integration/certification/activation/release/gate runners or other checkers, and changes outside the three allowed implementation paths. Return the coordinator-recorded implementation base, exact implementation head, changed-file list, full diff and complete test/type-check outcomes for Codex Sol max review. No full task, connected feature or gate closes merely because refusal tests pass.

Implementation follows the established roles: Qoder CLI Efficient Agent Teams/subagents on gpu-fqaf implement the authorized checker; coordinator handles sync/bundles/GitHub; Codex Sol max reviews the returned batch. This document authorizes only the specified limited checker; it does not start implementation, a swarm, integration wiring, candidate inspection, review/evidence collection, lifecycle/device/provider/financial-oracle runs, hashing, release assembly, a gate runner, an activation or a store. If the checker cannot fit these constraints, stop the batch and report BATCH-HOLD with the reason. Money path closed; T-LIVE-01/T-GA-01 remain prohibited; no production, live-pilot or G1-G6 approval.
