BATCH-OK

Authorize only the T-CERT-01 certification-blockers checkCertificationEvidence LIMITED PURE boolean-input fail-closed checker specified below. Full T-CERT-01 remains HOLD. Money path closed. Never authorize ok: true, executeCommand, ledger posting, financial execution, persistence or stores. T-CORE-02, T-FIN-01, T-LEDGER-02 and T-REWARD-01 remain HOLD; no implementation, scaffold or new checker for those tasks is authorized. T-LIVE-01 and T-GA-01 remain HOLD with no implementation or new checker authorized. No production, live pilot or G1-G6 closure is authorized.

Planning baseline: 35d05ec4674d3b0c8b6cd8d08b506885bbb163af on cursor/kita-integrate01-check-integration-evidence-05a3 (PR #111 supplied by the operator). T-INTEGRATE-01 checkIntegrationEvidence has landed as a refusal-only checker; full T-INTEGRATE-01 remains HOLD and its dependency on T-DEPEND-01 remains unresolved. Local rechecks at this exact head: TEST-INTEGRATE-01 64 passed; together with TEST-SCOPE-01, TEST-CONTRACT-01, TEST-RELEASE-01, TEST-BASE-01, TEST-MIG-01, TEST-ADAPTER-01, TEST-IDENTITY-01, TEST-QUOTE-01 and TEST-AUTH-01 through TEST-AUTH-07, 406 feature tests passed across sixteen files (exit 0). The four existing tests/providers/outcome-contract.spec.ts cases passed separately (exit 0) using the temporary configuration below because the default Kita Vitest include covers only tests/features. Strict isolated checking of the ten existing integration/scope/contract/release/workspace files listed below passed together (exit 0). Both full contracts package checks still fail as recorded below. These results establish no certification, integration acceptance, commercial authority, dependency satisfaction, release authority or gate closure. The three proposed T-CERT-01 files are absent at this baseline; no proposed implementation has been tested.

Selection basis: [13-backlog.md T-CERT-01](../13-backlog.md#t-cert-01--certify-selected-provideraccountmethod-paths-and-native-sdks-in-sandbox) requires scope-specific real sandbox transcripts/statements, SDK/device runs, explicit unsupported-case limits, provider acknowledgment and Finance-reviewed sandbox positions. [08-providers.md H5](../08-providers.md#h5-certification-fixture-catalog) requires per-provider outcome mapping and real fixture evidence. [12-tests-gates.md L9 G3](../12-tests-gates.md#l9-six-sequential-release-stages) requires G2, actual selected provider/account/method flows, reconciliation, acknowledgment, SDK/device proof and scoped restrictions; changed artifacts/contracts/policies/providers invalidate impacted evidence. CP-09 and CP-11 in [COMPLETENESS-PASS.md](../COMPLETENESS-PASS.md) remain open. Backlog M2 supplies unauthorized / 403, stale_or_conflicting_command / 409, invalid_request / 400 and dependency_unavailable / 503. These requirements support a disconnected supplied-blocker refusal contract only. Full T-INTEGRATE-01 and applicable DEP-03/04/05/09/12/14 prerequisites remain unverified; this batch does not satisfy or bypass them, perform certifyProvider, collect evidence, exercise a sandbox/provider/device, reconcile money or make a G3 decision.

For this batch, this document is the sole implementation authorization and replaces the previous NEXT-BATCH.md T-INTEGRATE-01 authorization. Preserve all other addenda; their older broader permissions do not authorize work in this batch. Do not import, call, wrap, modify, extend, re-export or add tests for certifyProvider, verifyIntegration, evaluateReleaseGates, reconcileScope, freezeContracts, evaluateActivation or their success/report/hash/clock/execution paths. No full task, prerequisite, CP gap, DEP condition or gate is satisfied by this checker.

Selection decisions in operator preference order:

| Candidate | Decision | Reason |
|---|---|---|
| T-CERT-01 supplied certification blockers only | BATCH-OK for checkCertificationEvidence below only; full task HOLD | Supplied booleans permit deterministic refusals without scoped evidence inspection, provider/SDK/device execution, persistence, money or a certification decision. |
| T-DEPEND-01 | HOLD; not authorized in this batch | Defer behind the preferred T-CERT-01 checker; existing activation policy stays unchanged and no DEP approvals, evidence collection or enablement is authorized. |
| T-CORE-01 | HOLD for new work in this batch | Defer behind the preferred checker; existing pool, transaction, runtime and API composition boundaries are outside this allowlist. |
| T-LIVE-01 | HOLD; prohibited | Live-pilot preparation, execution, reconciliation and a new checker are expressly outside authorization. |
| T-GA-01 | HOLD; prohibited | Launch decisions, staged exposure and a new checker are expressly outside authorization. |
| T-CORE-02 / T-FIN-01 / T-LEDGER-02 / T-REWARD-01 | HOLD; prohibited | Money-path execution, durable command authority, ledger/finance/reward implementation, scaffolds and new checkers remain outside authorization. |
| Production / live pilot / G1-G6 | HOLD; prohibited | No activation, deployment, gate runner, release sign-off or gate closure is authorized. |

Implementation allowlist: create only these three files, relative to repository root:

- apps/kita/packages/contracts/src/certification-evidence.ts — type-only Cert01Input, Cert01Output and Cert01CommandContext declarations.
- apps/kita/packages/platform/check-certification-evidence.ts — one standalone inert checkCertificationEvidence checker with no other runtime export.
- apps/kita/tests/features/test-cert-01.spec.ts — TEST-CERT-01 supplied-blocker refusal tests only.

No other implementation file is allowed. Preserve all existing files, including contracts/result.ts, context.ts, index.ts, commands.ts, events.ts, activation.ts, all landed checkers, platform validators/gate runners, activation-policy.ts, providers/ports.ts, provider adapters/contracts, all OpenAPI/events/SQL, guards, manifests, source archives and existing tests. No barrel or package export. Do not create or change docs/certification/provider-outcome-maps.md, evidence/certification/manifest.json, docs/runbooks/unknown-outcome.md, provider contracts, outcome maps, fixtures, certification/coverage/evidence reports, manifests or schemas. This planning update edits only docs/kita-plan/addenda/NEXT-BATCH.md; existing untracked files are outside the batch. The coordinator must record an exact implementation base containing this plan and descending from the planning baseline, and the exact returned head. Changes between the planning baseline and implementation base other than this planning file require Sol review before implementation. The implementation diff from that recorded base may contain only the three new implementation paths above.

Define exactly this input contract; all six flags are required readonly booleans and there are no optional fields or other accepted input fields:

~~~ts
export interface Cert01Input {
  readonly requiredAcknowledgmentOrReviewMissing: boolean;
  readonly scopeMismatch: boolean;
  readonly evidenceStale: boolean;
  readonly requiredSandboxEvidenceMissing: boolean;
  readonly requiredSdkDeviceEvidenceMissing: boolean;
  readonly unsupportedCaseClaimedPassed: boolean;
}
~~~

The flags are supplied assertions only, in the order shown:

- requiredAcknowledgmentOrReviewMissing: supplied absence of required provider acknowledgment or certification review, including required Integrations/QA/Finance/Compliance review and architect/exact-head Sol review. Accept no reviewer identity, role, acknowledgment, approval record, signature or authorization-checking function.
- scopeMismatch: supplied mismatch between the proposed certification scope and the scope referenced by evidence, including candidate/artifact, entity, provider account/version, country/state, product, method, currency or client version. Accept no scope tuple, candidate, account, identifier, artifact, digest, version, evidence reference or comparison function.
- evidenceStale: supplied stale or invalidated certification evidence, including after a candidate/artifact/contract/policy/provider change. Accept no head, timestamp, expiry, freshness window, clock, version, hash or Git lookup. Do not determine staleness.
- requiredSandboxEvidenceMissing: supplied absence of required actual sandbox transcripts, statements, outcome mapping, flow/test evidence or independent reconciliation proof. This is a bare refusal assertion; accept no transcript, provider outcome, mapping, statement, fixture, journal, balance, financial data, oracle or reconciliation function. Do not execute, calculate, investigate, reconcile or repair anything.
- requiredSdkDeviceEvidenceMissing: supplied absence of required native SDK, physical-device or disclosure-compatibility proof. Accept no SDK, device, client/build, consent/disclosure record, test result, runner, fixture or execution callback.
- unsupportedCaseClaimedPassed: supplied assertion that an unsupported, unexercised or vendor-unavailable certification case has been represented as passed instead of retaining the required restriction and local fault-proof requirement. Accept no scenario list, result, outcome map, capability, restriction, proof or validation function. Do not classify actual outcomes or establish restrictions.

Do not derive, verify or clear these flags. False flags prove no acknowledgment, review, scope identity, freshness, actual sandbox execution/reconciliation, SDK/device compatibility or correct unsupported-case restrictions. Every certification prerequisite and all actual evidence remain unverified in every branch, including the all-false fallback. Do not infer G2, internal verification, provider/commercial authority, certification, dependency satisfaction, feature connectivity, activation eligibility or release readiness. Full T-CERT-01, T-INTEGRATE-01 and all dependent full tasks remain HOLD for every input. No sandbox, provider, financial, activation or release gate opens.

Define Cert01Output = never. Define Cert01CommandContext as Pick<WorkerContext, 'workId' | 'attemptGeneration'> using a type-only import from ./context.ts. The exact signature is checkCertificationEvidence(ctx: Cert01CommandContext, input: Cert01Input): Promise<Result<Cert01Output, Problem>>. Both context fields are unused metadata and establish no worker, actor, reviewer, candidate, provider, certification or command authority. Do not accept CommandContext, ReadContext, full WorkerContext, transaction runners, trace/capability/execution callbacks, dependencies or extra context fields. The contract type file has no runtime import, export, constant, validator or initialization.

The checker uses type-only imports for Cert01 types from ../contracts/src/certification-evidence.ts and Problem/Result from ../contracts/src/result.ts. Its only runtime import is the existing err/problem helpers from ../contracts/src/result.ts. Never import a runtime barrel, certifyProvider, verifyIntegration, evaluateReleaseGates, reconcileScope, freezeContracts, evaluateActivation, CertificationScope, ProviderRun, CertificationDecision, ReleaseCandidate, ReleaseScope, GateReport, any success/report/evidence type, ok/unavailable helpers, node modules, crypto, validators, generators, release/gate runners, providers, stores, money utilities or another checker. Add no dependency or runtime schema. Test imports may use vitest, the new checker and direct contract type paths (including UUID from context.ts); no contract/platform/provider barrel or existing certification/integration/scope/freeze/activation helper.

Required behavior in this exact order; the first flag equal to true wins regardless of every lower-priority flag. Compare flags with === true; add no other branch or runtime input validator:

| Condition | Exact error code | HTTP status | retryable | Fixed detail |
|---|---|---|---|---|
| requiredAcknowledgmentOrReviewMissing === true | unauthorized | 403 | false | T-CERT-01 supplied missing required provider acknowledgment or certification review blocks certification evidence |
| Otherwise scopeMismatch === true | stale_or_conflicting_command | 409 | false | T-CERT-01 supplied certification scope mismatch blocks certification evidence |
| Otherwise evidenceStale === true | stale_or_conflicting_command | 409 | false | T-CERT-01 supplied stale certification evidence blocks certification evidence |
| Otherwise requiredSandboxEvidenceMissing === true | invalid_request | 400 | false | T-CERT-01 supplied missing required real sandbox evidence blocks certification evidence |
| Otherwise requiredSdkDeviceEvidenceMissing === true | invalid_request | 400 | false | T-CERT-01 supplied missing required SDK or device evidence blocks certification evidence |
| Otherwise unsupportedCaseClaimedPassed === true | invalid_request | 400 | false | T-CERT-01 supplied unsupported certification case claimed passed blocks certification evidence |
| Otherwise (all six flags false) | dependency_unavailable | 503 | true | T-CERT-01 checkCertificationEvidence cannot verify scoped candidate/provider/account/method identity, freshness, required acknowledgment or review, real sandbox evidence, SDK/device proof or unsupported-case restrictions: full T-CERT-01 remains HOLD (fail closed) |

Return only failures with exactly { ok: false, error: { code, status, retryable, detail } }. Use the bounded, non-PII detail strings above verbatim. No extra branch, code, value, kind, operationId, fieldErrors, report, finding, candidate/scope/certification/gate state, blocker list, count, digest, manifest, proof, permission, evidence, authority or other result field. All flags false still refuses with 503. retryable: true authorizes no automatic retry, candidate/scope lookup, evidence or acknowledgment/review collection, scheduling, sandbox run, certification, activation or command execution. Return no complete/verified/accepted/certified/eligible/ready/covered verdict, CertificationDecision, GateReport, provider outcome, certification/coverage report, ReleaseEvidenceBundle or G3 decision. Never claim evidence acceptance, sandbox certification, actual provider behavior, SDK/device compatibility, financial reconciliation, commercial approval or readiness.

No persistence or store/database access, including real, test or in-memory substitute stores. No filesystem, directory enumeration, file existence check, artifact/source/archive access, import/binding/route reachability checks, schema validation, evidence inspection, scope/feature/operation/scenario coverage or set comparison, actual candidate/scope comparison or freshness check, OpenAPI lint/generation/drift scan, Git operation, hashing, manifest generation/comparison, environment read, subprocess, clock, randomness, network, credentials, signature verification/signing, queue/outbox/timer, trace/log/audit/metric emission, cache or state transition. No test-runner, lifecycle, concurrency, physical-device, SDK, provider, statement or financial-oracle execution by the checker or its new tests. No money arithmetic, financial reconciliation, ledger/points path, executeCommand, posting, holds, approval, balance mutation, reservation, transfer/operation creation or financial outcome. Accept no paths, bytes, IDs, hashes, versions, timestamps, schemas, registries, mappings, counts, manifests, proofs, artifacts, code, test results, consent/identity records, accounts, tokens, provider references/outcomes, acknowledgments, approvals, cap values, amounts, currencies or financial data. The two unused context metadata fields are the only identifiers accepted.

Do not wire the checker into certifyProvider, verifyIntegration, release/gate runners, build/CI gates, API/controllers/workers/UI, activation policy, workspace/migration scripts, guards, handoff tools, provider ports or any money workflow. No changes to runbooks, infrastructure, CI, packages/configuration/dependencies, generated clients, frozen OpenAPI/events/SQL, migrations, grants, inventories, manifests, source archives or target-copy migration decisions. No deployment, production activation, publication, live pilot, GitHub merge or G1-G6 closure. T-CORE-02/T-FIN-01/T-LEDGER-02/T-REWARD-01, T-LIVE-01 and T-GA-01 implementation remains prohibited.

TEST-CERT-01 must cover all 64 boolean combinations in an explicit independently specified expected-results table. In the flag order above, include all 32 missing-acknowledgment-or-review combinations, all 16 remaining scope-mismatch combinations, all eight remaining stale-evidence combinations, all four remaining missing-sandbox-evidence combinations, both remaining missing-SDK/device-evidence combinations, the sole remaining unsupported-case-claimed-passed combination and the all-false fallback. Expected code/status/retryable/detail must be literal expectations, not computed by copying the checker's if-chain or importing implementation constants. Assert the complete exact error-only result with toStrictEqual, exact top-level/error keys and absence of value/kind/extra certification/provider/candidate/report/evidence/authority fields for every case. Assert an identical refusal on a repeated call. Object.freeze each input and context, capture their values before calling and verify both remain unchanged after both calls. Use no filesystem fixture, source/artifact/candidate/evidence bytes, mappings, actual scope/coverage/candidate validation, hash/signature, mocked store, fake provider, SDK/device harness, financial data, oracle, clock or randomness. Preserve all existing tests without edits.

These tests establish only supplied-blocker precedence, deterministic refusal and input/context non-mutation. They do not prove acknowledgment/review, scoped identity/freshness, sandbox execution, provider outcomes, SDK/device compatibility, reconciliation, unsupported-case handling or EV(T-CERT-01). They do not satisfy full T-CERT-01, T-INTEGRATE-01, T-SCOPE-01, T-CONTRACT-01, T-BASE-01, T-DEPEND-01, T-CORE-01, T-RELEASE-01, any related task, CP gap, PACK acceptance, dependency/activation condition or G1-G6. Existing source/scope, migration, workspace/handoff, contract, integration, certification and enablement holds remain open.

Validation required on the returned implementation head (run from apps/kita/):

~~~sh
./node_modules/.bin/vitest run tests/features/test-cert-01.spec.ts tests/features/test-integrate-01.spec.ts tests/features/test-scope-01.spec.ts tests/features/test-contract-01.spec.ts tests/features/test-release-01.spec.ts tests/features/test-base-01.spec.ts tests/features/test-mig-01.spec.ts tests/features/test-adapter-01.spec.ts tests/features/test-identity-01.spec.ts tests/features/test-quote-01.spec.ts tests/features/test-auth-01.spec.ts tests/features/test-auth-02.spec.ts tests/features/test-auth-03.spec.ts tests/features/test-auth-04.spec.ts tests/features/test-auth-05.spec.ts tests/features/test-auth-06.spec.ts tests/features/test-auth-07.spec.ts
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --noUncheckedIndexedAccess --exactOptionalPropertyTypes packages/contracts/src/certification-evidence.ts
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --noUncheckedIndexedAccess --exactOptionalPropertyTypes packages/platform/check-certification-evidence.ts
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --noUncheckedIndexedAccess --exactOptionalPropertyTypes packages/contracts/src/integration-evidence.ts packages/platform/check-integration-evidence.ts packages/contracts/src/original-spec-crosswalk.ts packages/platform/check-original-spec-crosswalk.ts packages/contracts/src/contract-freeze.ts packages/platform/check-contract-freeze.ts packages/contracts/src/release.ts packages/platform/check-release-evidence.ts packages/contracts/src/workspace.ts packages/platform/check-workspace-evidence.ts
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
with tempfile.TemporaryDirectory(prefix='kita-cert01-review-', dir='/tmp') as temp:
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

At the planning baseline, the unmodified contracts package check fails (exit 2) with 15 diagnostics. With explicit --allowImportingTsExtensions it fails (exit 2) with the same five registry diagnostics below. Both were rerun at 35d05ec. These are existing failing gates, not waived or passed checks:

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

Require all 64 new refusal cases and all 406 baseline integration/scope/contract/release/workspace/migration/adapter/identity/quote/AUTH cases to pass (470 feature cases across seventeen files), the four existing provider cases to pass separately, both new strict isolated checks and the existing strict isolated integration/scope/contract/release/workspace check above to pass without diagnostics. Rerun and report both full contracts package checks separately with actual exit statuses and complete diagnostics. Preserve the exact existing diagnostic identities and locations because all existing files are outside the allowlist. Do not suppress diagnostics, change configuration, fix unrelated files or treat existing package failures as closed. This planning decision validates no subsequent implementation. Any new diagnostic, changed existing failure, failed/missing test, need for actual scope/candidate/review/acknowledgment/evidence/provider/SDK/device/financial/hash/store access or scope expansion returns to Sol as BATCH-HOLD.

Inspect the complete final diff and imports for effects, success/certification/coverage/report/evidence/authority paths, indirect access to certification/integration/activation/release/gate runners or other checkers, and changes outside the three allowed implementation paths. Return the coordinator-recorded implementation base, exact implementation head, changed-file list, full diff and complete test/type-check outcomes for Codex Sol max review. No full task, connected feature or gate closes merely because refusal tests pass.

Implementation follows the established roles: Qoder CLI Efficient Agent Teams/subagents on gpu-fqaf implement the authorized checker; coordinator handles sync/bundles/GitHub; Codex Sol max reviews the returned batch. This document authorizes only the specified limited checker; it does not start implementation, a swarm, certification/integration wiring, candidate/scope inspection, acknowledgment/review/evidence collection, lifecycle/device/SDK/provider/financial-oracle runs, hashing, release assembly, a gate runner, an activation or a store. If the checker cannot fit these constraints, stop the batch and report BATCH-HOLD with the reason. Money path closed; T-LIVE-01/T-GA-01 remain prohibited; no production, live-pilot or G1-G6 approval.
