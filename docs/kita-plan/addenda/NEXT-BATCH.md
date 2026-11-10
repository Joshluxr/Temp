BATCH-OK

Authorize only the T-SCOPE-01 original-spec-crosswalk-blockers checkOriginalSpecCrosswalk LIMITED PURE boolean-input fail-closed checker specified below. Full T-SCOPE-01 remains HOLD. Money path closed. Never authorize ok: true, executeCommand, ledger posting, financial execution, persistence or stores. T-CORE-02, T-FIN-01, T-LEDGER-02 and T-REWARD-01 remain HOLD; no implementation, scaffold or new checker for those tasks is authorized. No production, live pilot or G1-G6 closure is authorized.

Planning baseline: d8a850ddeebf008227e19f200cc3fb2c1cf42b82 on cursor/kita-contract01-check-contract-freeze-05a3 (PR #109 supplied by the operator). T-CONTRACT-01 checkContractFreeze has landed as a refusal-only checker; full T-CONTRACT-01 remains HOLD. Local rechecks at this exact head: TEST-CONTRACT-01 64 passed; together with TEST-RELEASE-01, TEST-BASE-01, TEST-MIG-01, TEST-ADAPTER-01, TEST-IDENTITY-01, TEST-QUOTE-01 and TEST-AUTH-01 through TEST-AUTH-07, 278 feature tests passed across fourteen files (exit 0). The four existing tests/providers/outcome-contract.spec.ts cases passed separately (exit 0) using a temporary configuration because the default Kita Vitest include covers only tests/features. Strict isolated checking of contract-freeze.ts, check-contract-freeze.ts, release.ts, check-release-evidence.ts, workspace.ts and check-workspace-evidence.ts passed together (exit 0). The full contracts package checks still fail as recorded below. These results establish no source recovery, original-spec coverage, scope acceptance, contract freeze or release authority. The three proposed T-SCOPE-01 files are absent at this baseline; no proposed implementation has been tested.

Selection basis: [13-backlog.md T-SCOPE-01](../13-backlog.md#t-scope-01--establish-the-available-source-baseline-and-recover-the-original-spec-crosswalk) requires explicit covered/gap/conflict rows, duplicate/unmapped-requirement and required-scenario checks, and Product/Sol scope review; a missing original specification must never produce fabricated coverage. [02-traceability-matrix.md](../02-traceability-matrix.md#missing-original-specification-crosswalk) and CP-00 in [COMPLETENESS-PASS.md](../COMPLETENESS-PASS.md) preserve original IDs and require reviewed mapping to stable KITA IDs. Backlog M2 supplies unauthorized / 403, stale_or_conflicting_command / 409, invalid_request / 400 and dependency_unavailable / 503. This supports a disconnected supplied-blocker refusal contract only. DEP-00 still blocks original-spec conformance; DEP-13 source completeness remains open. This batch neither recovers sources nor performs reconcileScope, builds a crosswalk, compares sets, hashes sources or claims coverage. Archive F-* and plan-assigned KITA-* IDs cannot substitute for missing original-spec IDs.

For this batch, this document is the sole implementation authorization and replaces the previous NEXT-BATCH.md T-CONTRACT-01 authorization. Preserve all other addenda, including T-CONTRACT-01-BATCH.md and its older broader freeze/hash permissions; none authorizes work in this batch. Do not import, call, wrap, modify, extend, re-export or test freezeContracts, reconcileScope or their success/report/hash/clock paths. No full task, prerequisite, CP gap, DEP-00/13 condition or gate is satisfied by this checker.

Selection decisions:

| Candidate | Decision | Reason |
|---|---|---|
| T-SCOPE-01 original-spec crosswalk blockers only | BATCH-OK for checkOriginalSpecCrosswalk below only; full task HOLD | Supplied booleans can produce deterministic refusals without source recovery, requirement rows, hashing, reconciliation or a coverage verdict. |
| T-CONTRACT-01 and prior limited-checker tasks | Full tasks HOLD | Landed refusal-only checks establish no actual source/scope, workspace, migration, contract, integration, certification or release acceptance. |
| T-CORE-02 / T-FIN-01 / T-LEDGER-02 / T-REWARD-01 | HOLD; prohibited | Money-path execution, durable command authority, ledger/finance/reward implementation, scaffolds and new checkers remain outside authorization. |
| Production / live pilot / G1-G6 | HOLD; prohibited | No activation, deployment, gate runner, release sign-off or gate closure is authorized. |

Implementation allowlist: create only these three files, relative to repository root:

- apps/kita/packages/contracts/src/original-spec-crosswalk.ts — type-only Scope01Input, Scope01Output and Scope01CommandContext declarations.
- apps/kita/packages/platform/check-original-spec-crosswalk.ts — one standalone inert checkOriginalSpecCrosswalk checker with no other runtime export.
- apps/kita/tests/features/test-scope-01.spec.ts — TEST-SCOPE-01 supplied-blocker refusal tests only.

No other implementation file is allowed. Preserve all existing files, including contracts/result.ts, context.ts, index.ts, commands.ts, events.ts, freeze-contracts.ts, every landed checker, platform validators/gate runners, providers/ports.ts, all OpenAPI/events/SQL, guards, manifests, source archives and existing tests. No barrel or package export. Do not create or change docs/requirements/source-manifest.json, original-crosswalk.md, scope.md, any other source manifest, crosswalk, scope record, compatibility matrix, generator, signing/hash tool or freeze record. This planning update edits only docs/kita-plan/addenda/NEXT-BATCH.md; existing untracked files are outside the batch. The coordinator must record an exact implementation base containing this plan and descending from the planning baseline, and the exact returned head. Changes between the planning baseline and implementation base other than this planning file require Sol review before implementation. The implementation diff from that recorded base may contain only the three new implementation paths above.

Define exactly this input contract; all six flags are required readonly booleans and there are no optional fields or other accepted input fields:

~~~ts
export interface Scope01Input {
  readonly requiredReviewMissing: boolean;
  readonly originalSpecMissing: boolean;
  readonly duplicateOriginalRequirementPresent: boolean;
  readonly crosswalkConflictPresent: boolean;
  readonly unmappedOriginalRequirementPresent: boolean;
  readonly unmappedRequiredScenarioPresent: boolean;
}
~~~

The flags are supplied assertions only, in the order shown:

- requiredReviewMissing: supplied absence of required Product or Sol scope review. Accept no reviewer identity, role, approval record, signature or authorization-checking function.
- originalSpecMissing: supplied absence of the full original user specification and original feature IDs. Accept no source path, source text/bytes, archive, manifest, provenance record or recovery callback. Do not check whether any source exists.
- duplicateOriginalRequirementPresent: supplied duplicate original requirement in the proposed crosswalk. Accept no requirement ID, row, set, count or duplicate-detection function.
- crosswalkConflictPresent: supplied conflicting mapping between original requirements/scenarios and stable KITA IDs. Accept no mapping, conflict row, ownership record or reconciliation function.
- unmappedOriginalRequirementPresent: supplied original requirement without a crosswalk mapping. Accept no requirement, target ID, feature/test/task matrix or set-comparison function.
- unmappedRequiredScenarioPresent: supplied required original-spec scenario without a crosswalk mapping. Accept no scenario, scenario register, fixture, test result or coverage-checking function.

Do not derive, verify or clear these flags. False flags prove no review, recovered original specification, source integrity, unique/unambiguous mappings, mapped requirements, mapped scenarios or coverage. All source, mapping and review evidence remains unverified in every branch, including the all-false fallback. Do not infer scope acceptance, completeness, dependency satisfaction, contract-freeze eligibility or permission for dependent streams. Full T-SCOPE-01, DEP-00/13, all dependent full tasks and all financial/activation gates remain HOLD for every input.

Define Scope01Output = never. Define Scope01CommandContext as Pick<WorkerContext, 'workId' | 'attemptGeneration'> using a type-only import from ./context.ts. The exact signature is checkOriginalSpecCrosswalk(ctx: Scope01CommandContext, input: Scope01Input): Promise<Result<Scope01Output, Problem>>. Both context fields are unused metadata and establish no worker, actor, reviewer, source, scope or command authority. Do not accept CommandContext, ReadContext, full WorkerContext, transaction runners, trace/capability/execution callbacks, dependencies or extra context fields. The contract type file has no runtime import, export, constant, validator or initialization.

The checker uses type-only imports for Scope01 types from ../contracts/src/original-spec-crosswalk.ts and Problem/Result from ../contracts/src/result.ts. Its only runtime import is the existing err/problem helpers from ../contracts/src/result.ts. Never import a runtime barrel, reconcileScope, freezeContracts, SourceManifest, Requirement, CoverageReport, any freeze-contracts.ts type or value, ok/unavailable helpers, node modules, crypto, validators, generators, release/gate runners, providers, stores, money utilities or another checker. Add no dependency or runtime schema. Test imports may use vitest, the new checker and direct contract type paths (including UUID from context.ts); no contract/platform/provider barrel or existing scope/freeze/activation helper.

Required behavior in this exact order; the first flag equal to true wins regardless of every lower-priority flag:

| Condition | Exact error code | HTTP status | retryable | Fixed detail |
|---|---|---|---|---|
| requiredReviewMissing === true | unauthorized | 403 | false | T-SCOPE-01 supplied missing required Product or Sol scope review blocks original-spec crosswalk |
| Otherwise originalSpecMissing === true | dependency_unavailable | 503 | true | T-SCOPE-01 supplied missing original specification blocks original-spec crosswalk |
| Otherwise duplicateOriginalRequirementPresent === true | stale_or_conflicting_command | 409 | false | T-SCOPE-01 supplied duplicate original requirement blocks original-spec crosswalk |
| Otherwise crosswalkConflictPresent === true | stale_or_conflicting_command | 409 | false | T-SCOPE-01 supplied conflicting mapping blocks original-spec crosswalk |
| Otherwise unmappedOriginalRequirementPresent === true | invalid_request | 400 | false | T-SCOPE-01 supplied unmapped original requirement blocks original-spec crosswalk |
| Otherwise unmappedRequiredScenarioPresent === true | invalid_request | 400 | false | T-SCOPE-01 supplied unmapped required scenario blocks original-spec crosswalk |
| Otherwise (all six flags false) | dependency_unavailable | 503 | true | T-SCOPE-01 checkOriginalSpecCrosswalk cannot verify original sources, unique mappings, conflicts, requirement or scenario coverage, source hashes or Product/Sol review: full T-SCOPE-01 remains HOLD (fail closed) |

Return only failures with exactly { ok: false, error: { code, status, retryable, detail } }. Use the bounded, non-PII detail strings above verbatim. No extra branch, code, value, kind, operationId, fieldErrors, report, finding, source/scope/freeze/gate state, crosswalk row, blocker list, count, digest, manifest, proof, permission, evidence, authority or other result field. All flags false still refuses with 503. retryable: true authorizes no automatic retry, source recovery, review collection, hashing, reconciliation, evidence collection, scheduling, activation or command execution. Return no complete/verified/accepted/eligible/ready/covered verdict, CoverageReport, SourceManifest, crosswalk, ContractManifest or ReleaseEvidenceBundle. Never claim source integrity, original-spec conformance, coverage, scope review, acceptance, approval or readiness.

No persistence or store/database access, including real, test or in-memory substitute stores. No filesystem, directory enumeration, file existence check, archive access/extraction, source modification, parsing/schema validation, source-ID extraction, actual duplicate/unmapped/conflict detection, matrix/set comparison, OpenAPI lint/generation/drift scan, import/DAG scan, hashing, manifest/crosswalk generation/comparison, Git operation, environment read, subprocess, clock, randomness, network, credentials, signature verification/signing, queue/outbox/timer, trace/log/audit/metric emission, cache or state transition. No money arithmetic, ledger/points path, executeCommand, posting, holds, approval, balance mutation, reservation, transfer/operation creation or financial outcome. Accept no paths, source/requirement/scenario/definition bytes, original or KITA IDs, hashes, versions, schemas, registries, gap addenda, manifests, proofs, artifacts, code, test results, consent/identity records, accounts, tokens, provider references/outcomes, approvals, cap values, amounts, currencies or financial data. The two unused context metadata fields are the only identifiers accepted.

Do not wire the checker into reconcileScope, freezeContracts, generators, release/gate runners, build/CI gates, API/controllers/workers/UI, workspace/migration scripts, guards, handoff tools, provider ports or any money workflow. No changes to runbooks, infrastructure, CI, packages/configuration/dependencies, generated clients, frozen OpenAPI/events/SQL, migrations, grants, inventories, manifests, source archives or target-copy migration decisions. No deployment, production activation, publication, live pilot, GitHub merge or G1-G6 closure. T-CORE-02/T-FIN-01/T-LEDGER-02/T-REWARD-01 implementation remains prohibited.

TEST-SCOPE-01 must cover all 64 boolean combinations in an explicit independently specified expected-results table. In the flag order above, include all 32 missing-review combinations, all 16 remaining missing-original-spec combinations, all eight remaining duplicate-original-requirement combinations, all four remaining crosswalk-conflict combinations, both remaining unmapped-original-requirement combinations, the sole remaining unmapped-required-scenario combination and the all-false fallback. Expected code/status/retryable/detail must be literal expectations, not computed by copying the checker's if-chain or importing implementation constants. Assert the complete exact error-only result with toStrictEqual, exact top-level/error keys and absence of value/kind/extra source/crosswalk/report/evidence/authority fields for every case. Assert an identical refusal on a repeated call. Object.freeze each input and context, capture their values before calling and verify both remain unchanged after both calls. Use no filesystem fixture, source bytes, source IDs, requirement/scenario rows, actual crosswalk/set/duplicate/conflict/coverage validation, hash/signature, mocked store, fake provider, clock or randomness. Preserve all existing tests without edits.

These tests establish only supplied-blocker precedence, deterministic refusal and input/context non-mutation. They do not prove source recovery/integrity, absence of duplicate/conflicting/unmapped requirements, scenario coverage, Product/Sol review or EV(T-SCOPE-01). They do not satisfy full T-SCOPE-01, T-CONTRACT-01, T-BASE-01, T-INTEGRATE-01, T-CERT-01, T-RELEASE-01, any related task, CP gap, PACK acceptance, dependency/activation condition or G1-G6. Existing source/scope, migration, workspace/handoff, contract, integration and certification holds remain open.

Validation required on the returned implementation head (run from apps/kita/):

~~~sh
./node_modules/.bin/vitest run tests/features/test-scope-01.spec.ts tests/features/test-contract-01.spec.ts tests/features/test-release-01.spec.ts tests/features/test-base-01.spec.ts tests/features/test-mig-01.spec.ts tests/features/test-adapter-01.spec.ts tests/features/test-identity-01.spec.ts tests/features/test-quote-01.spec.ts tests/features/test-auth-01.spec.ts tests/features/test-auth-02.spec.ts tests/features/test-auth-03.spec.ts tests/features/test-auth-04.spec.ts tests/features/test-auth-05.spec.ts tests/features/test-auth-06.spec.ts tests/features/test-auth-07.spec.ts
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --noUncheckedIndexedAccess --exactOptionalPropertyTypes packages/contracts/src/original-spec-crosswalk.ts
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --noUncheckedIndexedAccess --exactOptionalPropertyTypes packages/platform/check-original-spec-crosswalk.ts
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --noUncheckedIndexedAccess --exactOptionalPropertyTypes packages/contracts/src/contract-freeze.ts packages/platform/check-contract-freeze.ts packages/contracts/src/release.ts packages/platform/check-release-evidence.ts packages/contracts/src/workspace.ts packages/platform/check-workspace-evidence.ts
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
with tempfile.TemporaryDirectory(prefix='kita-scope01-review-', dir='/tmp') as temp:
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

At the planning baseline, the unmodified contracts package check fails (exit 2) with 15 diagnostics. With explicit --allowImportingTsExtensions it fails (exit 2) with the same five registry diagnostics below. Both were rerun at d8a850d. These are existing failing gates, not waived or passed checks:

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

Require all 64 new refusal cases and all 278 baseline contract/release/workspace/migration/adapter/identity/quote/AUTH cases to pass (342 feature cases across fifteen files), the four existing provider cases to pass separately, both new strict isolated checks and the existing strict isolated contract/release/workspace check above to pass without diagnostics. Rerun and report both full contracts package checks separately with actual exit statuses and complete diagnostics. Preserve the exact existing diagnostic identities and locations because all existing files are outside the allowlist. Do not suppress diagnostics, change configuration, fix unrelated files or treat existing package failures as closed. This planning decision validates no subsequent implementation. Any new diagnostic, changed existing failure, failed/missing test, need for actual source/review/requirement/scenario/mapping/coverage/hash/store access or scope expansion returns to Sol as BATCH-HOLD.

Inspect the complete final diff and imports for effects, success/coverage/report/evidence/authority paths, indirect access to reconcileScope or freezeContracts and changes outside the three allowed implementation paths. Return the coordinator-recorded implementation base, exact implementation head, changed-file list, full diff and complete test/type-check outcomes for Codex Sol max review. No full task, connected feature or gate closes merely because refusal tests pass.

Implementation follows the established roles: Qoder CLI Efficient Agent Teams/subagents on gpu-fqaf implement the authorized checker; coordinator handles sync/bundles/GitHub; Codex Sol max reviews the returned batch. This document authorizes only the specified limited checker; it does not start implementation, a swarm, source recovery, a crosswalk, scope reconciliation, review collection, hashing, evidence collection, a freeze, release assembly, a gate runner, an activation, a provider interaction or a store. If the checker cannot fit these constraints, stop the batch and report BATCH-HOLD with the reason. Money path closed; no production, live-pilot or G1-G6 approval.
