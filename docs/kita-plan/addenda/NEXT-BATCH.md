BATCH-OK

Authorize only the T-CONTRACT-01 freeze-only checkContractFreeze LIMITED PURE boolean-input fail-closed checker specified below. Full T-CONTRACT-01 remains HOLD. Money path closed. Never authorize ok: true, executeCommand, ledger posting, financial execution, persistence or stores. T-CORE-02, T-FIN-01, T-LEDGER-02 and T-REWARD-01 remain HOLD; no implementation, scaffold or new checker for those tasks is authorized. No production, live pilot or G1-G6 closure is authorized.

Planning baseline: dd90466eb85e3d652275eb1277b29889cf4fde42 on cursor/kita-release01-check-release-evidence-05a3 (PR #108 supplied by the operator). T-RELEASE-01 checkReleaseEvidence has landed as a refusal-only checker; full T-RELEASE-01 remains HOLD. Local rechecks at this head: TEST-RELEASE-01 64 passed; together with TEST-BASE-01, TEST-MIG-01, TEST-ADAPTER-01, TEST-IDENTITY-01, TEST-QUOTE-01 and TEST-AUTH-01 through TEST-AUTH-07, 214 feature tests passed across thirteen files (exit 0). The four existing tests/providers/outcome-contract.spec.ts cases passed separately (exit 0), using a temporary configuration because the default Kita Vitest include covers only tests/features. Strict isolated checking of release.ts, check-release-evidence.ts, workspace.ts and check-workspace-evidence.ts passed together (exit 0). These results establish no contract freeze, scope acceptance or release authority. The three proposed T-CONTRACT-01 checker files are absent at this baseline; no proposed implementation has been tested.

Selection basis: [13-backlog.md T-CONTRACT-01](../13-backlog.md#t-contract-01--freeze-shared-schema-api-events-provider-ports-errors-money-rules-and-lock-order-before-parallel-coding) requires versioned definitions and gap addenda, signed hashes and a compatibility matrix, rejects conflicting ownership, untyped money, unsafe outcome mapping and unresolved scope claims, and requires architect plus Finance/Security review. Backlog M2 supplies unauthorized / 403, invalid_request / 400, stale_or_conflicting_command / 409 and dependency_unavailable / 503. These requirements support a disconnected supplied-blocker refusal contract only. T-CONTRACT-01 depends on T-SCOPE-01 and T-BASE-01; this slice bypasses and satisfies no prerequisite. Existing public-HTTP supplied-scope freeze prose, gap-addendum claims and the freezeContracts helper establish no full-task completion or authority for this batch.

For this batch, this document is the sole implementation authorization and supersedes the broader hashing/freeze permissions in [T-CONTRACT-01-BATCH.md](T-CONTRACT-01-BATCH.md). Preserve that older file without edits. Do not import, call, wrap, modify, extend, re-export or test the existing freezeContracts success/hash/clock path, including its ContractCandidate and ContractManifest types. Do not implement freezeContracts or a replacement freeze, generate a manifest, reconcile scope or certify compatibility.

Selection decisions:

| Candidate | Decision | Reason |
|---|---|---|
| T-CONTRACT-01 freeze-only | BATCH-OK for checkContractFreeze below only; full task HOLD | Supplied blockers can produce deterministic refusals without definitions, bytes, hashing, clocks, signatures, stores or a successful freeze. |
| T-SCOPE-01 | HOLD; not selected because the preferred T-CONTRACT-01 slice fits | Original-spec recovery, crosswalk, source hashing and Product/Sol review remain separate work; DEP-00/13 and coverage claims are not closed. |
| T-RELEASE-01 and prior limited-checker tasks | Full tasks HOLD | Passing supplied-blocker refusal tests closes no actual evidence, prerequisite, integration, certification or release requirement. |
| T-CORE-02 / T-FIN-01 / T-LEDGER-02 / T-REWARD-01 | HOLD; prohibited | No money-path implementation, scaffold, new checker, execution or authority is permitted. |

Implementation allowlist: create only these three files, relative to repository root:

- apps/kita/packages/contracts/src/contract-freeze.ts — type-only Contract01Input, Contract01Output and Contract01CommandContext declarations.
- apps/kita/packages/platform/check-contract-freeze.ts — one standalone inert checkContractFreeze checker with no other runtime export.
- apps/kita/tests/features/test-contract-01.spec.ts — TEST-CONTRACT-01 refusal tests only.

No other implementation file is allowed. Preserve all existing files, including contracts/result.ts, context.ts, index.ts, commands.ts, events.ts, freeze-contracts.ts, all other contract types, every landed checker, platform validators/gate runners, providers/ports.ts, architecture/contract-freeze.md, architecture/gap-addenda.md, all OpenAPI/events/SQL, guards, manifests, source archives and existing tests. No barrel or package export. Do not create or change source manifests, crosswalks, compatibility matrices, signing/hash tools, generators or freeze records. This planning update edits only docs/kita-plan/addenda/NEXT-BATCH.md; existing untracked files are outside the batch. The coordinator must record an exact implementation base containing this plan and descending from the planning baseline, and the exact returned head. Changes between the planning baseline and implementation base other than this planning file require Sol review before implementation. The implementation diff from that recorded base may contain only the three new implementation paths above.

Define exactly this input contract; all six flags are required readonly booleans and there are no optional fields or other accepted input fields:

~~~ts
export interface Contract01Input {
  readonly requiredReviewMissing: boolean;
  readonly ownershipConflictPresent: boolean;
  readonly untypedMoneyPresent: boolean;
  readonly unsafeOutcomeMappingPresent: boolean;
  readonly unresolvedScopeClaimPresent: boolean;
  readonly compatibilityEvidenceMissing: boolean;
}
~~~

The flags are supplied assertions only:

- requiredReviewMissing: supplied absence of required architect, Finance or Security freeze review. Accept no reviewer identity, role, approval record, signature or authorization-checking function.
- ownershipConflictPresent: supplied conflicting ownership of a contract definition. Accept no owner, registry, definition, migration allocation or ownership-comparison function.
- untypedMoneyPresent: supplied untyped money in a candidate definition. Accept no money value, type/schema definition, currency, arithmetic or validator.
- unsafeOutcomeMappingPresent: supplied unsafe outcome mapping in a candidate definition. Accept no provider outcome, mapping table, transcript, adapter or mapping function.
- unresolvedScopeClaimPresent: supplied unresolved scope claim affecting the candidate. Accept no requirement, source, scope record, crosswalk or coverage function.
- compatibilityEvidenceMissing: supplied absence of the required compatibility evidence/matrix. Accept no version, schema, generated client, fixture, matrix, test result or compatibility-checking function.

Do not derive, verify or clear these flags. False flags prove no reviewed definitions, ownership agreement, safe money typing, safe outcome mapping, resolved scope, signed hashes or compatibility. Missing definitions, incomplete gap addenda and unavailable hash/signature/validation evidence remain unverified in every branch, including the all-false fallback. Do not infer freeze eligibility, sign-off, dependency satisfaction or permission for dependent streams. Full T-CONTRACT-01 and all financial/activation gates remain HOLD for every input.

Define Contract01Output = never. Define Contract01CommandContext as Pick<WorkerContext, 'workId' | 'attemptGeneration'> using a type-only import from ./context.ts. The exact signature is checkContractFreeze(ctx: Contract01CommandContext, input: Contract01Input): Promise<Result<Contract01Output, Problem>>. Both context fields are unused metadata and establish no worker, actor, reviewer, candidate, freeze or command authority. Do not accept CommandContext, ReadContext, full WorkerContext, transaction runners, trace/capability/execution callbacks, dependencies or extra context fields. The contract type file has no runtime import, export, constant, validator or initialization.

The checker uses type-only imports for Contract01 types from ../contracts/src/contract-freeze.ts and Problem/Result from ../contracts/src/result.ts. Its only runtime import is the existing err/problem helpers from ../contracts/src/result.ts. Never import a runtime barrel, freezeContracts, any freeze-contracts.ts type or value, ok/unavailable helpers, node modules, crypto, validators, generators, release/gate runners, providers, stores, money utilities or another checker. Add no dependency or runtime schema. Test imports may use vitest, the new checker and direct contract type paths (including UUID from context.ts); no contract/platform/provider barrel or existing freeze helper.

Required behavior in this exact order; the first flag equal to true wins regardless of every lower-priority flag:

| Condition | Exact error code | HTTP status | retryable | Fixed detail |
|---|---|---|---|---|
| requiredReviewMissing === true | unauthorized | 403 | false | T-CONTRACT-01 supplied missing required review blocks contract freeze |
| Otherwise ownershipConflictPresent === true | stale_or_conflicting_command | 409 | false | T-CONTRACT-01 supplied conflicting ownership blocks contract freeze |
| Otherwise untypedMoneyPresent === true | invalid_request | 400 | false | T-CONTRACT-01 supplied untyped money blocks contract freeze |
| Otherwise unsafeOutcomeMappingPresent === true | invalid_request | 400 | false | T-CONTRACT-01 supplied unsafe outcome mapping blocks contract freeze |
| Otherwise unresolvedScopeClaimPresent === true | invalid_request | 400 | false | T-CONTRACT-01 supplied unresolved scope claim blocks contract freeze |
| Otherwise compatibilityEvidenceMissing === true | invalid_request | 400 | false | T-CONTRACT-01 supplied missing compatibility evidence blocks contract freeze |
| Otherwise (all six flags false) | dependency_unavailable | 503 | true | T-CONTRACT-01 checkContractFreeze cannot verify reviewed definitions, ownership, money typing, outcome mapping, scope, signed hashes or compatibility: full T-CONTRACT-01 remains HOLD (fail closed) |

Return only failures with exactly { ok: false, error: { code, status, retryable, detail } }. Use the bounded, non-PII detail strings above verbatim. No extra branch, code, value, kind, operationId, fieldErrors, report, finding, freeze/gate state, blocker list, count, digest, manifest, matrix, proof, permission, evidence, authority or other result field. All flags false still refuses with 503. retryable: true authorizes no automatic retry, review collection, hashing, signing, compatibility check, evidence collection, scheduling, activation or command execution. Return no complete/verified/accepted/eligible/ready/frozen verdict, ContractManifest, FrozenContractEntry, CoverageReport or ReleaseEvidenceBundle. Never claim contract validation, freeze completion, safe ownership/money/outcome mapping, scope coverage, compatibility, approval or readiness.

No persistence or store/database access, including real, test or in-memory substitute stores. No filesystem, directory enumeration, file existence check, archive access/extraction, source modification, parsing/schema validation, OpenAPI lint/generation/drift scan, event fixture execution, import/DAG scan, hashing, manifest/matrix generation/comparison, Git operation, environment read, subprocess, clock, randomness, network, credentials, signature verification/signing, queue/outbox/timer, trace/log/audit/metric emission, cache or state transition. No money arithmetic, ledger/points path, executeCommand, posting, holds, approval, balance mutation, reservation, transfer/operation creation or financial outcome. Accept no paths, source/definition bytes, hashes, versions, schemas, registries, gap addenda, manifests, proofs, artifacts, code, test results, consent/identity records, accounts, tokens, provider references/outcomes, approvals, cap values, amounts, currencies or financial data. The two unused context metadata fields are the only identifiers accepted.

Do not wire the checker into freezeContracts, generators, release/gate runners, build/CI gates, API/controllers/workers/UI, workspace/migration scripts, guards, handoff tools, provider ports or any money workflow. No changes to runbooks, infrastructure, CI, packages/configuration/dependencies, generated clients, frozen OpenAPI/events/SQL, migrations, grants, inventories, manifests, source archives or target-copy migration decisions. No deployment, production activation, publication, live pilot, GitHub merge or G1-G6 closure. T-CORE-02/T-FIN-01/T-LEDGER-02/T-REWARD-01 implementation remains prohibited.

TEST-CONTRACT-01 must cover all 64 boolean combinations in an explicit independently specified expected-results table. In the flag order above, include all 32 missing-review combinations, all 16 remaining ownership-conflict combinations, all eight remaining untyped-money combinations, all four remaining unsafe-outcome-mapping combinations, both remaining unresolved-scope-claim combinations, the sole remaining missing-compatibility-evidence combination and the all-false fallback. Expected code/status/retryable/detail must be literal expectations, not computed by copying the checker's if-chain or importing implementation constants. Assert the complete exact error-only result for every case, absence of value/kind/extra freeze/report/evidence/authority fields and identical refusal on a repeated call. Object.freeze each input and context, capture their values before calling and verify both remain unchanged. Use no filesystem fixture, definition bytes, real ownership/typing/outcome/scope/compatibility validation, hash/signature, mocked store, fake provider, clock or randomness. Preserve all existing tests without edits.

These tests establish only supplied-blocker precedence, deterministic refusal and input/context non-mutation. They do not prove actual review, ownership, typing, outcome mapping, scope, signed hashes, compatibility or EV(T-CONTRACT-01). They do not satisfy full T-CONTRACT-01, T-SCOPE-01, T-BASE-01, T-INTEGRATE-01, T-CERT-01, T-RELEASE-01, any related task, CP gap, PACK acceptance, dependency/activation condition or G1-G6. Existing source/scope, migration, workspace/handoff, contract, integration and certification holds remain open.

Validation required on the returned implementation head (run from apps/kita/):

~~~sh
./node_modules/.bin/vitest run tests/features/test-contract-01.spec.ts tests/features/test-release-01.spec.ts tests/features/test-base-01.spec.ts tests/features/test-mig-01.spec.ts tests/features/test-adapter-01.spec.ts tests/features/test-identity-01.spec.ts tests/features/test-quote-01.spec.ts tests/features/test-auth-01.spec.ts tests/features/test-auth-02.spec.ts tests/features/test-auth-03.spec.ts tests/features/test-auth-04.spec.ts tests/features/test-auth-05.spec.ts tests/features/test-auth-06.spec.ts tests/features/test-auth-07.spec.ts
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --noUncheckedIndexedAccess --exactOptionalPropertyTypes packages/contracts/src/contract-freeze.ts
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --noUncheckedIndexedAccess --exactOptionalPropertyTypes packages/platform/check-contract-freeze.ts
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --noUncheckedIndexedAccess --exactOptionalPropertyTypes packages/contracts/src/release.ts packages/platform/check-release-evidence.ts packages/contracts/src/workspace.ts packages/platform/check-workspace-evidence.ts
./node_modules/.bin/tsc --noEmit --project packages/contracts/tsconfig.json
./node_modules/.bin/tsc --noEmit --project packages/contracts/tsconfig.json --allowImportingTsExtensions
~~~

Rerun the existing provider suite using the following temporary configuration. The default Kita config excludes tests/providers; passing that file to the default config does not establish a provider test result. This validation harness writes only under /tmp, pins the root to the current Kita slice and removes the temporary config afterward; it is not an implementation file or permission to change tracked configuration. Filesystem/subprocess activity here belongs to the reviewer harness; the checker and its new tests remain inert.

~~~sh
python3 - <<'PYTEST'
from pathlib import Path
import json
import subprocess
import tempfile

root = Path.cwd().resolve()
with tempfile.TemporaryDirectory(prefix='kita-contract01-review-', dir='/tmp') as temp:
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

At the planning baseline, the unmodified contracts package check fails (exit 2) with 15 diagnostics. With explicit --allowImportingTsExtensions it fails (exit 2) with the same five registry diagnostics below. Both were rerun at dd90466. These are existing failing gates, not waived or passed checks:

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

Require all 64 new refusal cases and all 214 baseline release/workspace/migration/adapter/identity/quote/AUTH cases to pass (278 feature cases across fourteen files), the four existing provider cases to pass separately, both new strict isolated checks and the existing strict isolated release/workspace check above to pass without diagnostics. Rerun and report both full contracts package checks separately with actual exit statuses and complete diagnostics. Preserve the exact existing diagnostic identities and locations because all existing files are outside the allowlist. Do not suppress diagnostics, change configuration, fix unrelated files or treat existing package failures as closed. This planning decision validates no subsequent implementation. Any new diagnostic, changed existing failure, failed/missing test, need for real definitions/reviews/ownership/typing/outcomes/scope/compatibility/signing/hash/store access or scope expansion returns to Sol as BATCH-HOLD.

Inspect the complete final diff and imports for effects, success/freeze/report/evidence/authority paths, indirect access to freezeContracts and changes outside the three allowed implementation paths. Return the coordinator-recorded implementation base, exact implementation head, changed-file list, full diff and complete test/type-check outcomes for Codex Sol max review. No full task, connected feature or gate closes merely because refusal tests pass.

Implementation follows the established roles: Qoder CLI Efficient Agent Teams/subagents on gpu-fqaf implement the authorized checker; coordinator handles sync/bundles/GitHub; Codex Sol max reviews the returned batch. This document authorizes only the specified limited checker; it does not start implementation, a swarm, a freeze, review collection, source recovery, evidence collection, release assembly, a gate runner, an activation, a provider interaction or a store. If the checker cannot fit these constraints, stop the batch and report BATCH-HOLD with the reason. Money path closed; no production, live-pilot or G1-G6 approval.
