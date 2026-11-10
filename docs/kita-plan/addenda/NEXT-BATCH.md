BATCH-OK

Authorize only the T-BASE-01 checkWorkspaceEvidence LIMITED PURE boolean-input fail-closed checker specified below. Full T-BASE-01 remains HOLD. Money path closed. Never authorize ok: true, executeCommand, ledger posting, financial execution, persistence or stores. T-CORE-02, T-FIN-01, T-LEDGER-02 and T-REWARD-01 remain HOLD; no implementation, scaffold or new checker for those tasks is authorized. No production, live pilot or G1-G6 closure is authorized.

Planning baseline: 7cb802d1b0e057fbb6dd0537bed3e6492682ed83 on cursor/kita-mig01-check-migration-evidence-05a3 (PR #106 supplied by the operator). T-MIG-01 checkMigrationEvidence has landed as a refusal-only checker; full T-MIG-01 remains HOLD. Local rechecks at this head: TEST-MIG-01 32 passed; together with TEST-ADAPTER-01, TEST-IDENTITY-01, TEST-QUOTE-01 and TEST-AUTH-01 through TEST-AUTH-07, 118 feature tests passed across eleven files (exit 0). The four existing tests/providers/outcome-contract.spec.ts cases passed separately (exit 0), using a temporary configuration because the default Kita Vitest include covers only tests/features. Strict isolated checking of migration.ts and check-migration-evidence.ts passed together (exit 0). These results establish neither migration completion nor workspace/handoff authority. The three proposed T-BASE-01 files are absent at this baseline; no proposed checker implementation has been tested.

Selection basis: [13-backlog.md](../13-backlog.md#t-base-01--verify-isolated-target-workspace-and-reproducible-handoff-boundary) T-BASE-01 requires source/target isolation, rejection of overlap with the read-only archive or unrelated root application, archive/path traversal protection and hash-addressed GPU-to-VM handoff validation. [03-migration-map.md](../03-migration-map.md) preserves the original archive as read-only historical evidence. Backlog M2 supplies invalid_request / 400, unauthorized / 403, stale_or_conflicting_command / 409 and dependency_unavailable / 503. Those requirements permit a disconnected supplied-blocker refusal contract only. This checker cannot perform the task's verifyWorkspaceBoundary(WorkspaceManifest) work or produce its BoundaryReport, allowed file set or handoff manifest. T-BASE-01 depends on T-SCOPE-01; this limited checker bypasses and satisfies no prerequisite.

Preferred-task disposition for this batch:

| Task | Disposition | Reason / work still withheld |
|---|---|---|
| T-BASE-01 | BATCH-OK for the checker below only; full task HOLD | Supplied boolean blockers can produce refusals only; actual source/target isolation, path safety, exact batch/base identity, bundle verification and handoff acceptance remain unproved. |
| T-RELEASE-01 | HOLD; not selected after T-BASE-01 fits | Integration/certification, exact-candidate proofs, freshness, approvers and signed release evidence remain open; no release decision or gate closure. |
| T-CONTRACT-01 | HOLD; freeze-only slice not selected | Reviewed definitions, ownership, compatibility and signed hashes remain separate work; the existing freezeContracts success/hash/clock path is outside this authorization. |
| T-SCOPE-01 | HOLD; not selected | Original-spec recovery/crosswalk, source evidence and Product/Sol scope review remain open; DEP-00 is not closed and no coverage is certified. |

Only this T-BASE-01 checker is selected. Other rows do not assert those IDs are incapable of future bounded checkers. This decision supersedes the landed T-MIG-01 next-batch authorization; authorizations are not cumulative. Preserve all landed checkers, full-task holds, CP gaps, dependency/activation gates and G1-G6 holds. A TEST-BASE-01 refusal suite cannot close T-BASE-01 or its dependency graph.

Allowed implementation files only (paths relative to apps/kita/; all three are absent at the planning baseline):

- packages/contracts/src/workspace.ts — create only Base01Input, Base01Output and Base01CommandContext type declarations, with a type-only WorkerContext import from ./context.ts. No runtime declarations or imports.
- packages/platform/check-workspace-evidence.ts — create one standalone inert checkWorkspaceEvidence checker with no other runtime export.
- tests/features/test-base-01.spec.ts — create focused TEST-BASE-01 refusal tests only.

No other implementation file is allowed. Preserve all existing files, including contracts/result.ts, context.ts, index.ts, commands.ts, events.ts, freeze-contracts.ts, platform/validate-build-baseline.ts, evaluate-release-gates.ts, check-migration-evidence.ts, scripts/check-migration-inventory.ts, all guards, manifests, archives and existing tests. Do not create tools/verify-workspace-boundary.ts or a workspace-boundary report, source manifest or handoff utility. No barrel or package export. This planning update edits only docs/kita-plan/addenda/NEXT-BATCH.md; existing untracked files are outside the batch. The coordinator must record an exact implementation base containing this plan and descending from the planning baseline, and the exact returned head. Changes between the planning baseline and implementation base other than this planning file require Sol review before implementation. The implementation diff from that recorded base may contain only the three new implementation paths above.

Exact required Base01Input flags (all required; no optional or additional data fields):

~~~ts
readonly sourceArchiveOverlapPresent: boolean;
readonly unrelatedRootOverlapPresent: boolean;
readonly pathTraversalPresent: boolean;
readonly batchScopeMismatch: boolean;
readonly handoffHashMismatch: boolean;
~~~

Flag meanings are supplied blockers only:

- sourceArchiveOverlapPresent: supplied overlap of the proposed target/write boundary with protected source-archive evidence. Accept no source/target path, archive, file, root, filesystem handle or overlap-checking function.
- unrelatedRootOverlapPresent: supplied overlap of the proposed Kita target/write boundary with the unrelated root application. Accept no workspace/root identity, configuration, path list or boundary-checking function.
- pathTraversalPresent: supplied path traversal or path/link escape from the intended boundary. Accept no path, archive entry, link, resolver, extraction instruction or validation callback.
- batchScopeMismatch: supplied disagreement with the recorded batch/base boundary or supplied change outside the reviewed allowed file set. Accept no batch/base identifier, changed-file list, allowlist, diff, command or comparison function.
- handoffHashMismatch: supplied disagreement of recorded handoff/bundle/base digests. Accept no bytes, digest, bundle, inventory, manifest, signature or hash-comparison function.

Do not derive, verify or clear these flags. False flags prove no isolation, safe paths, source preservation, allowed change set, exact base/head, reproducibility or accepted handoff. Do not infer successful boundary verification from them. Do not inspect the workspace, compare roots or hashes, resolve paths or links, check a changed-file list, unpack a bundle or accept a GPU-to-VM handoff. Full T-BASE-01 and all financial/activation gates remain HOLD for every input.

Define Base01Output = never. Define Base01CommandContext as Pick<WorkerContext, 'workId' | 'attemptGeneration'>. The exact signature is checkWorkspaceEvidence(ctx: Base01CommandContext, input: Base01Input): Promise<Result<Base01Output, Problem>>. Both context fields are unused metadata and establish no worker, actor, environment, workspace, handoff or command authority. Do not accept CommandContext, ReadContext, full WorkerContext, transaction runners, trace/capability/execution callbacks, dependencies or extra context fields.

The checker uses type-only imports for Base01 types from ../contracts/src/workspace.ts and Problem/Result from ../contracts/src/result.ts. Its only runtime import is the existing err/problem helpers from ../contracts/src/result.ts. Never import a runtime barrel, workspace/migration tools, freezeContracts, validateBuildBaseline, evaluateReleaseGates, unavailable or ok helpers, node modules, money utilities, providers, stores or another checker. Add no dependency or runtime schema. Test imports may use vitest, the new checker and direct contract type paths (including UUID from context.ts); no contract/platform/provider barrel.

Required behavior in this exact order; the first true blocker wins regardless of every lower-priority flag:

| Condition | Exact error code | HTTP status | retryable | Fixed detail |
|---|---|---|---|---|
| sourceArchiveOverlapPresent === true | unauthorized | 403 | false | T-BASE-01 supplied source archive overlap blocks workspace evidence |
| Otherwise unrelatedRootOverlapPresent === true | unauthorized | 403 | false | T-BASE-01 supplied unrelated root overlap blocks workspace evidence |
| Otherwise pathTraversalPresent === true | invalid_request | 400 | false | T-BASE-01 supplied path traversal blocks workspace evidence |
| Otherwise batchScopeMismatch === true | unauthorized | 403 | false | T-BASE-01 supplied batch scope mismatch blocks workspace evidence |
| Otherwise handoffHashMismatch === true | stale_or_conflicting_command | 409 | false | T-BASE-01 supplied handoff hash mismatch blocks workspace evidence |
| Otherwise (all five flags false) | dependency_unavailable | 503 | true | T-BASE-01 checkWorkspaceEvidence cannot verify workspace isolation, path safety, batch boundaries or handoff hashes: full T-BASE-01 remains HOLD (fail closed) |

Return only failures with exactly { ok: false, error: { code, status, retryable, detail } }. Use the bounded, non-PII detail strings above verbatim. No extra branch, code, value, kind, operationId, fieldErrors, report, finding, path, allowed file set, count, hash, manifest, permission, evidence, authority or other result field. All flags false still refuses with 503. retryable: true authorizes no automatic retry, scan, unpacking, sync, handoff, scheduling or command execution. Return no passed/complete/verified/accepted/eligible/ready verdict or BoundaryReport/CoverageReport/ContractManifest/release manifest. Never claim a workspace is isolated, archive preserved, path safe, diff allowed, base/head matched, bundle verified or handoff accepted.

No persistence or store/database access, including real, test or in-memory substitute stores. No filesystem, archive access/extraction, directory enumeration, path resolution/traversal validation, link inspection, file existence check, hashing, manifest generation/comparison, source/target modification, build/import scan, Git operation, environment read, subprocess, clock, randomness, network, credentials, signature verification, queue/outbox/timer, trace/log/audit/metric emission, cache or state transition. No money arithmetic, ledger/points path, executeCommand, posting, holds, approval, balance mutation, reservation, transfer/operation creation or financial outcome. Accept no paths, source data, bytes, hashes, manifests, artifacts, code, consent/identity records, accounts, tokens, provider references, approvals, amounts, currencies or financial data. The two unused context metadata fields are the only identifiers accepted.

Do not wire the checker into workspace/migration scripts, guards, build/CI gates, API/controllers/workers/UI, handoff tools, provider ports, release runners or any money workflow. No changes to runbooks, infrastructure, CI, packages/configuration/dependencies, generated clients, frozen OpenAPI/events/SQL, migrations, grants, inventories, manifests, source archives or target-copy migration decisions. No deployment, production activation, publication, live pilot, GitHub merge or G1-G6 closure. T-CORE-02/T-FIN-01/T-LEDGER-02/T-REWARD-01 implementation remains prohibited.

TEST-BASE-01 must cover all 32 boolean combinations in an explicit independently specified expected-results table. In the flag order above, include all 16 source-archive-overlap combinations, all eight remaining unrelated-root-overlap combinations, all four remaining path-traversal combinations, both remaining batch-scope-mismatch combinations, the sole remaining handoff-hash-mismatch combination and the all-false fallback. Expected code/status/retryable/detail must be literal expectations, not computed by copying the checker's if-chain or importing implementation constants. Assert the complete exact error-only result for every case, absence of value/kind/extra report/evidence/authority fields and identical refusal on a repeated call. Object.freeze each input and context, capture their values before calling and verify both remain unchanged. Use no filesystem fixture, real path/link/bundle/hash check, mocked store, fake provider, clock or randomness. Preserve all existing tests without edits.

These tests establish only supplied-blocker precedence, deterministic refusal and input/context non-mutation. They do not prove actual isolation, archive/path traversal protection, hash-addressed GPU-to-VM bundle validation, handoff acceptance or EV(T-BASE-01). They do not satisfy full T-BASE-01, T-SCOPE-01, T-MIG-01, any related task, CP gap, PACK acceptance, dependency/activation condition or G1-G6. Existing migration/archive/hash limitations and source/scope holds remain open.

Validation required on the returned implementation head (run from apps/kita/):

~~~sh
./node_modules/.bin/vitest run tests/features/test-base-01.spec.ts tests/features/test-mig-01.spec.ts tests/features/test-adapter-01.spec.ts tests/features/test-identity-01.spec.ts tests/features/test-quote-01.spec.ts tests/features/test-auth-01.spec.ts tests/features/test-auth-02.spec.ts tests/features/test-auth-03.spec.ts tests/features/test-auth-04.spec.ts tests/features/test-auth-05.spec.ts tests/features/test-auth-06.spec.ts tests/features/test-auth-07.spec.ts
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --noUncheckedIndexedAccess --exactOptionalPropertyTypes packages/contracts/src/workspace.ts
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --noUncheckedIndexedAccess --exactOptionalPropertyTypes packages/platform/check-workspace-evidence.ts
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
with tempfile.TemporaryDirectory(prefix='kita-base01-review-', dir='/tmp') as temp:
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

At the planning baseline, the unmodified contracts package check fails (exit 2) with 15 diagnostics. With explicit --allowImportingTsExtensions it fails (exit 2) with the same five registry diagnostics below. Both were rerun at 7cb802d. These are existing failing gates, not waived or passed checks:

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

Require all 32 new refusal cases and all 118 baseline migration/adapter/identity/quote/AUTH cases to pass (150 feature cases across twelve files), the four existing provider cases to pass separately, and both new strict isolated checks to pass without diagnostics. Rerun and report both full contracts package checks separately with actual exit statuses and complete diagnostics. Preserve the exact existing diagnostic identities and locations because all existing files are outside the allowlist. Do not suppress diagnostics, change configuration, fix unrelated files or treat existing package failures as closed. This planning decision validates no subsequent implementation. Any new diagnostic, changed existing failure, failed/missing test, need for workspace/path/archive/hash/store access or scope expansion returns to Sol as BATCH-HOLD.

Inspect the complete final diff and imports for effects, success/report/evidence/authority paths and changes outside the three allowed implementation paths. Return the coordinator-recorded implementation base, exact implementation head, changed-file list, full diff and complete test/type-check outcomes for Codex Sol max review. No full task, connected feature or gate closes merely because refusal tests pass.

Implementation follows the established roles: Qoder CLI Efficient Agent Teams/subagents on gpu-fqaf implement the authorized checker; coordinator handles sync/bundles/GitHub; Codex Sol max reviews the returned batch. This document authorizes only the specified limited checker; it does not start implementation, a swarm, workspace verification, a handoff, a provider interaction or a store. If the checker cannot fit these constraints, stop the batch and report BATCH-HOLD with the reason. Money path closed; no production, live-pilot or G1-G6 approval.
