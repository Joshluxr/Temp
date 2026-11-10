BATCH-OK

Authorize only the T-DEPEND-01 supplied dependency-blockers checkDependencyEvidence LIMITED PURE boolean-input fail-closed checker specified below. Full T-DEPEND-01 remains HOLD. Money path closed. Never authorize ok: true, executeCommand, ledger access or posting, financial execution, persistence or stores. T-CORE-02, T-FIN-01, T-LEDGER-02 and T-REWARD-01 remain HOLD; no implementation, scaffold or new checker for those tasks is authorized. T-LIVE-01 and T-GA-01 remain HOLD with no implementation or new checker authorized. No production, live pilot or G1-G6 closure is authorized.

Planning baseline: 4277c2ae75ae02124fbbfc8d9f6b37142177a942 on cursor/kita-cert01-check-certification-evidence-05a3 (PR #112 supplied by the operator). T-CERT-01 checkCertificationEvidence has landed as a refusal-only checker; full T-CERT-01 remains HOLD. Local rechecks at this exact head: the existing seventeen-file checker suite including TEST-CERT-01 passed all 470 feature cases; the seven existing TEST-DEPEND-01 activation-policy cases passed in the same run (477 feature cases across eighteen files, exit 0). The four existing tests/providers/outcome-contract.spec.ts cases passed separately (exit 0) using the temporary configuration below because the default Kita Vitest include covers only tests/features. Strict isolated checking of the twelve existing certification/integration/scope/contract/release/workspace files listed below passed together (exit 0). Both full contracts package checks still fail as recorded below. These results establish no dependency acceptance, commercial/legal authority, capability enablement, task completion or gate closure. The three proposed implementation files are absent at this baseline; no proposed implementation has been tested.

Selection basis: [13-backlog.md T-DEPEND-01](../13-backlog.md#t-depend-01--collect-and-enforce-all-external-enablement-evidence) requires DEP-00-15 applicability, owner/counsel/Finance signatures, contract expiry and environment, with missing/expired/rejected/wrong-entity negative cases and no fabricated approvals. [14-external-deps.md N1, N3 and N4](../14-external-deps.md) require scoped, current evidence independently accepted by accountable owners; public documentation, test fixtures and sandbox credentials alone cannot close commercial/legal gates. [COMPLETENESS-PASS.md CP-09 and CP-11](../COMPLETENESS-PASS.md) remain open. Backlog M2 supplies unauthorized / 403, stale_or_conflicting_command / 409, invalid_request / 400 and dependency_unavailable / 503. These requirements support a disconnected supplied-blocker refusal contract only. Full T-SCOPE-01 and T-CONTRACT-01 prerequisites remain unresolved; their landed refusal checkers do not satisfy or bypass them. No DEP row is closed, claim register assembled, evidence collected, approval accepted, exposure changed or activation decision made by this batch.

For this batch, this document is the sole implementation authorization and replaces the previous NEXT-BATCH.md T-CERT-01 authorization. Preserve all other addenda; their older broader permissions, including T-CORE-01-BATCH.md, do not authorize work in this batch. Do not import, call, wrap, modify, extend, re-export or add new tests for evaluateActivation, certifyProvider, verifyIntegration, evaluateReleaseGates, reconcileScope, freezeContracts or their success/report/hash/clock/execution paths. No full task, prerequisite, CP gap, DEP condition or gate is satisfied by this checker.

Selection decisions in operator preference order:

| Candidate | Decision | Reason |
|---|---|---|
| T-DEPEND-01 supplied dependency blockers only | BATCH-OK for checkDependencyEvidence below only; full task HOLD | Five supplied booleans permit deterministic refusals without collecting or accepting evidence, inspecting approvals, changing the existing activation policy or enabling any capability. |
| T-CORE-01 | HOLD for new work in this batch | Defer behind the eligible preferred checker; pool, transaction, runtime, API and package-export changes are outside this allowlist. |
| T-LIVE-01 | HOLD; prohibited | Live-pilot preparation, execution, reconciliation and a new checker are expressly outside authorization. |
| T-GA-01 | HOLD; prohibited | Launch decisions, staged exposure and a new checker are expressly outside authorization. |
| T-CORE-02 / T-FIN-01 / T-LEDGER-02 / T-REWARD-01 | HOLD; prohibited | Money-path execution, durable command authority, ledger/finance/reward implementation, scaffolds and new checkers remain outside authorization. |
| Production / live pilot / G1-G6 | HOLD; prohibited | No activation, deployment, gate runner, release sign-off or gate closure is authorized. |

Implementation allowlist: create only these three files, relative to repository root:

- apps/kita/packages/contracts/src/dependency-evidence.ts — type-only Depend01Input, Depend01Output and Depend01CommandContext declarations.
- apps/kita/packages/platform/check-dependency-evidence.ts — one standalone inert checkDependencyEvidence checker with no other runtime export.
- apps/kita/tests/features/test-depend-01-evidence.spec.ts — TEST-DEPEND-01 supplied-blocker refusal tests only; this is a new file separate from the existing activation-policy suite.

No existing implementation file is allowed to change. In particular, apps/kita/packages/domain/catalog/activation-policy.ts, apps/kita/packages/contracts/src/activation.ts and apps/kita/tests/features/test-depend-01.spec.ts are NOT allowed files and must remain byte-for-byte unchanged. Preserve result.ts, context.ts, index.ts, commands.ts, events.ts, all landed checkers, platform validators/gate runners, provider ports/adapters/contracts, all OpenAPI/events/SQL, guards, manifests, source archives, package exports and existing tests. No barrel or package export. Do not create or change docs/activation/claim-register.json, docs/activation/capability-evidence.md, docs/runbooks/provider-renewal.md, policy/capability/claim registries, evidence manifests, reports, schemas or fixtures. This planning update edits only docs/kita-plan/addenda/NEXT-BATCH.md; existing untracked files are outside the batch. The coordinator must record an exact implementation base containing this plan and descending from the planning baseline, and the exact returned head. Changes between the planning baseline and implementation base other than this planning file require Sol review before implementation. The implementation diff from that recorded base may contain only the three new implementation paths above.

Define exactly this input contract; all five flags are required readonly booleans and there are no optional fields or other accepted input fields:

~~~ts
export interface Depend01Input {
  readonly requiredApprovalOrReviewMissing: boolean;
  readonly scopeMismatch: boolean;
  readonly evidenceStaleOrRevoked: boolean;
  readonly dependencyRejected: boolean;
  readonly requiredEvidenceMissing: boolean;
}
~~~

The flags are supplied assertions only, in the order shown:

- requiredApprovalOrReviewMissing: supplied absence of a required owner/counsel/Finance approval or independent review, including any required architect/exact-head Sol review. Accept no actor, reviewer, role, identity, signature, approval record, review date, acknowledgment or authorization function. Do not grant, check, collect or fabricate approval.
- scopeMismatch: supplied mismatch between the proposed capability and dependency-evidence scope, including entity, provider account, environment, country/state, corridor, product, method, currency or artifact/policy/contract version. Accept no actual scope tuple, DEP ID, entity/account, capability, identifier, artifact, version, evidence reference or comparison function. Do not determine applicability or perform a scope comparison.
- evidenceStaleOrRevoked: supplied assertion that required dependency evidence or approval is stale, expired, revoked or invalidated by an artifact/policy/contract/provider change. Accept no timestamp, expiry, review date, freshness window, clock, head, hash, version or revocation record. Do not determine freshness, expiry or revocation.
- dependencyRejected: supplied assertion that a required dependency or its evidence has been rejected. Accept no decision record, rejection reason, alternative, provider list or substitution function. Do not accept a replacement, silently substitute a provider or change any contract.
- requiredEvidenceMissing: supplied absence of required actual, scoped DEP-00-15 evidence or independent acceptance. Public documentation, test-only fixtures or sandbox credentials presented without the required real evidence remain a missing-evidence assertion; do not evaluate their contents or provenance. Accept no claim register, DEP list, source, evidence document, signature, contract, policy, test result, sandbox transcript, financial statement or verification function.

Do not derive, verify or clear these flags. False flags prove no applicability, owner assignment, approval, review, scope identity, freshness, acceptance or dependency satisfaction. All DEP-00-15 requirements and actual evidence remain unverified in every branch, including the all-false fallback. Do not infer legal/commercial permission, certified provider behavior, available funding, production readiness, capability enablement, activation eligibility or authority to service/change any obligation. Full T-DEPEND-01 and all dependent full tasks remain HOLD for every input. Existing-obligation servicing rules are outside this checker; it makes no exposure or servicing change. No sandbox, provider, financial, activation or release gate opens.

Define Depend01Output = never. Define Depend01CommandContext as Pick<WorkerContext, 'workId' | 'attemptGeneration'> using a type-only import from ./context.ts. The exact signature is checkDependencyEvidence(ctx: Depend01CommandContext, input: Depend01Input): Promise<Result<Depend01Output, Problem>>. Both context fields are unused metadata and establish no worker, actor, owner, reviewer, evidence, capability, activation or command authority. Do not accept CommandContext, ReadContext, full WorkerContext, transaction runners, trace/capability/execution callbacks, dependencies or extra context fields. The contract type file has no runtime import, export, constant, validator or initialization.

The checker uses type-only imports for Depend01 types from ../contracts/src/dependency-evidence.ts and Problem/Result from ../contracts/src/result.ts. Its only runtime import is the existing err/problem helpers from ../contracts/src/result.ts. Never import a runtime barrel, activation-policy.ts, activation.ts, evaluateActivation, ActivationDecision, CapabilityScope, ClaimEvidence, certifyProvider, verifyIntegration, evaluateReleaseGates, reconcileScope, freezeContracts, any success/report/evidence type, ok/unavailable helpers, node modules, crypto, validators, generators, release/gate runners, providers, stores, money utilities or another checker. Add no dependency or runtime schema. New test imports may use vitest, the new checker and direct new contract type paths (plus UUID from context.ts); no contract/platform/domain/provider barrel or existing activation/certification/integration/scope/freeze helper.

Required behavior in this exact order; the first flag equal to true wins regardless of every lower-priority flag. Compare flags with === true; add no other branch or runtime input validator:

| Condition | Exact error code | HTTP status | retryable | Fixed detail |
|---|---|---|---|---|
| requiredApprovalOrReviewMissing === true | unauthorized | 403 | false | T-DEPEND-01 supplied missing required owner/counsel/Finance approval or independent review blocks dependency evidence |
| Otherwise scopeMismatch === true | stale_or_conflicting_command | 409 | false | T-DEPEND-01 supplied dependency scope mismatch blocks dependency evidence |
| Otherwise evidenceStaleOrRevoked === true | stale_or_conflicting_command | 409 | false | T-DEPEND-01 supplied stale, expired or revoked dependency evidence blocks dependency evidence |
| Otherwise dependencyRejected === true | invalid_request | 400 | false | T-DEPEND-01 supplied rejected dependency blocks dependency evidence |
| Otherwise requiredEvidenceMissing === true | invalid_request | 400 | false | T-DEPEND-01 supplied missing required dependency evidence blocks dependency evidence |
| Otherwise (all five flags false) | dependency_unavailable | 503 | true | T-DEPEND-01 checkDependencyEvidence cannot verify DEP-00-15 applicability, scoped evidence, current owner/counsel/Finance approvals or independent review, freshness, rejection status or activation conditions: full T-DEPEND-01 remains HOLD (fail closed) |

Return only failures with exactly { ok: false, error: { code, status, retryable, detail } }. Use the bounded, non-PII detail strings above verbatim. No extra branch, code, value, kind, operationId, fieldErrors, enabled/disabled verdict, reasons, evaluatedAt, report, finding, scope/capability/activation/gate state, blocker list, count, digest, manifest, proof, permission, evidence, authority or other result field. All flags false still refuses with 503. retryable: true authorizes no automatic retry, lookup, evidence/approval collection, scheduling, signature validation, provider execution, activation or command execution. Return no ActivationDecision, claim decision, approval, evidence acceptance, complete/verified/accepted/eligible/ready verdict or gate decision. Never claim commercial/legal authority, DEP satisfaction, real-world evidence acceptance, certification or readiness.

No persistence or store/database access, including real, test or in-memory substitute stores. No filesystem, directory enumeration, file existence check, artifact/source/archive access, import/binding/route reachability checks, schema validation, evidence or signature inspection, applicability/coverage/set comparison, actual scope comparison or freshness/revocation check, OpenAPI lint/generation/drift scan, Git operation, hashing, manifest generation/comparison, environment read, subprocess, clock, randomness, network, credentials, signature verification/signing, queue/outbox/timer, trace/log/audit/metric emission, cache or state transition. No test-runner, lifecycle, concurrency, SDK/device, provider, statement or financial-oracle execution by the checker or its new tests. No money arithmetic, financial reconciliation, ledger/points path, executeCommand, posting, holds, approval, balance mutation, reservation, exposure/servicing change, transfer/operation creation or financial outcome. Accept no paths, bytes, IDs, hashes, versions, timestamps, schemas, registries, mappings, counts, manifests, proofs, artifacts, code, test results, consent/identity records, accounts, tokens, provider references/outcomes, acknowledgments, approvals, cap values, amounts, currencies or financial data. The two unused context metadata fields are the only identifiers accepted.

Do not wire the checker into evaluateActivation, activation policy, any capability/exposure/servicing workflow, certifyProvider, verifyIntegration, release/gate runners, build/CI gates, API/controllers/workers/UI, workspace/migration scripts, guards, handoff tools, provider ports or any money workflow. No changes to runbooks, infrastructure, CI, packages/configuration/dependencies, generated clients, frozen OpenAPI/events/SQL, migrations, grants, inventories, manifests, source archives or target-copy migration decisions. No deployment, production activation, publication, live pilot, GitHub merge or G1-G6 closure. T-CORE-02/T-FIN-01/T-LEDGER-02/T-REWARD-01, T-LIVE-01 and T-GA-01 implementation remains prohibited.

TEST-DEPEND-01 in the new test-depend-01-evidence.spec.ts must cover all 32 boolean combinations in an explicit independently specified expected-results table. In the flag order above, include all sixteen missing-approval-or-review combinations, all eight remaining scope-mismatch combinations, all four remaining stale-or-revoked-evidence combinations, both remaining rejected-dependency combinations, the sole remaining missing-evidence combination and the all-false fallback. Expected code/status/retryable/detail must be literal expectations, not computed by copying the checker's if-chain or importing implementation constants. Assert the complete exact error-only result with toStrictEqual, exact top-level/error keys and absence of value/kind/extra activation/capability/report/evidence/authority fields for every case. Assert an identical refusal on a repeated call. Object.freeze each input and context, capture their values before calling and verify both remain unchanged after both calls. Use no filesystem fixture, source/artifact/evidence bytes, claim register, actual scope/applicability/approval validation, hash/signature, mocked store, fake provider, financial data, oracle, clock or randomness. Preserve all existing tests, including the seven activation-policy cases, without edits.

These tests establish only supplied-blocker precedence, deterministic refusal and input/context non-mutation. They do not prove applicability, scoped identity, freshness, rejection handling, owner/counsel/Finance approval, independent acceptance, exposure controls or EV(T-DEPEND-01). They do not satisfy full T-DEPEND-01, T-SCOPE-01, T-CONTRACT-01, T-CORE-01, T-CERT-01, T-INTEGRATE-01, T-RELEASE-01, any related task, CP gap, PACK acceptance, dependency/activation condition or G1-G6. Existing source/scope, migration, workspace/handoff, contract, integration, certification and enablement holds remain open.

Validation required on the returned implementation head (run from apps/kita/):

~~~sh
./node_modules/.bin/vitest run tests/features/test-depend-01-evidence.spec.ts tests/features/test-depend-01.spec.ts tests/features/test-cert-01.spec.ts tests/features/test-integrate-01.spec.ts tests/features/test-scope-01.spec.ts tests/features/test-contract-01.spec.ts tests/features/test-release-01.spec.ts tests/features/test-base-01.spec.ts tests/features/test-mig-01.spec.ts tests/features/test-adapter-01.spec.ts tests/features/test-identity-01.spec.ts tests/features/test-quote-01.spec.ts tests/features/test-auth-01.spec.ts tests/features/test-auth-02.spec.ts tests/features/test-auth-03.spec.ts tests/features/test-auth-04.spec.ts tests/features/test-auth-05.spec.ts tests/features/test-auth-06.spec.ts tests/features/test-auth-07.spec.ts
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --noUncheckedIndexedAccess --exactOptionalPropertyTypes packages/contracts/src/dependency-evidence.ts
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --noUncheckedIndexedAccess --exactOptionalPropertyTypes packages/platform/check-dependency-evidence.ts
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --noUncheckedIndexedAccess --exactOptionalPropertyTypes packages/contracts/src/certification-evidence.ts packages/platform/check-certification-evidence.ts packages/contracts/src/integration-evidence.ts packages/platform/check-integration-evidence.ts packages/contracts/src/original-spec-crosswalk.ts packages/platform/check-original-spec-crosswalk.ts packages/contracts/src/contract-freeze.ts packages/platform/check-contract-freeze.ts packages/contracts/src/release.ts packages/platform/check-release-evidence.ts packages/contracts/src/workspace.ts packages/platform/check-workspace-evidence.ts
./node_modules/.bin/tsc --noEmit --project packages/contracts/tsconfig.json
./node_modules/.bin/tsc --noEmit --project packages/contracts/tsconfig.json --allowImportingTsExtensions
~~~

Rerun the existing provider refusal suite using the following temporary configuration. The default Kita config excludes tests/providers; passing that file to the default config does not establish a provider test result. This validation harness writes only under /tmp, pins the root to the current Kita slice and removes the temporary config afterward; it is not an implementation file or permission to change tracked configuration. Filesystem/subprocess activity here belongs to the reviewer harness; the checker and its new tests remain inert. These existing four provider refusal cases exercise no real provider and certify no outcome.

~~~sh
python3 - <<'PYTEST'
from pathlib import Path
import json
import subprocess
import tempfile

root = Path.cwd().resolve()
with tempfile.TemporaryDirectory(prefix='kita-depend01-review-', dir='/tmp') as temp:
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

At the planning baseline, the unmodified contracts package check fails (exit 2) with 15 diagnostics. With explicit --allowImportingTsExtensions it fails (exit 2) with the same five registry diagnostics below. Both were rerun at 4277c2a. These are existing failing gates, not waived or passed checks:

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

Require all 32 new refusal cases and all 477 baseline feature cases to pass (509 feature cases across nineteen files), the four existing provider cases to pass separately, both new strict isolated checks and the existing twelve-file strict isolated check above to pass without diagnostics. Rerun and report both full contracts package checks separately with actual exit statuses and complete diagnostics. Preserve the exact existing diagnostic identities and locations because all existing files are outside the allowlist. Do not suppress diagnostics, change configuration, fix unrelated files or treat existing package failures as closed. This planning decision validates no subsequent implementation. Any new diagnostic, changed existing failure, failed/missing test, need for actual scope/applicability/claim/approval/review/evidence/provider/financial/hash/store access or scope expansion returns to Sol as BATCH-HOLD.

Inspect the complete final diff and imports for effects, success/activation/enablement/report/evidence/authority paths, indirect access to activation/certification/integration/release/gate runners or other checkers, and changes outside the three allowed implementation paths. Explicitly verify activation-policy.ts, activation.ts and test-depend-01.spec.ts are unchanged from the recorded implementation base. Return the coordinator-recorded implementation base, exact implementation head, changed-file list, full diff and complete test/type-check outcomes for Codex Sol max review. No full task, connected feature or gate closes merely because refusal tests pass.

Implementation follows the established roles: Qoder CLI Efficient Agent Teams/subagents on gpu-fqaf implement the authorized checker; coordinator handles sync/bundles/GitHub; Codex Sol max reviews the returned batch. This document authorizes only the specified limited checker; it does not start implementation, a swarm, activation-policy changes, claim-register assembly, scope/applicability/approval inspection, evidence collection/acceptance, lifecycle/provider/financial-oracle runs, hashing, release assembly, a gate runner, an activation or a store. If the checker cannot fit these constraints, stop the batch and report BATCH-HOLD with the reason. Money path closed; T-LIVE-01/T-GA-01 remain prohibited; no production, live-pilot or G1-G6 approval.
