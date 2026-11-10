BATCH-OK

Authorize only the T-RELEASE-01 checkReleaseEvidence LIMITED PURE boolean-input fail-closed checker specified below. Full T-RELEASE-01 remains HOLD. Money path closed. Never authorize ok: true, executeCommand, ledger posting, financial execution, persistence or stores. T-CORE-02, T-FIN-01, T-LEDGER-02 and T-REWARD-01 remain HOLD; no implementation, scaffold or new checker for those tasks is authorized. No production, live pilot or G1-G6 closure is authorized.

Planning baseline: 0ca02825437e55d819829e5727ea18beaf896008 on cursor/kita-base01-check-workspace-evidence-05a3 (PR #107 supplied by the operator). T-BASE-01 checkWorkspaceEvidence has landed as a refusal-only checker; full T-BASE-01 remains HOLD. Local rechecks at this head: TEST-BASE-01 32 passed; together with TEST-MIG-01, TEST-ADAPTER-01, TEST-IDENTITY-01, TEST-QUOTE-01 and TEST-AUTH-01 through TEST-AUTH-07, 150 feature tests passed across twelve files (exit 0). The four existing tests/providers/outcome-contract.spec.ts cases passed separately (exit 0), using a temporary configuration because the default Kita Vitest include covers only tests/features. Strict isolated checking of workspace.ts and check-workspace-evidence.ts passed together (exit 0). These results establish neither workspace/handoff acceptance nor release authority. The three proposed T-RELEASE-01 files are absent at this baseline; no proposed checker implementation has been tested.

Selection basis: [13-backlog.md](../13-backlog.md#t-release-01--assemble-exact-candidate-release-evidence-and-invalidate-stale-gate-results) T-RELEASE-01 requires exact source/artifact/contracts identity, scoped proofs, rejection of missing or stale evidence, candidate-drift and missing-approver/caps tests, and changed-provider invalidation. [12-tests-gates.md L9](../12-tests-gates.md#l9-six-sequential-release-stages) requires exact-candidate evidence, separate scoped approvals and invalidation after artifact/contracts/policy/provider changes; internal tests never grant live authorization. Backlog M2 supplies invalid_request / 400, unauthorized / 403, stale_or_conflicting_command / 409 and dependency_unavailable / 503. These requirements permit a disconnected supplied-blocker refusal contract only. This checker cannot perform assembleReleaseEvidence(ReleaseCandidate, GateEvidence[]), collect or validate proofs, invalidate stored results, produce a ReleaseEvidenceBundle or declare any gate state. T-RELEASE-01 depends on T-INTEGRATE-01 and T-CERT-01; this limited checker bypasses and satisfies no prerequisite.

Preferred-task disposition for this batch:

| Task | Disposition | Reason / work still withheld |
|---|---|---|
| T-RELEASE-01 | BATCH-OK for the checker below only; full task HOLD | Supplied boolean blockers can produce refusals only; integration/certification, exact-candidate proofs, freshness, approvers, caps and signed release evidence remain unproved. |
| T-CONTRACT-01 | HOLD; freeze-only slice not selected after T-RELEASE-01 fits | Reviewed definitions, ownership, compatibility and signed hashes remain separate work; the existing freezeContracts success/hash/clock path is outside this authorization. |
| T-SCOPE-01 | HOLD; not selected after T-RELEASE-01 fits | Original-spec recovery/crosswalk, source evidence and Product/Sol scope review remain open; DEP-00 is not closed and no coverage is certified. |

Only this T-RELEASE-01 checker is selected. Other rows do not assert those IDs are incapable of future bounded checkers. This decision supersedes the landed T-BASE-01 next-batch authorization and all earlier next-batch permissions; authorizations are not cumulative. Preserve all landed checkers, full-task holds, CP gaps, dependency/activation gates and G1-G6 holds. A TEST-RELEASE-01 refusal suite cannot close T-RELEASE-01 or its dependency graph.

Allowed implementation files only (paths relative to apps/kita/; all three are absent at the planning baseline):

- packages/contracts/src/release.ts — create only Release01Input, Release01Output and Release01CommandContext type declarations, with a type-only WorkerContext import from ./context.ts. No runtime declarations or imports.
- packages/platform/check-release-evidence.ts — create one standalone inert checkReleaseEvidence checker with no other runtime export.
- tests/features/test-release-01.spec.ts — create focused TEST-RELEASE-01 refusal tests only.

No other implementation file is allowed. Preserve all existing files, including contracts/result.ts, context.ts, index.ts, commands.ts, events.ts, freeze-contracts.ts, workspace.ts, platform/validate-build-baseline.ts, evaluate-release-gates.ts, check-workspace-evidence.ts, all other landed checkers, guards, manifests, archives and existing tests. Do not create tools/assemble-release-evidence.ts, tools/run-kita-gates.ts, docs/runbooks/kita-launch.md or evidence/releases/manifest.schema.json. No barrel or package export. This planning update edits only docs/kita-plan/addenda/NEXT-BATCH.md; existing untracked files are outside the batch. The coordinator must record an exact implementation base containing this plan and descending from the planning baseline, and the exact returned head. Changes between the planning baseline and implementation base other than this planning file require Sol review before implementation. The implementation diff from that recorded base may contain only the three new implementation paths above.

Exact required Release01Input flags, in priority order (all required; no optional or additional data fields):

~~~ts
readonly requiredApproverMissing: boolean;
readonly requiredCapsMissing: boolean;
readonly gateEvidenceMissing: boolean;
readonly candidateMismatch: boolean;
readonly gateEvidenceStale: boolean;
readonly providerEvidenceInvalidated: boolean;
~~~

Flag meanings are supplied blockers only:

- requiredApproverMissing: supplied absence of a required scoped approver. Accept no approver identity, approval record, signature, role, review or authorization-checking function.
- requiredCapsMissing: supplied absence of required approved scope/exposure caps. Accept no cap value, amount, currency, cohort, dates, policy, activation command or cap-evaluation function.
- gateEvidenceMissing: supplied absence or incompleteness of a required scoped proof set. Accept no gate list, test result, proof, manifest, evidence object or evidence-reading function.
- candidateMismatch: supplied disagreement of the source/artifact/contracts/policy identity or scope with the candidate covered by the proofs. Accept no candidate identifier, source bytes, digest, scope record, artifact, contract, policy or comparison function.
- gateEvidenceStale: supplied stale or expired gate evidence. Accept no timestamp, age, expiry rule, clock, evidence record or freshness-evaluation function.
- providerEvidenceInvalidated: supplied invalidity of existing evidence following a provider/account/version change. Accept no provider identity, account/version record, transcript, configuration, invalidation instruction or provider interaction.

Do not derive, verify or clear these flags. False flags prove no exact-candidate match, complete/current evidence, valid approvals, sufficient caps or valid provider certification. Do not compare candidates, inspect proofs, verify signatures, evaluate caps/freshness, invalidate stored evidence or infer a release/gate decision. Full T-RELEASE-01 and all financial/activation gates remain HOLD for every input.

Define Release01Output = never. Define Release01CommandContext as Pick<WorkerContext, 'workId' | 'attemptGeneration'>. The exact signature is checkReleaseEvidence(ctx: Release01CommandContext, input: Release01Input): Promise<Result<Release01Output, Problem>>. Both context fields are unused metadata and establish no worker, actor, approver, candidate, gate, release or command authority. Do not accept CommandContext, ReadContext, full WorkerContext, transaction runners, trace/capability/execution callbacks, dependencies or extra context fields.

The checker uses type-only imports for Release01 types from ../contracts/src/release.ts and Problem/Result from ../contracts/src/result.ts. Its only runtime import is the existing err/problem helpers from ../contracts/src/result.ts. Never import a runtime barrel, freezeContracts, validateBuildBaseline, evaluateReleaseGates, unavailable or ok helpers, node modules, release/gate runners, providers, stores, money utilities or another checker. Add no dependency or runtime schema. Test imports may use vitest, the new checker and direct contract type paths (including UUID from context.ts); no contract/platform/provider barrel.

Required behavior in this exact order; the first true blocker wins regardless of every lower-priority flag:

| Condition | Exact error code | HTTP status | retryable | Fixed detail |
|---|---|---|---|---|
| requiredApproverMissing === true | unauthorized | 403 | false | T-RELEASE-01 supplied missing required approver blocks release evidence |
| Otherwise requiredCapsMissing === true | unauthorized | 403 | false | T-RELEASE-01 supplied missing required caps blocks release evidence |
| Otherwise gateEvidenceMissing === true | invalid_request | 400 | false | T-RELEASE-01 supplied missing gate evidence blocks release evidence |
| Otherwise candidateMismatch === true | stale_or_conflicting_command | 409 | false | T-RELEASE-01 supplied candidate mismatch blocks release evidence |
| Otherwise gateEvidenceStale === true | stale_or_conflicting_command | 409 | false | T-RELEASE-01 supplied stale gate evidence blocks release evidence |
| Otherwise providerEvidenceInvalidated === true | stale_or_conflicting_command | 409 | false | T-RELEASE-01 supplied provider evidence invalidation blocks release evidence |
| Otherwise (all six flags false) | dependency_unavailable | 503 | true | T-RELEASE-01 checkReleaseEvidence cannot verify exact-candidate proofs, freshness, approvals, caps or provider validity: full T-RELEASE-01 remains HOLD (fail closed) |

Return only failures with exactly { ok: false, error: { code, status, retryable, detail } }. Use the bounded, non-PII detail strings above verbatim. No extra branch, code, value, kind, operationId, fieldErrors, report, finding, gate state, blocker list, count, hash, manifest, proof, permission, evidence, authority or other result field. All flags false still refuses with 503. retryable: true authorizes no automatic retry, evidence collection, rerun, scheduling, invalidation, activation or command execution. Return no pending/passed/blocked stage manifest, complete/verified/accepted/eligible/ready verdict, ReleaseEvidenceBundle, BoundaryReport, CoverageReport or ContractManifest. Never claim exact-candidate verification, integration, certification, approval, adequate caps, release readiness or live authorization.

No persistence or store/database access, including real, test or in-memory substitute stores. No filesystem, directory enumeration, file existence check, archive access/extraction, source modification, build/import scan, hashing, manifest generation/comparison, Git operation, environment read, subprocess, clock, randomness, network, credentials, signature verification, queue/outbox/timer, trace/log/audit/metric emission, cache or state transition. No money arithmetic, ledger/points path, executeCommand, posting, holds, approval, balance mutation, reservation, transfer/operation creation or financial outcome. Accept no paths, source data, bytes, hashes, manifests, proofs, artifacts, code, test results, consent/identity records, accounts, tokens, provider references, approvals, cap values, amounts, currencies or financial data. The two unused context metadata fields are the only identifiers accepted.

Do not wire the checker into release/gate runners, build/CI gates, API/controllers/workers/UI, workspace/migration scripts, guards, handoff tools, provider ports or any money workflow. No changes to runbooks, infrastructure, CI, packages/configuration/dependencies, generated clients, frozen OpenAPI/events/SQL, migrations, grants, inventories, manifests, source archives or target-copy migration decisions. No deployment, production activation, publication, live pilot, GitHub merge or G1-G6 closure. T-CORE-02/T-FIN-01/T-LEDGER-02/T-REWARD-01 implementation remains prohibited.

TEST-RELEASE-01 must cover all 64 boolean combinations in an explicit independently specified expected-results table. In the flag order above, include all 32 missing-approver combinations, all 16 remaining missing-caps combinations, all eight remaining missing-evidence combinations, all four remaining candidate-mismatch combinations, both remaining stale-evidence combinations, the sole remaining provider-invalidation combination and the all-false fallback. Expected code/status/retryable/detail must be literal expectations, not computed by copying the checker's if-chain or importing implementation constants. Assert the complete exact error-only result for every case, absence of value/kind/extra gate/report/evidence/authority fields and identical refusal on a repeated call. Object.freeze each input and context, capture their values before calling and verify both remain unchanged. Use no filesystem fixture, real proof/candidate/hash/signature/freshness/cap check, mocked store, fake provider, clock or randomness. Preserve all existing tests without edits.

These tests establish only supplied-blocker precedence, deterministic refusal and input/context non-mutation. They do not prove actual candidate identity, manifest completeness, proof freshness, approval/cap validity, changed-provider invalidation or EV(T-RELEASE-01). They do not satisfy full T-RELEASE-01, T-INTEGRATE-01, T-CERT-01, any related task, CP gap, PACK acceptance, dependency/activation condition or G1-G6. Existing source/scope, migration, workspace/handoff, contract, integration and certification holds remain open.

Validation required on the returned implementation head (run from apps/kita/):

~~~sh
./node_modules/.bin/vitest run tests/features/test-release-01.spec.ts tests/features/test-base-01.spec.ts tests/features/test-mig-01.spec.ts tests/features/test-adapter-01.spec.ts tests/features/test-identity-01.spec.ts tests/features/test-quote-01.spec.ts tests/features/test-auth-01.spec.ts tests/features/test-auth-02.spec.ts tests/features/test-auth-03.spec.ts tests/features/test-auth-04.spec.ts tests/features/test-auth-05.spec.ts tests/features/test-auth-06.spec.ts tests/features/test-auth-07.spec.ts
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --noUncheckedIndexedAccess --exactOptionalPropertyTypes packages/contracts/src/release.ts
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --noUncheckedIndexedAccess --exactOptionalPropertyTypes packages/platform/check-release-evidence.ts
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --noUncheckedIndexedAccess --exactOptionalPropertyTypes packages/contracts/src/workspace.ts packages/platform/check-workspace-evidence.ts
./node_modules/.bin/tsc --noEmit --project packages/contracts/tsconfig.json
./node_modules/.bin/tsc --noEmit --project packages/contracts/tsconfig.json --allowImportingTsExtensions
~~~

Rerun the existing provider suite using the following temporary configuration. The default Kita config excludes tests/providers; passing that file to the default config does not establish a provider test result. This validation harness writes only under /tmp, pins the root to the current Kita slice and removes the temporary config afterward; it is not an implementation file or permission to change tracked configuration.

~~~sh
python3 - <<'PYTEST'
from pathlib import Path
import json
import subprocess
import tempfile

root = Path.cwd().resolve()
with tempfile.TemporaryDirectory(prefix='kita-release01-review-', dir='/tmp') as temp:
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

At the planning baseline, the unmodified contracts package check fails (exit 2) with 15 diagnostics. With explicit --allowImportingTsExtensions it fails (exit 2) with the same five registry diagnostics below. Both were rerun at 0ca0282. These are existing failing gates, not waived or passed checks:

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

Require all 64 new refusal cases and all 150 baseline workspace/migration/adapter/identity/quote/AUTH cases to pass (214 feature cases across thirteen files), the four existing provider cases to pass separately, both new strict isolated checks and the existing strict isolated workspace/check-workspace-evidence pair to pass without diagnostics. Rerun and report both full contracts package checks separately with actual exit statuses and complete diagnostics. Preserve the exact existing diagnostic identities and locations because all existing files are outside the allowlist. Do not suppress diagnostics, change configuration, fix unrelated files or treat existing package failures as closed. This planning decision validates no subsequent implementation. Any new diagnostic, changed existing failure, failed/missing test, need for actual evidence/candidate/signature/cap/freshness/provider/store access or scope expansion returns to Sol as BATCH-HOLD.

Inspect the complete final diff and imports for effects, success/report/evidence/authority paths and changes outside the three allowed implementation paths. Return the coordinator-recorded implementation base, exact implementation head, changed-file list, full diff and complete test/type-check outcomes for Codex Sol max review. No full task, connected feature or gate closes merely because refusal tests pass.

Implementation follows the established roles: Qoder CLI Efficient Agent Teams/subagents on gpu-fqaf implement the authorized checker; coordinator handles sync/bundles/GitHub; Codex Sol max reviews the returned batch. This document authorizes only the specified limited checker; it does not start implementation, a swarm, evidence collection, release assembly, a gate runner, an invalidation process, an activation, a provider interaction or a store. If the checker cannot fit these constraints, stop the batch and report BATCH-HOLD with the reason. Money path closed; no production, live-pilot or G1-G6 approval.
