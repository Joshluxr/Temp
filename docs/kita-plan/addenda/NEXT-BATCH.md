BATCH-OK

Authorize only the T-MIG-01 checkMigrationEvidence LIMITED PURE boolean-input fail-closed checker specified below. Full T-MIG-01 remains HOLD. Money path closed. Never authorize ok: true, executeCommand, ledger posting, financial execution, persistence or stores. T-CORE-02, T-FIN-01, T-LEDGER-02 and T-REWARD-01 remain HOLD; no implementation, scaffold or new checker for those tasks is authorized. No production, live pilot or G1-G6 closure is authorized.

Reviewed baseline: ece41bafc3fbadf009a18b6103a19d58645ecfe9 on cursor/kita-adapter01-check-evidence-05a3 (PR #105). T-ADAPTER-01 checkAdapterEvidence has landed as a refusal-only checker; full adapter transport/evidence authority remains HOLD. Rechecked TEST-ADAPTER-01: 32 passed. Together with TEST-IDENTITY-01, TEST-QUOTE-01 and TEST-AUTH-01 through TEST-AUTH-07, 86 tests passed across ten files (exit 0). The four existing tests/providers/outcome-contract.spec.ts cases passed separately (exit 0), using a temporary configuration because the default Kita Vitest include covers only tests/features. Strict isolated checking of adapters.ts and check-adapter-evidence.ts passed (exit 0). These results establish neither provider authority nor full-task completion. No proposed migration checker exists or has been tested at this baseline.

Selection basis: [13-backlog.md](../13-backlog.md#t-mig-01--apply-and-account-for-every-source-file-migration-decision-eliminate-prototype-authority) T-MIG-01 rejects mismatched source hashes, incomplete/duplicate dispositions and prohibited runtime imports or simulator reachability; it preserves the supplied archive and excludes sandbox authority from production. [03-migration-map.md](../03-migration-map.md) requires one disposition per physical file, read-only source history and separately authorized, consented, reverified data handling. [SOL-MIG-REVIEW.md](../SOL-MIG-REVIEW.md) records only a CONDITIONAL-PASS: 142 dispositions and a passing existing checker, without comparison of the recorded hashes against the live archive. That limitation remains open; this planning review does not perform that comparison. Backlog M2 supplies invalid_request / 400, unauthorized / 403, stale_or_conflicting_command / 409 and dependency_unavailable / 503. The ordered errors below define only an internal supplied-blocker refusal contract, with no change to public wire contracts or existing migration reports.

T-MIG-01 is the first preferred candidate and fits only this disconnected checker. Preserve scripts/check-migration-inventory.ts, its verifyMigration comparison/report behavior, docs/migration/disposition-manifest.json, the source inventory and the supplied archive unchanged. Do not call, wrap, extract, replace or expand that script. The checker must not import it: it has top-level filesystem/hash/reachability work and a report with an ok boolean. No archive inventory, file migration, prototype removal, data import or production-opening evidence work is included.

Preferred-task disposition for this batch:

| Task | Disposition | Reason / work still withheld |
|---|---|---|
| T-MIG-01 | BATCH-OK for the checker below only; full task HOLD | Supplied boolean blockers may produce refusals only. Live archive/hash comparison, exact dispositions, build/import reachability, visual/license review and consented data handling remain unproved. |
| T-BASE-01 | HOLD; not selected after T-MIG-01 fits | Actual archive/root isolation, path safety and hash-addressed GPU-to-VM bundle evidence remain outside this checker; no handoff acceptance. |
| T-RELEASE-01 | HOLD; not selected | Exact-candidate evidence, freshness, approvers and integration/certification prerequisites remain open; no release decision or gate closure. |
| T-CONTRACT-01 | HOLD; freeze-only slice not selected | This batch neither freezes nor hashes contracts and does not import, call or extend freezeContracts; reviewed definitions, compatibility and ownership remain separate work. |
| T-SCOPE-01 | HOLD; not selected | Original-spec recovery/crosswalk, source evidence and Product/Sol scope review remain open; DEP-00 is not closed and no coverage is certified. |

Only this T-MIG-01 checker is selected. Other rows do not assert those IDs are incapable of future bounded checkers. This decision supersedes the landed T-ADAPTER-01 next-batch authorization; authorizations are not cumulative. Preserve all landed checkers and all existing full-task holds, CP gaps, dependency/activation gates and G1-G6 holds. The new TEST-MIG-01 name will not establish full migration completion or satisfy its dependency graph.

Allowed implementation files only (paths relative to apps/kita/; all three are absent at the reviewed baseline):

- packages/contracts/src/migration.ts — create only Mig01Input, Mig01Output and Mig01CommandContext type declarations, with a type-only WorkerContext import from ./context.ts. No runtime declarations or imports.
- packages/platform/check-migration-evidence.ts — create one standalone inert checkMigrationEvidence checker with no other runtime export.
- tests/features/test-mig-01.spec.ts — create focused TEST-MIG-01 refusal tests only.

No other implementation file is allowed. Preserve all existing files, including contracts/result.ts, context.ts, index.ts, commands.ts, events.ts, freeze-contracts.ts, platform/migrate-core.ts, validate-build-baseline.ts, evaluate-release-gates.ts, scripts/check-migration-inventory.ts, all guards, manifests, archives and existing tests. No barrel or package export. This planning update edits only docs/kita-plan/addenda/NEXT-BATCH.md. The coordinator must record an exact implementation base containing this plan and descending from the reviewed baseline, and the exact returned head. Changes between the reviewed baseline and implementation base other than this planning file require Sol review before implementation. The implementation diff from that recorded base may contain only the three new implementation paths above.

Exact required Mig01Input flags (all required; no optional or additional data fields):

```ts
readonly archiveMutationRequested: boolean;
readonly sourceHashMismatch: boolean;
readonly dispositionCoverageIncomplete: boolean;
readonly prohibitedRuntimeReferencePresent: boolean;
readonly dataImportNotAuthorized: boolean;
```

Flag meanings are supplied blockers only:

- archiveMutationRequested: supplied request to write, move, replace or delete supplied source-archive evidence. This concerns the protected source, not the plan's separately reviewed target-copy exclusions. Accept no archive path, file, operation or mutation callback.
- sourceHashMismatch: supplied disagreement between source bytes and the frozen inventory or between recorded inventory/manifest digests. Accept no bytes, digest, inventory, source path or hash-comparison function.
- dispositionCoverageIncomplete: supplied missing, duplicate or extra source path, missing primary disposition or unsupported disposition. Accept no row, disposition name, path list, manifest, count or comparison function.
- prohibitedRuntimeReferencePresent: supplied production-reachable prototype/Kimi/MySQL reference, sandbox control, outcome-manufacturing path or retained floating-point financial path forbidden by the migration plan. Accept no code, import graph, symbol, build artifact or scanner. This flag is not provider or financial evidence.
- dataImportNotAuthorized: supplied import lacking required consent/legal approval, source-to-target mapping or reverification, or a prohibited import of sandbox IDs, balances, provider references or KYC/approval history as production facts. Accept no personal data, consent record, authorization, opening balance or import request. This checker never authorizes an import, including when this flag is false.

Do not derive, verify or clear these flags. False flags prove no archive preservation, hash equality, complete dispositions, runtime isolation, consent, lawful import or production readiness. Do not infer successful migration from them. Do not scan the archive or target, compare paths/hashes, inspect imports, evaluate consent or approve any disposition. Full T-MIG-01 and all financial/activation gates remain HOLD for every input.

Define Mig01Output = never. Define Mig01CommandContext as Pick<WorkerContext, 'workId' | 'attemptGeneration'>. The exact signature is checkMigrationEvidence(ctx: Mig01CommandContext, input: Mig01Input): Promise<Result<Mig01Output, Problem>>. Both context fields are unused metadata and establish no worker, actor, environment, migration, import or command authority. Do not accept CommandContext, ReadContext, full WorkerContext, transaction runners, trace/capability/execution callbacks, dependencies or extra context fields.

The checker uses type-only imports for Mig01 types from ../contracts/src/migration.ts and Problem/Result from ../contracts/src/result.ts. Its only runtime import is the existing err/problem helpers from ../contracts/src/result.ts. Never import a runtime barrel, migration scripts, freezeContracts, unavailable or ok helpers, node modules, money utilities, provider implementations, stores or another checker. Add no dependency or runtime schema. Test imports may use vitest, the new checker and direct contract type paths (including UUID from context.ts); no contract/platform/provider barrel.

Required behavior in this exact order; the first true blocker wins regardless of every lower-priority flag:

| Condition | Exact error code | HTTP status | retryable | Fixed detail |
|---|---|---|---|---|
| archiveMutationRequested === true | unauthorized | 403 | false | T-MIG-01 supplied archive mutation request blocks migration evidence |
| Otherwise sourceHashMismatch === true | stale_or_conflicting_command | 409 | false | T-MIG-01 supplied source hash mismatch blocks migration evidence |
| Otherwise dispositionCoverageIncomplete === true | invalid_request | 400 | false | T-MIG-01 supplied incomplete disposition coverage blocks migration evidence |
| Otherwise prohibitedRuntimeReferencePresent === true | unauthorized | 403 | false | T-MIG-01 supplied prohibited runtime reference blocks migration evidence |
| Otherwise dataImportNotAuthorized === true | unauthorized | 403 | false | T-MIG-01 supplied unauthorized data import blocks migration evidence |
| Otherwise (all five flags false) | dependency_unavailable | 503 | true | T-MIG-01 checkMigrationEvidence cannot verify archive preservation, source hashes, dispositions, runtime isolation or data authorization: full T-MIG-01 remains HOLD (fail closed) |

Return only failures with exactly { ok: false, error: { code, status, retryable, detail } }. Use the bounded, non-PII detail strings above verbatim. No extra branch, code, value, kind, operationId, fieldErrors, report, finding, count, hash, manifest, permission, evidence, authority or other result field. All flags false still refuses with 503. retryable: true authorizes no automatic retry, scan, migration, import, scheduling or command execution. Return no passed/complete/verified/accepted/eligible/ready verdict or MigrationReport/BoundaryReport/CoverageReport/release manifest. Never claim an archive was preserved, hashes compared, coverage checked, code isolated, consent validated, data imported, target copy removed or production book opened.

No persistence or store/database access, including real, test or in-memory substitute stores. No filesystem, archive access, path resolution/traversal validation, file existence check, hashing, manifest generation/comparison, source/target modification, build/import scan, environment read, subprocess, clock, randomness, network, credentials, signature verification, queue/outbox/timer, trace/log/audit/metric emission, cache or state transition. No money arithmetic, ledger/points path, executeCommand, posting, holds, approval, balance mutation, reservation, transfer/operation creation or financial outcome. Accept no source data, paths, bytes, hashes, manifests, artifacts, code, consent/identity records, accounts, tokens, provider references, approvals, amounts, currencies or financial data. The two unused context metadata fields are the only identifiers accepted.

Do not wire the checker into migration scripts, guards, build/CI gates, API/controllers/workers/UI, handoff tools, provider ports, release runners or any money workflow. No changes to runbooks, infrastructure, CI, packages/configuration/dependencies, generated clients, frozen OpenAPI/events/SQL, migrations, grants, inventories, manifests, source archives or target-copy migration decisions. No deployment, production activation, publication, live pilot, GitHub merge or G1-G6 closure. T-CORE-02/T-FIN-01/T-LEDGER-02/T-REWARD-01 implementation remains prohibited.

TEST-MIG-01 must cover all 32 boolean combinations in an explicit independently specified expected-results table. Expected code/status/retryable/detail must be literal expectations, not computed by copying the checker's if-chain or importing implementation constants. Include all 16 archive-mutation combinations, all eight remaining source-hash-mismatch combinations, all four remaining disposition-coverage combinations, both remaining prohibited-runtime-reference combinations, the sole remaining unauthorized-import combination and the all-false fallback. Assert the complete exact error-only result for every case, absence of value/kind/extra report/evidence/authority fields and identical refusal on a repeated call. Object.freeze each input and context, capture their values before calling and verify both remain unchanged. Use no filesystem fixture, archive scan, hash check, migration/report workflow, mocked store, fake provider, clock or randomness. Preserve all existing tests without edits.

These tests establish only supplied-blocker precedence, deterministic refusal and input/context non-mutation. They do not satisfy full T-MIG-01, the 142-row live archive/hash comparison, preservation or reachability evidence, REQ-SC-21, visual/license review, consent/reverification, production opening evidence, PACK acceptance, any related task or G1-G6. A passing refusal suite cannot supply facts absent from the existing CONDITIONAL-PASS.

Validation required on the returned implementation head (run from apps/kita/):

```sh
./node_modules/.bin/vitest run tests/features/test-mig-01.spec.ts tests/features/test-adapter-01.spec.ts tests/features/test-identity-01.spec.ts tests/features/test-quote-01.spec.ts tests/features/test-auth-01.spec.ts tests/features/test-auth-02.spec.ts tests/features/test-auth-03.spec.ts tests/features/test-auth-04.spec.ts tests/features/test-auth-05.spec.ts tests/features/test-auth-06.spec.ts tests/features/test-auth-07.spec.ts
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --noUncheckedIndexedAccess --exactOptionalPropertyTypes packages/contracts/src/migration.ts
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --noUncheckedIndexedAccess --exactOptionalPropertyTypes packages/platform/check-migration-evidence.ts
./node_modules/.bin/tsc --noEmit --project packages/contracts/tsconfig.json
./node_modules/.bin/tsc --noEmit --project packages/contracts/tsconfig.json --allowImportingTsExtensions
```

Rerun the existing provider suite using the following temporary configuration. The default Kita config excludes tests/providers; passing that file to the default config does not establish a provider test result. This validation harness writes only under /tmp, pins the root to the current Kita slice and removes the temporary config afterward; it is not an implementation file or permission to change tracked configuration.

```sh
python3 - <<'PY'
from pathlib import Path
import json
import subprocess
import tempfile

root = Path.cwd().resolve()
with tempfile.TemporaryDirectory(prefix='kita-mig01-review-', dir='/tmp') as temp:
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
PY
```

At the reviewed baseline, the unmodified contracts package check fails (exit 2) with 15 diagnostics. With explicit --allowImportingTsExtensions it fails (exit 2) with the same five registry diagnostics below. Both were rerun at ece41ba. These are existing failing gates, not waived or passed checks:

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

Require all 32 new refusal cases and all 86 reviewed adapter/identity/quote/AUTH cases to pass (118 feature cases across eleven files), the four existing provider cases to pass separately, and both new strict isolated checks to pass without diagnostics. Rerun and report both full contracts package checks separately with actual exit statuses and complete diagnostics. Preserve the exact existing diagnostic identities and locations because all existing files are outside the allowlist. Do not suppress diagnostics, change configuration, fix unrelated files or treat existing package failures as closed. The proposed types, checker and TEST-MIG-01 are absent at this reviewed baseline; this planning decision validates no subsequent implementation. Any new diagnostic, changed existing failure, failed/missing test, need for archive/hash/import/store access or scope expansion returns to Sol as BATCH-HOLD.

Inspect the complete final diff and imports for effects, success/report/evidence/authority paths and changes outside the three allowed implementation paths. Return the coordinator-recorded implementation base, exact implementation head, changed-file list, full diff and complete test/type-check outcomes for Codex Sol max review. No full task, connected feature or gate closes merely because refusal tests pass.

Implementation follows the established roles: Qoder CLI Efficient Agent Teams/subagents on gpu-fqaf implement the authorized checker; coordinator handles sync/bundles/GitHub; Codex Sol max reviews the returned batch. This document authorizes only the specified limited checker; it does not start implementation, a swarm, migration work, a provider interaction or a store. If the checker cannot fit these constraints, stop the batch and report BATCH-HOLD with the reason. Money path closed; no production, live-pilot or G1-G6 approval.
