BATCH-OK

Authorize only the T-ADAPTER-01 checkAdapterEvidence LIMITED PURE boolean-input fail-closed checker specified below. Full T-ADAPTER-01 remains HOLD. Money path closed. Never authorize ok: true, executeCommand, ledger posting, financial execution, persistence or real stores. T-CORE-02, T-FIN-01, T-LEDGER-02 and T-REWARD-01 remain HOLD; no implementation, scaffold or new checker for those tasks is authorized. No production, live pilot or G1-G6 closure is authorized.

Reviewed baseline: 3feb5def92f302da9eece2b46cd2608a8c6513cb on cursor/kita-identity01-check-binding-05a3. T-IDENTITY-01 checkIdentityBinding has landed as a refusal-only checker; full identity lifecycle remains HOLD. Rechecked TEST-IDENTITY-01: 32 passed. Together with TEST-QUOTE-01 and TEST-AUTH-01 through TEST-AUTH-07, 54 tests passed across nine files (exit 0). The four existing tests/providers/outcome-contract.spec.ts cases also passed (exit 0), using a temporary configuration because the default Kita Vitest include covers only tests/features. Strict isolated auth.ts checking passed (exit 0). These results establish neither provider/identity authority nor full-task completion.

Review basis: [13-backlog.md](../13-backlog.md) T-ADAPTER-01 requires common transport/evidence contracts, account namespaces, signature/replay controls and fail-closed outcomes. [08-providers.md](../08-providers.md#h2-canonical-port-contracts) H2/H5/H6 requires account/environment separation, authenticated evidence and certified outcome mappings. [07-algorithms.md](../07-algorithms.md#g7-webhooks-outbox-timers-and-retry) G7 requires account/environment allowlisting, signature/replay checks and quarantine for a repeated delivery identity with a changed payload. [06-api-contracts.md](../06-api-contracts.md#f6-provider-boundary-and-compatibility) F6 preserves the authenticated raw-body boundary and distinguishes receipt from financial processing. M2 supplies unauthorized / 403, stale_or_conflicting_command / 409 and dependency_unavailable / 503. The ordered errors below are a new internal supplied-blocker refusal contract only; they neither change public error mappings nor produce provider outcomes or callback acknowledgments.

T-ADAPTER-01 is the first preferred candidate and fits only this disconnected checker. Existing packages/providers/transport.ts submit/inquire always return Unknown; packages/providers/evidence.ts verifyWebhook always returns Quarantined. Preserve these functions, their callers and all canonical ports unchanged. A new type-only adapters.ts keeps this checker independent of ports.ts and its financial command-type imports. No transport, signature verifier, capability catalog, adapter activation or provider contract freeze is included.

Remaining-task disposition for this batch:

| Task | Disposition | Reason / work still withheld |
|---|---|---|
| T-SCOPE-01 | HOLD | Source hashes, original-spec crosswalk and accountable scope review require actual source evidence; no recovery or coverage claim is authorized. |
| T-CONTRACT-01 | HOLD | No freeze-only checker selected; full freeze requires reviewed wire/event/schema/port hashes, compatibility and ownership decisions. Do not import, call or extend freezeContracts. |
| T-CORE-01 | HOLD | Existing database tests do not prove complete runtime/transaction composition; pool, roles, retries and commit/rollback require real bindings outside this lane. |
| T-CORE-02 | HOLD | Explicitly prohibited; no command authority, atomic financial state/event/outbox/audit, holds, limits or fenced dispatch implementation. |
| T-LEDGER-02 | HOLD | Explicitly prohibited; no posting templates, period enforcement, balances or allocation-limit implementation. |
| T-IDENTITY-01 | HOLD; limited checker landed | The 32 supplied-blocker tests do not establish durable sessions, contacts, instruments, consents, token rotation/revocation or access grants. Do not expand the landed checker. |
| T-ADAPTER-01 | BATCH-OK for the checker below only; full task HOLD | Supplied blockers may produce refusals only. Real transport, evidence verification, namespaces, durable attempts and capability/certification evidence remain withheld. |
| T-REWARD-01 | HOLD | Explicitly prohibited; no points ledger, reservations, expiry/reversal caps or financial provision bridge. |
| T-MIG-01 | HOLD | Not selected after the preferred adapter slice fits; actual archive hashes/dispositions, import/build reachability and consented data handling remain unproved. Preserve the archive. |
| T-INTEGRATE-01 | HOLD | Connected features, exact artifacts, real-role/concurrency tests and independent financial reconstruction remain incomplete; no G1/G2 decision. |
| T-CERT-01 | HOLD | Account/method certification requires real sandbox transcripts, native-device evidence and review; no provider call or G3 closure. |
| T-LIVE-01 | HOLD | Live-pilot authority, reconciled positions, caps and approvals are outside this batch; no pilot, G4 entry or G5 exit. |
| T-GA-01 | HOLD | Signed exact-scope launch evidence and G1-G5 prerequisites remain open; no G6 decision or exposure change. |
| T-BASE-01 | HOLD | Not selected; archive/root isolation and GPU-to-VM bundle integrity require actual path/hash evidence. No handoff acceptance is granted. |
| T-RELEASE-01 | HOLD | Not selected; exact-candidate proof completeness, freshness and approver validation remain open. No gate closure or activation. |
| T-FIN-01 | HOLD | Explicitly prohibited; no journal, event replay/mismatch, financial permissions or independent-reconstruction implementation. |

Only the adapter checker below is selected. Other HOLD rows exclude those tasks from this batch; they do not assert that every non-money task is incapable of a future refusal-only slice. This document replaces the landed T-IDENTITY-01 next-batch authorization and does not expand any landed checker. All full-feature holds, CP gaps, dependency/activation gates and release gates remain open. Missing matching feature-test files are inventory observations, not proof of missing implementations or permission to close tasks.

Allowed implementation files only (paths relative to apps/kita/; all three are absent at the reviewed baseline):

- packages/contracts/src/adapters.ts — create only Adapter01Input, Adapter01Output and Adapter01CommandContext type declarations, with a type-only WorkerContext import from ./context.ts. No runtime declarations or imports.
- packages/providers/check-adapter-evidence.ts — create one standalone inert checkAdapterEvidence checker. Do not wrap or call submit, inquire, verifyWebhook, outcomeFromTransportFailure or any existing checker.
- tests/features/test-adapter-01.spec.ts — create focused TEST-ADAPTER-01 refusal tests only.

No other implementation file is allowed. Preserve ports.ts, transport.ts, evidence.ts, all existing contract modules, result.ts, index.ts, existing tests, generated clients, provider implementations, stores and configuration. This planning update edits only docs/kita-plan/addenda/NEXT-BATCH.md. The returned implementation diff is measured from the coordinator-recorded implementation base, which must include this plan and descend from the reviewed baseline; it may contain only the three implementation paths above. Record that exact base and returned head.

Exact required Adapter01Input flags (all required; no optional or additional data fields):

```ts
readonly providerAccountMismatch: boolean;
readonly providerEnvironmentMismatch: boolean;
readonly signatureMissingOrInvalid: boolean;
readonly evidenceReplayed: boolean;
readonly evidencePayloadMismatch: boolean;
```

Flag meanings are supplied blockers only:

- providerAccountMismatch: supplied evidence/request account namespace differs from its required provider-account scope. Accept no account identifier, provider reference or account lookup.
- providerEnvironmentMismatch: supplied evidence/request environment differs from its required environment scope. Accept no environment name, configuration, activation flag or environment lookup.
- signatureMissingOrInvalid: supplied missing, invalid or otherwise untrusted callback signature/authentication. Accept no signature, key, certificate, header, raw body or verification callback.
- evidenceReplayed: supplied replay of evidence that must not be applied again. Accept no delivery/event identity or deduplication lookup; do not classify benign duplicate deliveries.
- evidencePayloadMismatch: supplied conflicting payload for the same delivery/evidence identity. Accept no payload, digest or monetary fields and perform no comparison or hash calculation.

Do not derive or verify these flags, authenticate evidence, detect replay, inspect an environment or consult another checker. False flags prove none of those controls and never grant provider availability, authenticated/verified evidence, callback acceptance, dispatch eligibility, retry authority or financial authority. This checker cannot validate the existing outcome union, signed contract, capability worksheet or any certification fixture.

Define Adapter01Output = never. Define Adapter01CommandContext as Pick<WorkerContext, 'workId' | 'attemptGeneration'>. The exact signature is checkAdapterEvidence(ctx: Adapter01CommandContext, input: Adapter01Input): Promise<Result<Adapter01Output, Problem>>. Both context fields are unused metadata and establish no actor, account, environment, book, command or dispatch authority. Do not accept CommandContext, ReadContext, full WorkerContext, transaction runners, trace/capability/execution callbacks, dependencies or extra context fields.

The checker uses type-only imports for Adapter01 types from ../contracts/src/adapters.ts and Problem/Result from ../contracts/src/result.ts. Its only runtime import is the existing err/problem helpers from ../contracts/src/result.ts. Never import a runtime barrel, ports.ts, auth.ts runtime, freezeContracts, unavailable or ok helpers, node:crypto, transport/evidence functions, money utilities, platform, provider implementations or stores. Add no dependency, runtime schema or package/barrel export. Test imports may use vitest, the new checker and direct contract type paths (including UUID from context.ts); no contracts or provider barrel.

Required behavior in this exact order; the first true blocker wins regardless of every lower-priority flag:

| Condition | Exact error code | HTTP status | retryable | Fixed detail |
|---|---|---|---|---|
| providerAccountMismatch === true | unauthorized | 403 | false | T-ADAPTER-01 supplied provider account mismatch blocks adapter evidence |
| Otherwise providerEnvironmentMismatch === true | unauthorized | 403 | false | T-ADAPTER-01 supplied provider environment mismatch blocks adapter evidence |
| Otherwise signatureMissingOrInvalid === true | unauthorized | 403 | false | T-ADAPTER-01 supplied missing or invalid signature blocks adapter evidence |
| Otherwise evidenceReplayed === true | stale_or_conflicting_command | 409 | false | T-ADAPTER-01 supplied replayed evidence blocks adapter evidence |
| Otherwise evidencePayloadMismatch === true | stale_or_conflicting_command | 409 | false | T-ADAPTER-01 supplied evidence payload mismatch blocks adapter evidence |
| Otherwise (all five flags false) | dependency_unavailable | 503 | true | T-ADAPTER-01 checkAdapterEvidence cannot verify provider evidence or authorize transport: provider contracts and T-CORE-02 remain HOLD (fail closed) |

Return only failures with exactly { ok: false, error: { code, status, retryable, detail } }. Use the bounded, non-PII detail strings above verbatim. No extra branch, code, value, kind, operationId, fieldErrors, evidence/reference, permission, authority or other result field is permitted. All flags false still refuses with 503. retryable: true authorizes no automatic retry, inquiry, scheduling, callback, command execution or provider request. Return no Confirmed, Pending, Rejected, Unknown, Unsupported, Verified, Duplicate, Quarantined or Hint verdict; existing transport/evidence functions alone retain their existing behavior. Never claim a signature, namespace or evidence was validated, a replay detected, a webhook received/acknowledged/quarantined, an instruction accepted/rejected or any provider/financial state changed.

No persistence or store/database access, including real, test or in-memory substitute stores. No money arithmetic, ledger/points path, executeCommand, posting, holds, approval, balance mutation, reservation, transfer/operation creation or financial outcome. No provider/network/credential call, HTTP response/acknowledgment, transport attempt, inquiry, signature/MAC/mTLS verification, key lookup/rotation, hashing, encryption, policy/capability resolution, cache, queue/outbox/timer, trace/log/audit emission or state transition. No clock, randomness, filesystem, environment read, archive scan, path/hash validation or release-evidence evaluation in the checker. Accept no raw body, signature/header, certificate/key, token, URL, account/environment/provider name, delivery/event identity, payload/digest, command key/hash, policy, approval, amount, currency or financial data. The two unused context metadata fields are the only identifiers accepted.

Do not wire the checker into API/controller/worker/UI routes, provider ports, transport, webhook ingress, capability startup checks or any money workflow. No changes to runbooks, infrastructure, CI, packages/configuration/dependencies, frozen OpenAPI/events/SQL, migrations, grants, source archives or migration manifests. No deployment, production activation, publication, live pilot, GitHub merge or G1-G6 closure. T-CORE-02/T-FIN-01/T-LEDGER-02/T-REWARD-01 implementation remains prohibited.

TEST-ADAPTER-01 must cover all 32 boolean combinations in an explicit independently specified expected-results table. Expected code/status/retryable/detail must be literal expectations, not computed by copying the checker's if-chain or imported implementation constants. Include all 16 account-mismatch combinations, all eight remaining environment-mismatch combinations, all four remaining signature-blocker combinations, both remaining replay combinations, the sole remaining payload-mismatch combination and the all-false fallback. Assert the complete exact error-only result for every case, absence of value/kind/extra success/evidence/authority fields and identical refusal on a repeated call. Object.freeze each input and context, capture their values before calling and verify both remain unchanged. Use no mocked store, fake provider/evidence/signature, transport/verification workflow, clock or randomness. Preserve all existing provider tests without edits.

These tests establish only supplied-blocker precedence, deterministic refusal and input/context non-mutation. They do not satisfy full T-ADAPTER-01, H5 certification, PACK-PROVIDER, PACK-API, PACK-SECURITY, REQ-SC-02/03/17/21, actual account/environment/signature/replay enforcement, durable request/attempt/evidence handling, connected feature acceptance or G1-G6. Naming the file TEST-ADAPTER-01 does not close that task or any dependency.

Validation required on the returned implementation head (run from apps/kita/):

```sh
./node_modules/.bin/vitest run tests/features/test-adapter-01.spec.ts tests/features/test-identity-01.spec.ts tests/features/test-quote-01.spec.ts tests/features/test-auth-01.spec.ts tests/features/test-auth-02.spec.ts tests/features/test-auth-03.spec.ts tests/features/test-auth-04.spec.ts tests/features/test-auth-05.spec.ts tests/features/test-auth-06.spec.ts tests/features/test-auth-07.spec.ts
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --noUncheckedIndexedAccess --exactOptionalPropertyTypes packages/contracts/src/adapters.ts
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --noUncheckedIndexedAccess --exactOptionalPropertyTypes packages/providers/check-adapter-evidence.ts
./node_modules/.bin/tsc --noEmit --project packages/contracts/tsconfig.json
./node_modules/.bin/tsc --noEmit --project packages/contracts/tsconfig.json --allowImportingTsExtensions
```

Rerun the existing provider suite with the following temporary configuration. The default Kita config excludes tests/providers, so merely passing that file to the default config does not establish a provider test result. This validation harness writes only under /tmp, pins the root to the current Kita slice and removes the temporary config afterward; it is not an implementation file or permission to change tracked configuration.

```sh
python3 - <<'PY'
from pathlib import Path
import json
import subprocess
import tempfile

root = Path.cwd().resolve()
with tempfile.TemporaryDirectory(prefix='kita-adapter01-review-', dir='/tmp') as temp:
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

At the reviewed SHA, the unmodified contracts package check fails (exit 2) with 15 diagnostics. With explicit --allowImportingTsExtensions it fails (exit 2) with the same five registry diagnostics below. These are existing failing gates, not waived or passed checks:

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

The new Adapter01 types, checker and TEST-ADAPTER-01 do not yet exist and have not been tested. Require all 32 new refusal cases and all 54 reviewed identity/quote/AUTH cases to pass (86 feature cases across ten files), the four existing provider cases to pass separately, and both new strict isolated checks to pass without diagnostics. Rerun and report both full contracts package checks separately with actual exit statuses and complete diagnostics. Preserve the exact existing diagnostic identities and locations because all existing files are outside the allowlist. Do not suppress diagnostics, change configuration, fix unrelated files or treat existing package failures as closed. Any new diagnostic, changed existing failure, failed/missing test, need for evidence/store/transport access or scope expansion returns to Sol as BATCH-HOLD.

Inspect the complete final diff and imports for effects, success/evidence/authority paths and changes outside the three allowed implementation paths. Return the coordinator-recorded implementation base, exact implementation head, changed-file list, full diff and complete test/type-check outcomes for Codex Sol max review. No full task, connected feature or gate closes merely because refusal tests pass.

Implementation follows the established roles: Qoder CLI Efficient Agent Teams/subagents on gpu-fqaf implement the authorized checker; coordinator handles sync/bundles/GitHub; Codex Sol max reviews the returned batch. This document authorizes only the specified limited checker; it does not start implementation, a swarm, a provider interaction or a store. If it cannot fit these constraints, stop the batch and report BATCH-HOLD with the reason. Money path closed; no production, live-pilot or G1-G6 approval.
