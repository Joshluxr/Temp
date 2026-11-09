# M. Dependency-ordered implementation backlog

Planning baseline: 2026-11-09. This is future engineering work; no application code is implemented by this package. Preserve [the 142-file migration decisions](03-migration-map.md), [104 feature IDs](02-traceability-matrix.md), [money policy](05-data-ledger.md), [API contract](06-api-contracts.md) and [release gates](12-tests-gates.md). All estimates below are engineering person-days including implementation, meaningful tests and review fixes, excluding procurement, legal approval, provider waiting time and pilot observation. They are planning estimates, not elapsed-time commitments.

## M1. Ownership and parallel delivery

**Integration owner: principal full-stack architect**, with financial-systems responsibility. This is one accountable person, not a rotating team role. The owner freezes and arbitrates schemas, command/event envelopes, provider ports, posting templates, lock order, error semantics, client DTOs and observability. Finance/controller owns economic treatment; Compliance/counsel owns legal applicability. They approve domain policy without authoring arbitrary production balance changes.

Execution roles follow the operator instructions: Astra/xhigh plans; Sol/max directs and independently reviews; Qoder Efficient Agent Teams/subagents on GPU `gpu-fqaf` implement the approved batches; Cursor Grok coordinates sync/bundles/GitHub. This document schedules that future work; it does not start a coding swarm or authorize a deployment. Every code task below is assigned to the named specialist within that Qoder team, with Sol review and architect integration. Business sign-off tasks name their actual accountable human role.

**Contract freeze first:** T-SCOPE-01 → T-BASE-01 → T-CONTRACT-01 → T-PLAT-01 → T-CORE-01 → T-PLAT-02 → T-CORE-02. Freeze the in-scope API/event/schema/adapter version and lock ordering before streams diverge. DEP-00 prevents a full-original-spec freeze; an explicitly recorded supplied-scope baseline may support bounded engineering, with additions re-reviewed on receipt. Missing schema/API details listed in COMPLETENESS-PASS must receive concrete frozen addenda before their dependent implementation starts. No worker makes a private contract fork.

| Stream | Accountable specialist / integration handoff | Tasks and safe parallelism after prerequisites |
|---|---|---|
| S0 contracts/platform | Architect + platform engineer | Foundations, PLAT, MIG; releases shared DTOs, migration ranges, runtime roles and CI evidence first. |
| S1 identity/security/compliance | Identity/security engineer + Compliance | AUTH, KYC, ADM access/review; emits scoped identity, current holds and verified evidence. |
| S2 ledger/treasury/finance | Financial-systems engineer + Controller | LEDGER, FIN, WAL; owns journal templates, period locks, balances, liquidity and independent reconciliation. |
| S3 quotes/transfers/providers | Payments engineer + Integrations | REC, QUOTE, TX, FUND, PAY, ADAPTER; depends on S1 eligibility and S2 posting/reservation contracts. |
| S4 customer/mobile/design | Full-stack/Expo engineer + Product | PUB and customer surfaces across feature tasks; may port pure UI against frozen contracts while domains build; connected acceptance still required. |
| S5 operations/admin | Admin full-stack engineer + Ops | ADM queues/configuration/evidence and support; uses the same commands/reducers as customer/provider paths. |
| S6 growth/extended products | Growth/payments engineer + Product | REWARD, GROW, EXT, schedules/bills; full disabled behavior and tests, separate activation gates. |
| S7 verification/release | QA/SRE/security engineer + Finance | INTEGRATE, CERT, LIVE, GA; builds independent oracles early; gate execution follows dependencies. |

Assign file ownership before each batch. Shared contracts and SQL changes are serialized by the architect; domain streams create separate modules/migrations. The coordinator syncs the frozen manifest to GPU using the operator workflow, retrieves a hash-addressed bundle and test evidence, and gives Sol the exact bundle/head. Failed review becomes a Qoder fix batch. Re-run impacted gates on the final integrated head; passing an earlier branch is insufficient. No task can close solely on a screen mock or mocked happy-path test.

## M2. Contract notation and task-wide requirements

Paths are relative to the future application repository described in A/C; they are **not instructions to edit the archive or this plan's protected SQL/OpenAPI now**. `Create` means add if absent in the target. `Change` means extend the foundation-created file; tasks sharing one controller/client route integrate sequentially. `Remove: none` is explicit; all archive exclusions are consolidated in T-MIG-01.

`CommandContext` carries validated actor/person, book, assurance, command key/hash, correlation and a transaction runner; `ReadContext` carries scoped identity/as-of; `WorkerContext` carries durable work identity, attempt generation and trace. None accepts a client-selected role or arbitrary ledger account. `Result<T>` is success or the F2 problem (`code,status,retryable,operationId?,fieldErrors?`). Per-task input/output type names below denote proposed internal contracts; their fields and semantics are specified in that task's I/O and the corresponding OpenAPI operation. T-CONTRACT-01 freezes concrete TypeScript/runtime schemas; internal signatures never replace the public wire schema without review.

All commands inherit F1 authentication/ownership/CSRF, durable idempotency, expected-version checks, strict integer money and input limits. Errors common to all applicable operations: invalid request400, unauthenticated401, unauthorized403 or scoped404, stale/conflicting command409, throttle429 and explicit capability/dependency503. Additional errors below map to stable public problem codes without leaking confidential details. Provider unknown is a durable outcome, not a fresh-key retry instruction. Read handlers never call money-mutating functions; worker reducers require authenticated evidence. No network call inside a locked DB transaction.

**Observability for every task:** bounded metric labels (book class/corridor/provider/method/result, no customer-ID label), request→command→event→attempt→journal correlation, redacted failure reason, and I6 audit fields for sensitive reads/changes. Each task adds its named metric and an actionable owner/runbook. **Evidence EV(task):** exact SHA/digest/contracts/policies, changed file list, tests and seeds, relevant DB/ledger/provider/UI/audit assertions, dependency status, review findings/disposition and Sol approval. A feature without evidence stays open.

Rollback policies referenced explicitly by each task: **RB-VIEW** restores a compatible UI/read release and clears scoped caches, preserving operations/consents/history; **RB-CONTROL** disables new capability/configuration, retains old-version reads and services existing obligations, with an approved forward policy version; **RB-MONEY** pauses new exposure, retains all attempts/keys/holds/obligations, drains safe work, inquires/reconciles and corrects through approved journals; no DB rewind after an external instruction; **RB-PLATFORM** promotes the prior compatible artifact or isolated recovery only after independent writer fencing and reconciliation. Never delete evidence to make rollback appear clean.

## M3. Shared foundation, integration and release tasks

### T-SCOPE-01 — Establish the available-source baseline and recover the original-spec crosswalk

* **Objective / role / estimate:** Establish the available-source baseline and recover the original-spec crosswalk. Architect + Product/coordinator; 2 person-days.
* **Deps:** none.
* **Files — create:** docs/requirements/source-manifest.json; docs/requirements/original-crosswalk.md. **Change:** docs/requirements/scope.md. **Remove:** none.
* **Function signatures:** `reconcileScope(sources: SourceManifest, requirements: Requirement[]): CoverageReport`.
* **I/O/errors:** Hash supplied sources and map original IDs to stable KITA IDs; output explicit covered/gap/conflict rows. Missing original spec returns incomplete, never fabricated coverage.
* **DB:** No financial DB mutation; preserve source hashes and review record.
* **Tests:** Compare matrix/feature/test/task sets and all required scenarios; test duplicate/unmapped requirements.
* **Observability:** scope_gap_count by severity; shared M2 audit/trace requirements.
* **Rollback:** RB-VIEW.
* **Evidence:** EV(T-SCOPE-01), DEP-00/13 evidence and Product/Sol scope review.

### T-CONTRACT-01 — Freeze shared schema, API, events, provider ports, errors, money rules and lock order before parallel coding

* **Objective / role / estimate:** Freeze shared schema, API, events, provider ports, errors, money rules and lock order before parallel coding. Principal full-stack architect; 5 person-days.
* **Deps:** T-SCOPE-01, T-BASE-01.
* **Files — create:** packages/contracts/src/commands.ts; packages/contracts/src/events.ts; packages/providers/ports.ts; docs/architecture/contract-freeze.md; docs/architecture/gap-addenda.md. **Change:** packages/contracts/openapi/kita-v1.yaml. **Remove:** none.
* **Function signatures:** `freezeContracts(input: ContractCandidate): Result<ContractManifest>`.
* **I/O/errors:** Input versioned wire/event/DB/port definitions and gap addenda; output signed hashes and compatibility matrix. Reject conflicting ownership, untyped money, unsafe outcome mapping or unresolved scope claims.
* **DB:** Specify migration ownership, transaction boundaries, cross-book FKs and common lock order; close CP gap contracts before dependent work.
* **Tests:** OpenAPI lint/generation/drift, event-version fixtures, error mappings, source coverage and dependency-DAG check.
* **Observability:** contract_drift_count; rejected_contract_changes; shared M2 audit/trace requirements.
* **Rollback:** RB-CONTROL.
* **Evidence:** EV(T-CONTRACT-01), architect freeze manifest plus Finance/Security review.

### T-CORE-01 — Establish target transaction, runtime configuration and API composition boundaries

* **Objective / role / estimate:** Establish target transaction, runtime configuration and API composition boundaries. Platform/backend engineer; 4 person-days.
* **Deps:** T-PLAT-01.
* **Files — create:** packages/database/pool.ts; packages/database/transaction.ts; packages/config/runtime.ts; apps/api/src/main.ts; apps/api/src/app.module.ts; apps/api/src/auth/request-context.ts. **Change:** packages/contracts/src/problem.ts. **Remove:** none.
* **Function signatures:** `withSerializable<T>(ctx: CommandContext, work: (tx: Tx) => Promise<T>): Promise<Result<T>>; validateEnvironment(env: RuntimeEnv): Result<Bindings>`.
* **I/O/errors:** Validated entity/identity and same-key transaction callback → committed result; bounded retries on40001/40P01, exhaustion conflict; missing/unsafe bindings fail startup.
* **DB:** Use least-privilege roles, SET LOCAL context, ordered locks and no network in transaction; database version installed by T-PLAT-02.
* **Tests:** Pool isolation, rollback/commit faults, retry exhaustion, environment fail-closed and server/client import boundary.
* **Observability:** transaction_retry_total; pool_wait_seconds; startup_binding_failure; shared M2 audit/trace requirements.
* **Rollback:** RB-PLATFORM.
* **Evidence:** EV(T-CORE-01), pool/runtime/role review.

### T-CORE-02 — Implement durable commands, operations, subject holds, limit buckets and non-transfer financial work identities

* **Objective / role / estimate:** Implement durable commands, operations, subject holds, limit buckets and non-transfer financial work identities. Financial backend engineer; 8 person-days.
* **Deps:** T-PLAT-02.
* **Files — create:** packages/database/migrations/002_command_authority.sql; packages/domain/transfers/command-authority.ts; packages/domain/compliance/subject-holds.ts; packages/domain/treasury/limit-buckets.ts; apps/api/src/customer/operations.controller.ts. **Change:** packages/contracts/src/commands.ts. **Remove:** none.
* **Function signatures:** `executeCommand<T>(ctx: CommandContext, command: TypedCommand<T>): Promise<Result<T>>; authorizeDispatch(ctx: WorkerContext, attemptId: UUID): Promise<Result<DispatchPermit>>`.
* **I/O/errors:** Immutable canonical payload and scoped work identity → original/new durable operation and fenced permit. Conflict on key/body, quote reuse, hold, stale authority, limit or unknown prior attempt.
* **DB:** Complete commands over existing money_operations, limit_buckets/reservations and operation-linked attempts/refunds/liquidity. Add subject-scoped holds where absent; prove book/customer/parent ownership rather than inventing a transfer. Add economic-movement identity, customer safety locks and runtime command functions; atomic command/state/event/outbox/audit.
* **Tests:** REQ-SC-01–05,15,17,20; wallet-only/treasury-only parents, nested ownership, crash atomicity and actual-role permission tests.
* **Observability:** command_conflict_total; dispatch_denial_total; unresolved_authority_age; shared M2 audit/trace requirements.
* **Rollback:** RB-MONEY.
* **Evidence:** EV(T-CORE-02), CP-02/03/05 migration and concurrency proofs.

### T-LEDGER-02 — Complete typed posting authority, period enforcement, evidence templates and correction allocation

* **Objective / role / estimate:** Complete typed posting authority, period enforcement, evidence templates and correction allocation. Ledger engineer + Controller; 8 person-days.
* **Deps:** T-CORE-02.
* **Files — create:** packages/domain/ledger/templates.ts; packages/domain/ledger/periods.ts; packages/database/migrations/003_posting_policy.sql. **Change:** packages/domain/ledger/post-business-event.ts. **Remove:** none.
* **Function signatures:** `postBusinessEvent(ctx: CommandContext, event: VerifiedEconomicEvent): Promise<Result<JournalRef>>; closePeriod(ctx: CommandContext, input: PeriodClose): Promise<Result<CloseProof>>`.
* **I/O/errors:** Verified evidence + approved template/policy → immutable journal and exact balances; reject wrong book/evidence, unbalanced/empty lines, over-allocation, nonnegative breach or closed period. Include signed short/excess-funding mappings.
* **DB:** Use existing accounting_periods and posting-period guard; complete nonoverlap/close commands, active template/evidence permission mapping, allocation and account-policy controls; event-key serialization; no runtime direct write or arbitrary-line client API. Keep independent reconstruction oracle.
* **Tests:** E4–E11 journal fixtures, PACK-MONEY/FINANCE, reversal/partial cap, bank net-fees/reserve, short/excess and recovery templates.
* **Observability:** posting_rejection_total; balance_drift; closed_period_write_attempt; shared M2 audit/trace requirements.
* **Rollback:** RB-MONEY.
* **Evidence:** EV(T-LEDGER-02), Controller-approved templates/trial balances and CP-04 closure.

### T-IDENTITY-01 — Add durable sessions, contacts, instruments, consent and evidence-access support records

* **Objective / role / estimate:** Add durable sessions, contacts, instruments, consent and evidence-access support records. Identity/security engineer; 6 person-days.
* **Deps:** T-CORE-02.
* **Files — create:** packages/database/migrations/004_identity_access.sql; packages/domain/identity/session-store.ts; packages/domain/funding/instruments.ts; packages/domain/compliance/document-access.ts. **Change:** packages/contracts/src/auth.ts. **Remove:** none.
* **Function signatures:** `bindSession(ctx: CommandContext, input: OidcEvidence): Promise<Result<Session>>; registerInstrument(ctx: CommandContext, input: HostedInstrumentEvidence): Promise<Result<InstrumentRef>>`.
* **I/O/errors:** Verified IdP/provider evidence, contact challenges and mandate hashes → scoped session/instrument/document grants; reject replay, expired challenge, wrong ownership, reused refresh token or unsafe return URI.
* **DB:** Complete commands over existing auth_sessions, contact_verifications, funding_instruments, mandates/revocations and notification_preferences; extend device/identity-session binding and scan/access records where absent; prove HMAC lookup/encryption and ownership; no raw PAN/CVV.
* **Tests:** PACK-IDENTITY/API/SECURITY; REQ-SC-14/15; replay/expiry/rotation/closure and provider token binding.
* **Observability:** refresh_reuse_total; contact_challenge_reject; instrument_binding_failure; shared M2 audit/trace requirements.
* **Rollback:** RB-CONTROL.
* **Evidence:** EV(T-IDENTITY-01), CP-01/06 schema and ownership proofs.

### T-ADAPTER-01 — Implement common provider transport and evidence verification contracts

* **Objective / role / estimate:** Implement common provider transport and evidence verification contracts. Provider integrations engineer; 5 person-days.
* **Deps:** T-CORE-02.
* **Files — create:** packages/providers/transport.ts; packages/providers/evidence.ts; packages/providers/capabilities.ts; tests/providers/outcome-contract.spec.ts. **Change:** packages/providers/ports.ts. **Remove:** none.
* **Function signatures:** `submit(request: ImmutableProviderRequest): Promise<ProviderOutcome>; inquire(reference: ProviderReference): Promise<ProviderOutcome>; verifyWebhook(raw: Uint8Array, headers: Headers): VerificationResult`.
* **I/O/errors:** Frozen H2 ports → Confirmed/Pending/Rejected/Unknown/Unsupported with evidence and original reference; transport failure is Unknown; no guessed definitive rejection or unsigned success.
* **DB:** Persist provider account/environment/contract, immutable request/evidence hash and separate transport attempts; inquiries retain work identity; adapter cannot choose accounting.
* **Tests:** H5 contract catalog, REQ-SC-02/03/17/21, raw-body signature/rotation/rate-limit and account namespace tests.
* **Observability:** provider_unknown_age; contract_mapping_reject; provider_latency; shared M2 audit/trace requirements.
* **Rollback:** RB-MONEY.
* **Evidence:** EV(T-ADAPTER-01), sanitized contract fixtures and capability worksheet.

### T-REWARD-01 — Add constrained points ledger, reservations and financial provision bridge

* **Objective / role / estimate:** Add constrained points ledger, reservations and financial provision bridge. Rewards/ledger engineer + Finance; 5 person-days.
* **Deps:** T-LEDGER-02.
* **Files — create:** packages/database/migrations/005_points_posting.sql; packages/domain/rewards/post-points.ts. **Change:** packages/domain/ledger/templates.ts. **Remove:** none.
* **Function signatures:** `postPoints(ctx: CommandContext, event: PointMovement): Promise<Result<PointReceipt>>`.
* **I/O/errors:** Customer/program paired noncash units + source/rule/lot → immutable point event and approved provision effect; reject overspend, negative availability, invalid reversal or same key changed units.
* **DB:** Constrained paired points posting, explicit reservations/remaining units and cumulative reversal limits; cash templates cannot receive point units.
* **Tests:** REQ-SC-18, P1 earn/vest/redeem/release/expiry/debt, duplicate callback and exact provision reconciliation.
* **Observability:** points_conservation_failure; reward_provision_difference; shared M2 audit/trace requirements.
* **Rollback:** RB-CONTROL.
* **Evidence:** EV(T-REWARD-01), CP-07 closure and Finance P1 review.

### T-MIG-01 — Apply and account for every source-file migration decision; eliminate prototype authority

* **Objective / role / estimate:** Apply and account for every source-file migration decision; eliminate prototype authority. Migration/platform engineer; 6 person-days.
* **Deps:** T-CONTRACT-01, T-PLAT-01.
* **Files — create:** docs/migration/disposition-manifest.json; docs/sandbox-history.md; scripts/check-migration-inventory.ts. **Change:** target paths for all142 rows of03-migration-map.md; .dockerignore; .gitignore; CREDITS.md; README.md. **Remove:** target copies of api/kimi/*, api/lib/vite.ts, src/main.tsx, src/App.css, src/providers/trpc.tsx, drizzle.config.ts, vite.config.ts, MySQL metadata and generator-only files enumerated in C; never delete supplied archive.
* **Function signatures:** `verifyMigration(inventory: SourceInventory, dispositions: Disposition[]): MigrationReport`.
* **I/O/errors:** Source hashes + one disposition per physical file → complete report; duplicate/missing paths, Kimi/MySQL runtime import or simulator reachability fail. New production book starts from real signed opening evidence.
* **DB:** No sandbox balances/IDs/provider refs/KYC approvals imported. Any lawful identity import needs consent, source→target map and reverification; preserve history read-only.
* **Tests:** 142-row hash/coverage comparison, build/import scans, REQ-SC-21 and real opening-balance rehearsal.
* **Observability:** migration_unmapped_files; prohibited_runtime_reference_count; shared M2 audit/trace requirements.
* **Rollback:** RB-PLATFORM.
* **Evidence:** EV(T-MIG-01), complete disposition manifest and visual/license review.

### T-DEPEND-01 — Collect and enforce all external enablement evidence

* **Objective / role / estimate:** Collect and enforce all external enablement evidence. Architect + accountable owners in N; 5 person-days.
* **Deps:** T-SCOPE-01, T-CONTRACT-01.
* **Files — create:** docs/activation/claim-register.json; docs/activation/capability-evidence.md; packages/domain/catalog/activation-policy.ts. **Change:** docs/runbooks/provider-renewal.md. **Remove:** none.
* **Function signatures:** `evaluateActivation(scope: CapabilityScope, evidence: ClaimEvidence[], now: Instant): ActivationDecision`.
* **I/O/errors:** DEP-00–15 applicability, owner/counsel/Finance signatures, contract expiry and environment → enabled/disabled with reasons. Missing evidence never defaults to approval.
* **DB:** Versioned policies/capabilities/provider-account evidence references; expired critical claims disable new exposure while servicing obligations.
* **Tests:** Missing/expired/rejected/wrong-entity evidence matrix, country/state/product negative cases, flag outage and CP-09/11 evidence gates.
* **Observability:** activation_denied_total; evidence_expiry_days; shared M2 audit/trace requirements.
* **Rollback:** RB-CONTROL.
* **Evidence:** EV(T-DEPEND-01), named owner and review date for every DEP row; no fabricated approvals.

### T-INTEGRATE-01 — Wire and verify every feature, API operation, UI, worker and operating procedure on one candidate

* **Objective / role / estimate:** Wire and verify every feature, API operation, UI, worker and operating procedure on one candidate. Principal full-stack architect + QA; 10 person-days.
* **Deps:** all104 feature tasks; T-MIG-01; T-DEPEND-01.
* **Files — create:** tests/e2e/full-lifecycle.spec.ts; tests/concurrency/financial-races.spec.ts; tests/release/coverage.spec.ts; evidence/releases/manifest.schema.json. **Change:** all integration bindings and runbooks referenced by feature tasks. **Remove:** none.
* **Function signatures:** `verifyIntegration(candidate: ReleaseCandidate, scope: ReleaseScope): GateReport`.
* **I/O/errors:** Exact artifact + feature/operation/scenario map → G1/G2 decision and evidence manifest; missing implementation, skipped scenario, stale head or unexplained financial break fails.
* **DB:** Fresh install/upgrade plus real-role concurrency, ledger reconstruction and forward recovery; no production calls.
* **Tests:** All TEST-* and REQ-SC-01–21, L3 packs, API supplemental operations, physical-device journeys and independent financial oracle.
* **Observability:** unwired_feature_count; required_test_failure; gate_evidence_missing; shared M2 audit/trace requirements.
* **Rollback:** RB-PLATFORM.
* **Evidence:** EV(T-INTEGRATE-01), G1/G2 signed report; scoped pilot slice explicitly lists excluded disabled features.

### T-CERT-01 — Certify selected provider/account/method paths and native SDKs in sandbox

* **Objective / role / estimate:** Certify selected provider/account/method paths and native SDKs in sandbox. Integrations lead + QA + Finance; 10 person-days.
* **Deps:** T-INTEGRATE-01; applicable DEP-03/04/05/09/12/14.
* **Files — create:** docs/certification/provider-outcome-maps.md; evidence/certification/manifest.json. **Change:** packages/providers/*/contracts/; docs/runbooks/unknown-outcome.md. **Remove:** none.
* **Function signatures:** `certifyProvider(input: CertificationScope, evidence: ProviderRun[]): CertificationDecision`.
* **I/O/errors:** Provider versions, real sandbox transcripts/statements and SDK/device runs → scope-specific G3; unsupported cases explicitly limited, not marked passed.
* **DB:** Sandbox only; validate evidence/state/journal/report correspondence for each supported outcome.
* **Tests:** H5/L3 provider pack, REQ-SC-03/12/13/17, independent three-way reconciliation and negative capability tests.
* **Observability:** uncertified_capability_count; outcome_mapping_gap; shared M2 audit/trace requirements.
* **Rollback:** RB-CONTROL.
* **Evidence:** EV(T-CERT-01), provider acknowledgment and Finance-reviewed sandbox positions.

### T-LIVE-01 — Prepare, execute when explicitly authorized, and reconcile the limited live pilot

* **Objective / role / estimate:** Prepare, execute when explicitly authorized, and reconcile the limited live pilot. Business owner + Controller + Ops + architect; 8 person-days.
* **Deps:** T-CERT-01; applicable DEP-01–09/12/14 and signed L9 pilot authorization.
* **Files — create:** docs/activation/pilot-manifest.md; docs/finance/pilot-close.md; evidence/pilot/movement-index.json. **Change:** docs/runbooks/pilot-stop.md. **Remove:** none.
* **Function signatures:** `evaluatePilot(scope: SignedPilotScope, movements: ReconciledMovement[]): PilotGateReport`.
* **I/O/errors:** Explicit cohort/caps/dates, approvals and real positions → G4 entry/G5 exit report; absent caps, unknown payout, overdue remedy or unexplained break blocks. Engineering estimate excludes observation time.
* **DB:** Real immutable ledger and cases only after authorization; reconcile all movements, fees/reserves and late-return exposure; no synthetic opening balance.
* **Tests:** Controlled authorized low-value journeys, stop drill, support/receipt/refund verification and daily close; destructive races remain sandbox tests.
* **Observability:** pilot_exposure_remaining; unreconciled_movement_count; overdue_remedy_count; shared M2 audit/trace requirements.
* **Rollback:** RB-MONEY.
* **Evidence:** EV(T-LIVE-01), G4/G5 approvals, bank/provider/ledger proof and residual-risk reserve review.

### T-GA-01 — Assemble launch decision and staged exposure plan for the approved scope

* **Objective / role / estimate:** Assemble launch decision and staged exposure plan for the approved scope. Business owner + architect + Finance/Compliance/Security; 3 person-days.
* **Deps:** T-LIVE-01; T-DEPEND-01; current G1–G5 evidence.
* **Files — create:** docs/activation/ga-decision.md; docs/operations/service-roster.md. **Change:** docs/operations/slos.md; docs/runbooks/incident-response.md. **Remove:** none.
* **Function signatures:** `evaluateGa(scope: ReleaseScope, gates: GateEvidence[]): LaunchDecision`.
* **I/O/errors:** Exact candidate/scope, reconciled pilot and staffing/capital/security/legal evidence → signed G6 decision or explicit blockers. New product/country cannot inherit unrelated certification.
* **DB:** Approved capability versions/caps only; preserve existing obligations during disable or rollback.
* **Tests:** L9 gate completeness, exact-head artifact checks, on-call/incident/restore readiness and staged-cap negative tests.
* **Observability:** scope_gate_invalid; evidence_expiry; service_slo_burn; shared M2 audit/trace requirements.
* **Rollback:** RB-MONEY.
* **Evidence:** EV(T-GA-01), signed launch scope and monitored exposure checkpoints.

### T-BASE-01 — Verify isolated target workspace and reproducible handoff boundary

* **Objective / role / estimate:** Verify isolated target workspace and reproducible handoff boundary. Platform engineer + coordinator; 2 person-days.
* **Deps:** T-SCOPE-01.
* **Files — create:** tools/verify-workspace-boundary.ts; docs/architecture/workspace-boundary.md. **Change:** docs/requirements/source-manifest.json. **Remove:** none.
* **Function signatures:** `verifyWorkspaceBoundary(input: WorkspaceManifest): BoundaryReport`.
* **I/O/errors:** Source archive, target root and batch/base hashes → allowed file set and handoff manifest; reject target overlap with read-only source or unrelated root application.
* **DB:** No financial DB mutation; source hashes and target environment identity recorded.
* **Tests:** Archive/path traversal protection and hash-addressed GPU→VM bundle validation.
* **Observability:** workspace_boundary_failure; shared M2 audit/trace requirements.
* **Rollback:** RB-VIEW.
* **Evidence:** EV(T-BASE-01), target boundary and coordinator bundle proof.

### T-RELEASE-01 — Assemble exact-candidate release evidence and invalidate stale gate results

* **Objective / role / estimate:** Assemble exact-candidate release evidence and invalidate stale gate results. Release engineer + Sol + architect; 3 person-days.
* **Deps:** T-INTEGRATE-01, T-CERT-01.
* **Files — create:** tools/assemble-release-evidence.ts; tools/run-kita-gates.ts; docs/runbooks/kita-launch.md. **Change:** evidence/releases/manifest.schema.json. **Remove:** none.
* **Function signatures:** `assembleReleaseEvidence(candidate: ReleaseCandidate, proofs: GateEvidence[]): ReleaseEvidenceBundle`.
* **I/O/errors:** Exact source/artifact/contracts and scoped proof set → G1–G6 pending/passed/blocked manifest; reject missing or stale results and never infer live authorization from internal tests.
* **DB:** Read-only gate evidence; runtime capabilities change only through separately approved activation command.
* **Tests:** Manifest completeness, hashes, candidate drift, missing approver/caps and changed-provider invalidation.
* **Observability:** stale_gate_evidence_count; shared M2 audit/trace requirements.
* **Rollback:** RB-CONTROL.
* **Evidence:** EV(T-RELEASE-01), signed exact-candidate evidence bundle.

## M4. Feature tasks

All104 IDs remain explicit, including products disabled for initial launch. Group order is for reading; execute the dependency graph. Estimates are additive per task; shared foundations are not re-estimated in feature work.

### T-PUB-01 — Kita public site and legal identity

* **Objective:** deliver `KITA-PUB-01` end to end: Unapproved license or partner claim is absent. **Role / estimate:** Customer web/mobile engineer (Qoder GPU; Sol review); 2 person-days.
* **Deps:** T-PUB-06; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/catalog/publish-content.ts; tests/features/test-pub-01.spec.ts. **Change:** packages/contracts/src/catalog.ts; apps/api/src/public/catalog.controller.ts; apps/customer-web/app/page.tsx; packages/ui-web/customer-shell.tsx; apps/mobile/src/screens/home.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `publishContent(ctx: CommandContext, input: Pub01Input): Promise<Result<Pub01Output>>`. **Wire / UI:** `GET /v1/content/{slug}` (`getContent`); `/`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Pub01Input` = slug, entity, locale, approved content version; output `Pub01Output` = versioned public content with supported legal identity. Additional errors: POLICY_UNAVAILABLE; shared M2 errors apply.
* **DB:** `policies`; publish approved effective policies only; no private projection. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-PUB-01` — Unapproved license or partner claim is absent; PACK-UX, PACK-API; REQ-SC-06, REQ-SC-15, REQ-SC-21 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `unapproved_claim_rejected` plus M2 trace/audit; alert/runbook owned by Customer web/mobile engineer.
* **Rollback:** RB-VIEW. **Evidence:** EV(T-PUB-01) with `TEST-PUB-01` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-PUB-02 — Indicative send/receive calculator

* **Objective:** deliver `KITA-PUB-02` end to end: Stale feed labels estimate and cannot yield executable transfer. **Role / estimate:** Customer web/mobile engineer (Qoder GPU; Sol review); 2 person-days.
* **Deps:** T-QUOTE-01; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/catalog/estimate-quote.ts; tests/features/test-pub-02.spec.ts. **Change:** packages/contracts/src/catalog.ts; apps/api/src/public/catalog.controller.ts; apps/customer-web/app/page.tsx; packages/ui-web/customer-shell.tsx; apps/mobile/src/screens/home.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `estimateQuote(ctx: CommandContext, input: Pub02Input): Promise<Result<Pub02Output>>`. **Wire / UI:** `POST /v1/estimates` (`createEstimate`); `/`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Pub02Input` = source/destination currency, amount anchor, indicative snapshot; output `Pub02Output` = as-of indicative amount/fees without executable quoteId. Additional errors: RATE_STALE; shared M2 errors apply.
* **DB:** `policies`; read policy/rate snapshot; no transfer/financial reservation. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-PUB-02` — Stale feed labels estimate and cannot yield executable transfer; PACK-UX, PACK-API; REQ-SC-06, REQ-SC-15, REQ-SC-21 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `indicative_rate_age` plus M2 trace/audit; alert/runbook owned by Customer web/mobile engineer.
* **Rollback:** RB-VIEW. **Evidence:** EV(T-PUB-02) with `TEST-PUB-02` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-PUB-03 — Origin and payout capability catalog

* **Objective:** deliver `KITA-PUB-03` end to end: Disabled US state or origin cannot accept money. **Role / estimate:** Customer web/mobile engineer (Qoder GPU; Sol review); 2 person-days.
* **Deps:** T-EXT-01; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/catalog/list-capabilities.ts; tests/features/test-pub-03.spec.ts. **Change:** packages/contracts/src/catalog.ts; apps/api/src/public/catalog.controller.ts; apps/customer-web/app/page.tsx; packages/ui-web/customer-shell.tsx; apps/mobile/src/screens/home.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `listCapabilities(ctx: ReadContext, input: Pub03Input): Promise<Result<Pub03Output>>`. **Wire / UI:** `GET /v1/corridors` (`listCorridors`); `/locations`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Pub03Input` = residence country/state, entity, product, methods; output `Pub03Output` = approved available/unavailable corridor catalog and reason. Additional errors: CAPABILITY_UNAVAILABLE; shared M2 errors apply.
* **DB:** `capabilities`; deny missing permission including unknown state; no country-wide default allow. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-PUB-03` — Disabled US state or origin cannot accept money; PACK-UX, PACK-API; REQ-SC-06, REQ-SC-15, REQ-SC-21 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `capability_catalog_denial` plus M2 trace/audit; alert/runbook owned by Customer web/mobile engineer.
* **Rollback:** RB-VIEW. **Evidence:** EV(T-PUB-03) with `TEST-PUB-03` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-PUB-04 — Fee and delivery transparency

* **Objective:** deliver `KITA-PUB-04` end to end: Fee and deadline agree with accepted terms. **Role / estimate:** Customer web/mobile engineer (Qoder GPU; Sol review); 2 person-days.
* **Deps:** T-QUOTE-03, T-PAY-02; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/catalog/describe-delivery.ts; tests/features/test-pub-04.spec.ts. **Change:** packages/contracts/src/catalog.ts; apps/api/src/public/catalog.controller.ts; apps/customer-web/app/page.tsx; packages/ui-web/customer-shell.tsx; apps/mobile/src/screens/home.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `describeDelivery(ctx: ReadContext, input: Pub04Input): Promise<Result<Pub04Output>>`. **Wire / UI:** `GET /v1/corridors/{id}/payout-options` (`listPayoutOptions`); `/fees`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Pub04Input` = corridor, method, speed, effective policy; output `Pub04Output` = fee components, cutoffs and delivery conditions matching quote. Additional errors: POLICY_UNAVAILABLE; shared M2 errors apply.
* **DB:** `capabilities`, `policies`; read effective capability and pricing/calendar version. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-PUB-04` — Fee and deadline agree with accepted terms; PACK-UX, PACK-API; REQ-SC-06, REQ-SC-15, REQ-SC-21 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `delivery_disclosure_mismatch` plus M2 trace/audit; alert/runbook owned by Customer web/mobile engineer.
* **Rollback:** RB-VIEW. **Evidence:** EV(T-PUB-04) with `TEST-PUB-04` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-PUB-05 — English and Filipino localization

* **Objective:** deliver `KITA-PUB-05` end to end: Receipt and consent retain chosen language. **Role / estimate:** Customer web/mobile engineer (Qoder GPU; Sol review); 3 person-days.
* **Deps:** T-PUB-01; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/catalog/resolve-locale.ts; tests/features/test-pub-05.spec.ts; packages/contracts/locales/en.json; packages/contracts/locales/fil.json. **Change:** packages/contracts/src/catalog.ts; apps/api/src/public/catalog.controller.ts; apps/customer-web/app/page.tsx; packages/ui-web/customer-shell.tsx; apps/mobile/src/screens/home.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `resolveLocale(ctx: ReadContext, input: Pub05Input): Promise<Result<Pub05Output>>`. **Wire / UI:** `GET /v1/content/{slug}` (`getContent`); `all customer screens`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Pub05Input` = locale en/fil, content/receipt/consent version; output `Pub05Output` = human-reviewed localized strings with immutable language provenance. Additional errors: POLICY_UNAVAILABLE; shared M2 errors apply.
* **DB:** `receipts`, `policies`; persist locale/hash on consents/receipts; translation update cannot rewrite old receipt. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-PUB-05` — Receipt and consent retain chosen language; PACK-UX, PACK-API; REQ-SC-06, REQ-SC-15, REQ-SC-21 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `locale_fallback_total` plus M2 trace/audit; alert/runbook owned by Customer web/mobile engineer.
* **Rollback:** RB-VIEW. **Evidence:** EV(T-PUB-05) with `TEST-PUB-05` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-PUB-06 — Accessible responsive Kita tokens

* **Objective:** deliver `KITA-PUB-06` end to end: Keyboard and screen reader flow passes at all required widths. **Role / estimate:** Customer web/mobile engineer (Qoder GPU; Sol review); 4 person-days.
* **Deps:** T-CONTRACT-01; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/design-tokens/kita.css; packages/ui-web/kita-primitives.tsx; apps/mobile/src/theme/kita.ts; tests/features/test-pub-06.spec.ts; packages/ui-web/brand.tsx; packages/design-tokens/tailwind.config.ts; apps/customer-web/public/icons/icon-512.png. **Change:** packages/contracts/src/catalog.ts; apps/customer-web/app/page.tsx; packages/ui-web/customer-shell.tsx; apps/mobile/src/screens/home.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `applyKitaTokens(ctx: CommandContext, input: Pub06Input): Promise<Result<Pub06Output>>`. **Wire / UI:** internal worker/tool; no customer HTTP mutation; `all clients`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Pub06Input` = Kita token set, responsive state, semantic component props; output `Pub06Output` = accessible web/native tokens and primitives at required widths. Additional errors: invalid token/contrast/build contract; shared M2 errors apply.
* **DB:** `none`; no financial tables; components receive read models only. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-PUB-06` — Keyboard and screen reader flow passes at all required widths; PACK-UX, PACK-API; REQ-SC-06, REQ-SC-15, REQ-SC-21 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `accessibility_regression_count` plus M2 trace/audit; alert/runbook owned by Customer web/mobile engineer.
* **Rollback:** RB-VIEW. **Evidence:** EV(T-PUB-06) with `TEST-PUB-06` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-AUTH-01 — Registration and verified contacts

* **Objective:** deliver `KITA-AUTH-01` end to end: Unverified contact cannot authorize transfer. **Role / estimate:** Identity/security engineer (Qoder GPU; Sol review); 3 person-days.
* **Deps:** T-IDENTITY-01; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/identity/verify-contact.ts; tests/features/test-auth-01.spec.ts. **Change:** packages/contracts/src/identity.ts; apps/api/src/customer/identity.controller.ts; apps/customer-web/app/signup/page.tsx; apps/mobile/src/features/identity.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `verifyContact(ctx: CommandContext, input: Auth01Input): Promise<Result<Auth01Output>>`. **Wire / UI:** `POST /v1/auth/contact-verifications` (`createContactVerification`); also owns `confirmContact`; `/signup`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Auth01Input` = contact challengeId, one-use code, OIDC subject, verified residence; output `Auth01Output` = verified-contact profile or expired/rate-limited challenge result. Additional errors: VERSION_CONFLICT; shared M2 errors apply.
* **DB:** `customers`; contact verification bound to subject/purpose; contacts never financial authorization alone. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-AUTH-01` — Unverified contact cannot authorize transfer; PACK-IDENTITY, PACK-SECURITY, PACK-API; REQ-SC-14, REQ-SC-15, REQ-SC-16 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `contact_verification_reject` plus M2 trace/audit; alert/runbook owned by Identity/security engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-AUTH-01) with `TEST-AUTH-01` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-AUTH-02 — Customer OIDC and logout/revocation

* **Objective:** deliver `KITA-AUTH-02` end to end: Revoked token cannot continue financial command. **Role / estimate:** Identity/security engineer (Qoder GPU; Sol review); 4 person-days.
* **Deps:** T-IDENTITY-01; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/identity/revoke-session.ts; tests/features/test-auth-02.spec.ts. **Change:** packages/contracts/src/identity.ts; apps/api/src/customer/identity.controller.ts; apps/customer-web/app/login/page.tsx; apps/mobile/src/features/identity.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `revokeSession(ctx: CommandContext, input: Auth02Input): Promise<Result<Auth02Output>>`. **Wire / UI:** `POST /v1/auth/logout` (`logout`); also owns `startAuthorization`, `completeAuthorization`; `/login`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Auth02Input` = OIDC code/state/nonce/PKCE and session logout request; output `Auth02Output` = validated scoped session or irrevocably revoked session result. Additional errors: IDEMPOTENCY_MISMATCH; shared M2 errors apply.
* **DB:** `customers`; opaque sessions, rotated refresh tokens and durable revocation; no cookie-only logout. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-AUTH-02` — Revoked token cannot continue financial command; PACK-IDENTITY, PACK-SECURITY, PACK-API; REQ-SC-14, REQ-SC-15, REQ-SC-16 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `session_revocation_lag` plus M2 trace/audit; alert/runbook owned by Identity/security engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-AUTH-02) with `TEST-AUTH-02` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-AUTH-03 — Passkeys and step-up

* **Objective:** deliver `KITA-AUTH-03` end to end: New destination needs fresh assurance. **Role / estimate:** Identity/security engineer (Qoder GPU; Sol review); 4 person-days.
* **Deps:** T-AUTH-02; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/identity/require-step-up.ts; tests/features/test-auth-03.spec.ts. **Change:** packages/contracts/src/identity.ts; apps/api/src/customer/identity.controller.ts; apps/customer-web/app/profile/security/page.tsx; apps/mobile/src/features/identity.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `requireStepUp(ctx: CommandContext, input: Auth03Input): Promise<Result<Auth03Output>>`. **Wire / UI:** `POST /v1/auth/step-ups` (`createStepUp`); `/profile/security`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Auth03Input` = passkey challenge, requested action/payload, session assurance; output `Auth03Output` = short-lived step-up bound to subject/action. Additional errors: APPROVAL_REQUIRED; shared M2 errors apply.
* **DB:** `consents`; one-use challenges and assurance expiry; server validates action scope. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-AUTH-03` — New destination needs fresh assurance; PACK-IDENTITY, PACK-SECURITY, PACK-API; REQ-SC-14, REQ-SC-15, REQ-SC-16 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `step_up_denial` plus M2 trace/audit; alert/runbook owned by Identity/security engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-AUTH-03) with `TEST-AUTH-03` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-AUTH-04 — Account recovery and device changes

* **Objective:** deliver `KITA-AUTH-04` end to end: Recovery cannot bypass new-destination hold. **Role / estimate:** Identity/security engineer (Qoder GPU; Sol review); 4 person-days.
* **Deps:** T-AUTH-03; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/identity/recover-account.ts; tests/features/test-auth-04.spec.ts. **Change:** packages/contracts/src/identity.ts; apps/api/src/customer/identity.controller.ts; apps/customer-web/app/recovery/page.tsx; apps/mobile/src/features/identity.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `recoverAccount(ctx: CommandContext, input: Auth04Input): Promise<Result<Auth04Output>>`. **Wire / UI:** `POST /v1/auth/recovery` (`startRecovery`); `/recovery`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Auth04Input` = recovery case, proof, device-change evidence; output `Auth04Output` = recovered session plus subject hold and permitted actions. Additional errors: COMPLIANCE_HOLD; shared M2 errors apply.
* **DB:** `cases`, `holds`; customer-level recovery hold survives logout; separate accessible-review procedure. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-AUTH-04` — Recovery cannot bypass new-destination hold; PACK-IDENTITY, PACK-SECURITY, PACK-API; REQ-SC-14, REQ-SC-15, REQ-SC-16 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `recovery_hold_age` plus M2 trace/audit; alert/runbook owned by Identity/security engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-AUTH-04) with `TEST-AUTH-04` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-AUTH-05 — Device/session inventory

* **Objective:** deliver `KITA-AUTH-05` end to end: Revoked device cannot refresh token. **Role / estimate:** Identity/security engineer (Qoder GPU; Sol review); 2 person-days.
* **Deps:** T-AUTH-02; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/identity/list-sessions.ts; tests/features/test-auth-05.spec.ts. **Change:** packages/contracts/src/identity.ts; apps/api/src/customer/identity.controller.ts; apps/customer-web/app/profile/devices/page.tsx; apps/mobile/src/features/identity.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `listSessions(ctx: ReadContext, input: Auth05Input): Promise<Result<Auth05Output>>`. **Wire / UI:** `GET /v1/auth/sessions` (`listSessions`); also owns `revokeSession`; `/profile/devices`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Auth05Input` = subject, cursor, session/device to revoke; output `Auth05Output` = masked device/session inventory and revocation result. Additional errors: VERSION_CONFLICT; shared M2 errors apply.
* **DB:** `customers`; revoked device cannot refresh or keep SSE alive. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-AUTH-05` — Revoked device cannot refresh token; PACK-IDENTITY, PACK-SECURITY, PACK-API; REQ-SC-14, REQ-SC-15, REQ-SC-16 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `active_revoked_session_count` plus M2 trace/audit; alert/runbook owned by Identity/security engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-AUTH-05) with `TEST-AUTH-05` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-AUTH-06 — Profile and account closure

* **Objective:** deliver `KITA-AUTH-06` end to end: Closure preserves outstanding refund and lawful records. **Role / estimate:** Identity/security engineer (Qoder GPU; Sol review); 3 person-days.
* **Deps:** T-AUTH-02, T-TX-06; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/identity/request-closure.ts; tests/features/test-auth-06.spec.ts. **Change:** packages/contracts/src/identity.ts; apps/api/src/customer/identity.controller.ts; apps/customer-web/app/profile/page.tsx; apps/mobile/src/features/identity.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `requestClosure(ctx: CommandContext, input: Auth06Input): Promise<Result<Auth06Output>>`. **Wire / UI:** `POST /v1/me/closure-requests` (`requestClosure`); also owns `getProfile`; `/profile`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Auth06Input` = profile edit or closure request, expectedVersion; output `Auth06Output` = profile version/closure case with outstanding obligations retained. Additional errors: FUNDING_PENDING; shared M2 errors apply.
* **DB:** `customers`, `cases`; closure checks all wallet/remittance/refund/dispute liabilities; lawful retention remains. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-AUTH-06` — Closure preserves outstanding refund and lawful records; PACK-IDENTITY, PACK-SECURITY, PACK-API; REQ-SC-14, REQ-SC-15, REQ-SC-16 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `closure_pending_obligations` plus M2 trace/audit; alert/runbook owned by Identity/security engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-AUTH-06) with `TEST-AUTH-06` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-AUTH-07 — Native secure storage/deep links/biometrics

* **Objective:** deliver `KITA-AUTH-07` end to end: Expired key or hostile deep link requires safe reauthentication. **Role / estimate:** Identity/security engineer (Qoder GPU; Sol review); 5 person-days.
* **Deps:** T-AUTH-02, T-AUTH-03; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/identity/exchange-mobile-code.ts; tests/features/test-auth-07.spec.ts. **Change:** packages/contracts/src/identity.ts; apps/api/src/customer/identity.controller.ts; apps/customer-web/app/login/page.tsx; apps/mobile/src/features/identity.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `exchangeMobileCode(ctx: CommandContext, input: Auth07Input): Promise<Result<Auth07Output>>`. **Wire / UI:** `POST /v1/auth/mobile-sessions` (`createMobileSession`); `mobile login`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Auth07Input` = mobile PKCE code, verified redirect/device and secure-store state; output `Auth07Output` = short-lived mobile session; hostile link safely rejected. Additional errors: CAPABILITY_UNAVAILABLE; shared M2 errors apply.
* **DB:** `customers`; device/session binding and reuse detection; biometric unlock never KYC evidence. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-AUTH-07` — Expired key or hostile deep link requires safe reauthentication; PACK-IDENTITY, PACK-SECURITY, PACK-API; REQ-SC-14, REQ-SC-15, REQ-SC-16 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `mobile_session_reuse` plus M2 trace/audit; alert/runbook owned by Identity/security engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-AUTH-07) with `TEST-AUTH-07` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-KYC-01 — Profile/document/selfie capture

* **Objective:** deliver `KITA-KYC-01` end to end: Capture callback alone never approves customer. **Role / estimate:** Compliance integrations engineer (Qoder GPU; Sol review); 4 person-days.
* **Deps:** T-IDENTITY-01, T-ADAPTER-01; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/compliance/start-identity.ts; tests/features/test-kyc-01.spec.ts; apps/workers/src/compliance/start-identity.worker.ts; packages/providers/identity/adapter.ts. **Change:** packages/contracts/src/compliance.ts; apps/api/src/customer/compliance.controller.ts; apps/customer-web/app/verification/page.tsx; apps/mobile/src/features/compliance.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `startIdentity(ctx: WorkerContext, input: Kyc01Input): Promise<Result<Kyc01Output>>`. **Wire / UI:** `POST /v1/identity-sessions` (`createIdentitySession`); `/verification`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Kyc01Input` = subject, document policy, returnUri, hosted SDK session; output `Kyc01Output` = hosted capture session and pending identity status. Additional errors: CAPABILITY_UNAVAILABLE; shared M2 errors apply.
* **DB:** `identity_decisions`, `documents`; bind provider session to customer/case; capture callback cannot approve. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-KYC-01` — Capture callback alone never approves customer; PACK-IDENTITY, PACK-ADMIN, PACK-PROVIDER; REQ-SC-04, REQ-SC-14, REQ-SC-15 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `identity_capture_failure` plus M2 trace/audit; alert/runbook owned by Compliance integrations engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-KYC-01) with `TEST-KYC-01` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-KYC-02 — Provider identity decision and re-KYC

* **Objective:** deliver `KITA-KYC-02` end to end: Later adverse decision blocks new payout. **Role / estimate:** Compliance integrations engineer (Qoder GPU; Sol review); 4 person-days.
* **Deps:** T-KYC-01, T-PLAT-04; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/compliance/apply-identity-evidence.ts; tests/features/test-kyc-02.spec.ts; apps/workers/src/compliance/apply-identity-evidence.worker.ts. **Change:** packages/contracts/src/compliance.ts; apps/api/src/customer/compliance.controller.ts; apps/customer-web/app/verification/page.tsx; apps/mobile/src/features/compliance.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `applyIdentityEvidence(ctx: WorkerContext, input: Kyc02Input): Promise<Result<Kyc02Output>>`. **Wire / UI:** `GET /v1/identity-status` (`getIdentityStatus`); `/verification`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Kyc02Input` = authenticated decision/evidence ID, subject, policy/version; output `Kyc02Output` = append-only identity decision, valid-until, next review and eligibility. Additional errors: COMPLIANCE_HOLD; shared M2 errors apply.
* **DB:** `identity_decisions`; later adverse evidence restricts current authority; preserve old decisions. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-KYC-02` — Later adverse decision blocks new payout; PACK-IDENTITY, PACK-ADMIN, PACK-PROVIDER; REQ-SC-04, REQ-SC-14, REQ-SC-15 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `identity_expired_clearance` plus M2 trace/audit; alert/runbook owned by Compliance integrations engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-KYC-02) with `TEST-KYC-02` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-KYC-03 — Secure additional documents

* **Objective:** deliver `KITA-KYC-03` end to end: Infected upload never reaches analyst viewer. **Role / estimate:** Compliance integrations engineer (Qoder GPU; Sol review); 4 person-days.
* **Deps:** T-IDENTITY-01; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/compliance/quarantine-upload.ts; tests/features/test-kyc-03.spec.ts; apps/workers/src/compliance/quarantine-upload.worker.ts. **Change:** packages/contracts/src/compliance.ts; apps/api/src/customer/compliance.controller.ts; apps/customer-web/app/verification/page.tsx; apps/mobile/src/features/compliance.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `quarantineUpload(ctx: WorkerContext, input: Kyc03Input): Promise<Result<Kyc03Output>>`. **Wire / UI:** `POST /v1/document-uploads` (`createDocumentUpload`); also owns `completeDocumentUpload`; `/verification`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Kyc03Input` = scoped upload intent, checksum, MIME/size and completion token; output `Kyc03Output` = quarantined document then scanned authorized short-lived access. Additional errors: invalid/malicious upload; scoped404; shared M2 errors apply.
* **DB:** `documents`, `cases`; document owner/purpose and scan state enforced; no public object ACL. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-KYC-03` — Infected upload never reaches analyst viewer; PACK-IDENTITY, PACK-ADMIN, PACK-PROVIDER; REQ-SC-04, REQ-SC-14, REQ-SC-15 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `quarantine_backlog_age` plus M2 trace/audit; alert/runbook owned by Compliance integrations engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-KYC-03) with `TEST-KYC-03` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-KYC-04 — Sender/recipient sanctions PEP adverse-media screening

* **Objective:** deliver `KITA-KYC-04` end to end: Unavailable or stale list cannot silently pass. **Role / estimate:** Compliance integrations engineer (Qoder GPU; Sol review); 5 person-days.
* **Deps:** T-KYC-02, T-REC-01; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/compliance/evaluate-screening.ts; tests/features/test-kyc-04.spec.ts; apps/workers/src/compliance/evaluate-screening.worker.ts; packages/providers/screening/adapter.ts. **Change:** packages/contracts/src/compliance.ts; apps/api/src/admin/compliance.controller.ts; apps/admin-web/app/compliance/page.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `evaluateScreening(ctx: WorkerContext, input: Kyc04Input): Promise<Result<Kyc04Output>>`. **Wire / UI:** `POST /admin/v1/cases/{id}/screening-reviews` (`createScreeningReview`); `admin/compliance`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Kyc04Input` = sender/recipient/institution facts, list and policy versions; output `Kyc04Output` = clear/review/block result with evidence and confidentiality scope. Additional errors: COMPLIANCE_HOLD; shared M2 errors apply.
* **DB:** `screenings`, `cases`; stale or unavailable list holds; bounded approved suppression history. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-KYC-04` — Unavailable or stale list cannot silently pass; PACK-IDENTITY, PACK-ADMIN, PACK-PROVIDER; REQ-SC-04, REQ-SC-14, REQ-SC-15 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `screening_staleness` plus M2 trace/audit; alert/runbook owned by Compliance integrations engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-KYC-04) with `TEST-KYC-04` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-KYC-05 — Ongoing list-delta rescreen

* **Objective:** deliver `KITA-KYC-05` end to end: New list hit stops queued payout before dispatch. **Role / estimate:** Compliance integrations engineer (Qoder GPU; Sol review); 3 person-days.
* **Deps:** T-KYC-04, T-PLAT-05; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/compliance/rescreen-delta.ts; tests/features/test-kyc-05.spec.ts; apps/workers/src/compliance/rescreen-delta.worker.ts. **Change:** packages/contracts/src/compliance.ts; apps/admin-web/app/compliance/page.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `rescreenDelta(ctx: WorkerContext, input: Kyc05Input): Promise<Result<Kyc05Output>>`. **Wire / UI:** internal worker/tool; no customer HTTP mutation; `admin/compliance`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Kyc05Input` = list delta cursor/version and affected subject IDs; output `Kyc05Output` = idempotent rescreen results and fresh holds before dispatch. Additional errors: COMPLIANCE_HOLD; shared M2 errors apply.
* **DB:** `screenings`, `holds`; cursor checkpoint and current-list clearance invalidation atomic with holds. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-KYC-05` — New list hit stops queued payout before dispatch; PACK-IDENTITY, PACK-ADMIN, PACK-PROVIDER; REQ-SC-04, REQ-SC-14, REQ-SC-15 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `rescreen_lag` plus M2 trace/audit; alert/runbook owned by Compliance integrations engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-KYC-05) with `TEST-KYC-05` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-KYC-06 — Risk tiers velocity EDD

* **Objective:** deliver `KITA-KYC-06` end to end: Concurrent transfers cannot exceed aggregate limit. **Role / estimate:** Compliance integrations engineer (Qoder GPU; Sol review); 5 person-days.
* **Deps:** T-KYC-02; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/compliance/evaluate-risk.ts; tests/features/test-kyc-06.spec.ts; apps/workers/src/compliance/evaluate-risk.worker.ts. **Change:** packages/contracts/src/compliance.ts; apps/api/src/admin/compliance.controller.ts; apps/admin-web/app/risk/page.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `evaluateRisk(ctx: WorkerContext, input: Kyc06Input): Promise<Result<Kyc06Output>>`. **Wire / UI:** `POST /admin/v1/cases/{id}/risk-decisions` (`createRiskDecision`); `admin/risk`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Kyc06Input` = verified identity, tier, linked velocity counters, policy; output `Kyc06Output` = risk decision, EDD case and reserved aggregate limits. Additional errors: LIMIT_EXCEEDED; shared M2 errors apply.
* **DB:** `policies`, `cases`; SERIALIZABLE limit buckets across concurrent/linked activity; immutable decisions. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-KYC-06` — Concurrent transfers cannot exceed aggregate limit; PACK-IDENTITY, PACK-ADMIN, PACK-PROVIDER; REQ-SC-04, REQ-SC-14, REQ-SC-15 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `risk_limit_denial` plus M2 trace/audit; alert/runbook owned by Compliance integrations engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-KYC-06) with `TEST-KYC-06` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-KYC-07 — AML case reporting QA confidentiality

* **Objective:** deliver `KITA-KYC-07` end to end: Support cannot read AML filing or confidential rationale. **Role / estimate:** Compliance integrations engineer (Qoder GPU; Sol review); 4 person-days.
* **Deps:** T-KYC-04, T-ADM-01; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/compliance/record-filing.ts; tests/features/test-kyc-07.spec.ts; apps/workers/src/compliance/record-filing.worker.ts. **Change:** packages/contracts/src/compliance.ts; apps/api/src/admin/compliance.controller.ts; apps/admin-web/app/aml/page.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `recordFiling(ctx: WorkerContext, input: Kyc07Input): Promise<Result<Kyc07Output>>`. **Wire / UI:** `POST /admin/v1/cases/{id}/filings` (`recordRegulatoryFiling`); `admin/aml`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Kyc07Input` = assigned confidential case, filing type, evidence and acknowledgment; output `Kyc07Output` = restricted filing timeline, deadlines and QA disposition. Additional errors: APPROVAL_REQUIRED; shared M2 errors apply.
* **DB:** `cases`, `documents`; case ACL and immutable submission/ack provenance; support sees neutral projection. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-KYC-07` — Support cannot read AML filing or confidential rationale; PACK-IDENTITY, PACK-ADMIN, PACK-PROVIDER; REQ-SC-04, REQ-SC-14, REQ-SC-15 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `filing_deadline_remaining` plus M2 trace/audit; alert/runbook owned by Compliance integrations engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-KYC-07) with `TEST-KYC-07` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-REC-01 — Bank recipient creation/validation

* **Objective:** deliver `KITA-REC-01` end to end: Ownership/name/account validation enforced server-side. **Role / estimate:** Payments full-stack engineer (Qoder GPU; Sol review); 3 person-days.
* **Deps:** T-IDENTITY-01, T-ADAPTER-01; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/recipients/create-recipient.ts; tests/features/test-rec-01.spec.ts. **Change:** packages/contracts/src/recipients.ts; apps/api/src/customer/recipients.controller.ts; apps/customer-web/app/recipients/page.tsx; apps/mobile/src/features/recipients.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `createRecipient(ctx: CommandContext, input: Rec01Input): Promise<Result<Rec01Output>>`. **Wire / UI:** `POST /v1/recipients` (`createRecipient`); also owns `listRecipients`; `/recipients`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Rec01Input` = owned customer, institution/catalog version, encrypted bank destination; output `Rec01Output` = immutable validated recipient version and mask. Additional errors: CAPABILITY_UNAVAILABLE; shared M2 errors apply.
* **DB:** `recipients`, `recipient_versions`; ownership/composite FKs; normalized HMAC lookup; expiry/name validation evidence. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-REC-01` — Ownership/name/account validation enforced server-side; PACK-API, PACK-PROVIDER, PACK-UX; REQ-SC-06, REQ-SC-14, REQ-SC-15 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `recipient_validation_failure` plus M2 trace/audit; alert/runbook owned by Payments full-stack engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-REC-01) with `TEST-REC-01` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-REC-02 — GCash/Maya recipient rules

* **Objective:** deliver `KITA-REC-02` end to end: Wrong network or expired validation blocks payout. **Role / estimate:** Payments full-stack engineer (Qoder GPU; Sol review); 3 person-days.
* **Deps:** T-REC-01; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/recipients/validate-wallet-recipient.ts; tests/features/test-rec-02.spec.ts. **Change:** packages/contracts/src/recipients.ts; apps/api/src/customer/recipients.controller.ts; apps/customer-web/app/recipients/page.tsx; apps/mobile/src/features/recipients.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `validateWalletRecipient(ctx: CommandContext, input: Rec02Input): Promise<Result<Rec02Output>>`. **Wire / UI:** `POST /v1/recipients/{id}/versions` (`createRecipientVersion`); `/recipients`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Rec02Input` = GCash/Maya network, identifier, legal name and validation evidence; output `Rec02Output` = network-specific immutable destination and validity. Additional errors: RECIPIENT_VERSION_CHANGED; shared M2 errors apply.
* **DB:** `recipient_versions`; versioned method-specific schema; name/capacity/expiry checked before dispatch. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-REC-02` — Wrong network or expired validation blocks payout; PACK-API, PACK-PROVIDER, PACK-UX; REQ-SC-06, REQ-SC-14, REQ-SC-15 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `wallet_recipient_stale` plus M2 trace/audit; alert/runbook owned by Payments full-stack engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-REC-02) with `TEST-REC-02` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-REC-03 — Recipient immutable change/archive

* **Objective:** deliver `KITA-REC-03` end to end: Old transfer snapshot survives destination edit. **Role / estimate:** Payments full-stack engineer (Qoder GPU; Sol review); 2 person-days.
* **Deps:** T-REC-01; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/recipients/archive-recipient.ts; tests/features/test-rec-03.spec.ts. **Change:** packages/contracts/src/recipients.ts; apps/api/src/customer/recipients.controller.ts; apps/customer-web/app/recipients/page.tsx; apps/mobile/src/features/recipients.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `archiveRecipient(ctx: CommandContext, input: Rec03Input): Promise<Result<Rec03Output>>`. **Wire / UI:** `POST /v1/recipients/{id}/archive` (`archiveRecipient`); `/recipients`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Rec03Input` = recipient ID, expectedVersion, new destination or archive intent; output `Rec03Output` = new immutable version or archived parent. Additional errors: VERSION_CONFLICT; shared M2 errors apply.
* **DB:** `recipients`, `recipient_versions`; old transfer snapshot remains immutable; archive disables new quotes only. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-REC-03` — Old transfer snapshot survives destination edit; PACK-API, PACK-PROVIDER, PACK-UX; REQ-SC-06, REQ-SC-14, REQ-SC-15 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `recipient_version_conflict` plus M2 trace/audit; alert/runbook owned by Payments full-stack engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-REC-03) with `TEST-REC-03` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-REC-04 — Repeat send and version revalidation

* **Objective:** deliver `KITA-REC-04` end to end: Repeat obtains new quote and never replays old payment. **Role / estimate:** Payments full-stack engineer (Qoder GPU; Sol review); 2 person-days.
* **Deps:** T-REC-03, T-QUOTE-08; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/recipients/repeat-transfer.ts; tests/features/test-rec-04.spec.ts. **Change:** packages/contracts/src/recipients.ts; apps/api/src/customer/recipients.controller.ts; apps/customer-web/app/home/page.tsx; apps/mobile/src/features/recipients.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `repeatTransfer(ctx: CommandContext, input: Rec04Input): Promise<Result<Rec04Output>>`. **Wire / UI:** `POST /v1/drafts` (`createDraft`); `/home`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Rec04Input` = owned historical transfer and selected current recipient version; output `Rec04Output` = new draft requiring new quote and consent. Additional errors: RECIPIENT_VERSION_CHANGED; shared M2 errors apply.
* **DB:** `drafts`, `recipient_versions`; copy intent only; never reuse command/quote/provider reference. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-REC-04` — Repeat obtains new quote and never replays old payment; PACK-API, PACK-PROVIDER, PACK-UX; REQ-SC-06, REQ-SC-14, REQ-SC-15 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `repeat_send_revalidation` plus M2 trace/audit; alert/runbook owned by Payments full-stack engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-REC-04) with `TEST-REC-04` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-QUOTE-01 — Exact send amount pricing

* **Objective:** deliver `KITA-QUOTE-01` end to end: 500 USD fixture yields exact 28710 PHP and 503.99 USD total. **Role / estimate:** Pricing/money engineer (Qoder GPU; Sol review); 4 person-days.
* **Deps:** T-CORE-02; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/quotes/build-quote.ts; tests/features/test-quote-01.spec.ts. **Change:** packages/contracts/src/quotes.ts; apps/api/src/customer/quotes.controller.ts; apps/customer-web/app/send/page.tsx; apps/mobile/src/features/quotes.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `buildQuote(ctx: CommandContext, input: Quote01Input): Promise<Result<Quote01Output>>`. **Wire / UI:** `POST /v1/quotes` (`createQuote`); `/send`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Quote01Input` = source Money, currency exponents, rational rate, fee policy; output `Quote01Output` = exact principal/receive/fee/tax/total and immutable quote terms. Additional errors: LIMIT_EXCEEDED; POLICY_UNAVAILABLE; shared M2 errors apply.
* **DB:** `quotes`; BigInt/rational arithmetic; no JS Number; server authority and policy refs. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-QUOTE-01` — 500 USD fixture yields exact 28710 PHP and 503.99 USD total; PACK-MONEY, PACK-API, PACK-UX; REQ-SC-01, REQ-SC-05, REQ-SC-06, REQ-SC-18 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `quote_arithmetic_reject` plus M2 trace/audit; alert/runbook owned by Pricing/money engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-QUOTE-01) with `TEST-QUOTE-01` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-QUOTE-02 — Exact recipient inverse solver

* **Objective:** deliver `KITA-QUOTE-02` end to end: JPY and USD inversion deliver requested minor amount exactly. **Role / estimate:** Pricing/money engineer (Qoder GPU; Sol review); 3 person-days.
* **Deps:** T-QUOTE-01; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/quotes/solve-receive.ts; tests/features/test-quote-02.spec.ts. **Change:** packages/contracts/src/quotes.ts; apps/api/src/customer/quotes.controller.ts; apps/customer-web/app/send/page.tsx; apps/mobile/src/features/quotes.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `solveReceive(ctx: CommandContext, input: Quote02Input): Promise<Result<Quote02Output>>`. **Wire / UI:** `POST /v1/quotes` (`createQuote`); `/send`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Quote02Input` = exact target minor amount, rational rate, exponents; output `Quote02Output` = minimal source minor amount and exactly requested payout plus disclosed rounding. Additional errors: CAPABILITY_UNAVAILABLE; shared M2 errors apply.
* **DB:** `quotes`; USD/JPY inverse ceil with exact target retained; provider exact-delivery check. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-QUOTE-02` — JPY and USD inversion deliver requested minor amount exactly; PACK-MONEY, PACK-API, PACK-UX; REQ-SC-01, REQ-SC-05, REQ-SC-06, REQ-SC-18 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `inverse_rounding_residual` plus M2 trace/audit; alert/runbook owned by Pricing/money engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-QUOTE-02) with `TEST-QUOTE-02` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-QUOTE-03 — Tier fees surcharges tax policies

* **Objective:** deliver `KITA-QUOTE-03` end to end: Tier boundary discount and tax totals are exact. **Role / estimate:** Pricing/money engineer (Qoder GPU; Sol review); 4 person-days.
* **Deps:** T-QUOTE-01; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/quotes/price-fees.ts; tests/features/test-quote-03.spec.ts. **Change:** packages/contracts/src/quotes.ts; apps/api/src/customer/quotes.controller.ts; apps/customer-web/app/send/page.tsx; apps/mobile/src/features/quotes.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `priceFees(ctx: CommandContext, input: Quote03Input): Promise<Result<Quote03Output>>`. **Wire / UI:** `POST /v1/quotes` (`createQuote`); `/send`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Quote03Input` = principal tier, method surcharge, approved tax/discount version; output `Quote03Output` = nonoverlapping fee components, discount cap and exact total. Additional errors: POLICY_UNAVAILABLE; shared M2 errors apply.
* **DB:** `policies`, `quotes`; signed tier/tax policy; no missing-tax default zero; immutable quote snapshot. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-QUOTE-03` — Tier boundary discount and tax totals are exact; PACK-MONEY, PACK-API, PACK-UX; REQ-SC-01, REQ-SC-05, REQ-SC-06, REQ-SC-18 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `pricing_policy_reject` plus M2 trace/audit; alert/runbook owned by Pricing/money engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-QUOTE-03) with `TEST-QUOTE-03` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-QUOTE-04 — Fresh executable FX and source outage

* **Objective:** deliver `KITA-QUOTE-04` end to end: Stale quote unavailable; no cached execution fallback. **Role / estimate:** Pricing/money engineer (Qoder GPU; Sol review); 3 person-days.
* **Deps:** T-ADAPTER-01, T-QUOTE-01; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/quotes/validate-rate.ts; tests/features/test-quote-04.spec.ts. **Change:** packages/contracts/src/quotes.ts; apps/api/src/customer/quotes.controller.ts; apps/customer-web/app/send/page.tsx; apps/mobile/src/features/quotes.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `validateRate(ctx: CommandContext, input: Quote04Input): Promise<Result<Quote04Output>>`. **Wire / UI:** `POST /v1/quotes` (`createQuote`); `/send`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Quote04Input` = provider quote/evidence, pair, as-of, vendor expiry; output `Quote04Output` = validated executable rate or explicit unavailable. Additional errors: RATE_STALE; shared M2 errors apply.
* **DB:** `quotes`, `evidence`; source age and provider expiry recorded; stale cached data cannot execute. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-QUOTE-04` — Stale quote unavailable; no cached execution fallback; PACK-MONEY, PACK-API, PACK-UX; REQ-SC-01, REQ-SC-05, REQ-SC-06, REQ-SC-18 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `executable_rate_age` plus M2 trace/audit; alert/runbook owned by Pricing/money engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-QUOTE-04) with `TEST-QUOTE-04` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-QUOTE-05 — Expiry policy version and recipient binding

* **Objective:** deliver `KITA-QUOTE-05` end to end: Expiry equality or recipient change produces conflict. **Role / estimate:** Pricing/money engineer (Qoder GPU; Sol review); 3 person-days.
* **Deps:** T-QUOTE-04, T-REC-03; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/quotes/accept-quote.ts; tests/features/test-quote-05.spec.ts. **Change:** packages/contracts/src/quotes.ts; apps/api/src/customer/quotes.controller.ts; apps/customer-web/app/send/review/page.tsx; apps/mobile/src/features/quotes.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `acceptQuote(ctx: CommandContext, input: Quote05Input): Promise<Result<Quote05Output>>`. **Wire / UI:** `POST /v1/transfers` (`acceptTransfer`); also owns `getQuote`; `/send/review`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Quote05Input` = quoteId, recipientVersionId, consent hash, DB decision time; output `Quote05Output` = one-use valid acceptance terms or conflict. Additional errors: QUOTE_EXPIRED; RECIPIENT_VERSION_CHANGED; shared M2 errors apply.
* **DB:** `quotes`, `transfers`; lock quote and recipient; equality expires; policy safety rechecked. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-QUOTE-05` — Expiry equality or recipient change produces conflict; PACK-MONEY, PACK-API, PACK-UX; REQ-SC-01, REQ-SC-05, REQ-SC-06, REQ-SC-18 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `quote_expiry_reject` plus M2 trace/audit; alert/runbook owned by Pricing/money engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-QUOTE-05) with `TEST-QUOTE-05` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-QUOTE-06 — Binding rate through funding delay

* **Objective:** deliver `KITA-QUOTE-06` end to end: Wholesale deterioration changes corporate cost not customer promise. **Role / estimate:** Pricing/money engineer (Qoder GPU; Sol review); 4 person-days.
* **Deps:** T-FIN-05, T-QUOTE-05; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/quotes/reserve-fx-exposure.ts; tests/features/test-quote-06.spec.ts. **Change:** packages/contracts/src/quotes.ts; apps/api/src/customer/quotes.controller.ts; apps/customer-web/app/transfers/[id]/page.tsx; apps/mobile/src/features/quotes.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `reserveFxExposure(ctx: CommandContext, input: Quote06Input): Promise<Result<Quote06Output>>`. **Wire / UI:** `GET /v1/transfers/{id}` (`getTransfer`); `/transfers/[id]`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Quote06Input` = accepted promise, initiation/settlement calendar, treasury exposure; output `Quote06Output` = binding amount/fee and reserved corporate FX exposure. Additional errors: LIQUIDITY_UNAVAILABLE; shared M2 errors apply.
* **DB:** `quotes`, `liquidity_reservations`; accepted terms immutable; actual trade cost affects corporate spread/loss. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-QUOTE-06` — Wholesale deterioration changes corporate cost not customer promise; PACK-MONEY, PACK-API, PACK-UX; REQ-SC-01, REQ-SC-05, REQ-SC-06, REQ-SC-18 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `accepted_unfunded_fx_exposure` plus M2 trace/audit; alert/runbook owned by Pricing/money engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-QUOTE-06) with `TEST-QUOTE-06` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-QUOTE-07 — Public midmarket vs execution disclosure

* **Objective:** deliver `KITA-QUOTE-07` end to end: Display rounding never changes execution arithmetic. **Role / estimate:** Pricing/money engineer (Qoder GPU; Sol review); 2 person-days.
* **Deps:** T-QUOTE-03, T-QUOTE-04; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/quotes/render-quote-terms.ts; tests/features/test-quote-07.spec.ts. **Change:** packages/contracts/src/quotes.ts; apps/api/src/customer/quotes.controller.ts; apps/customer-web/app/send/review/page.tsx; apps/mobile/src/features/quotes.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `renderQuoteTerms(ctx: CommandContext, input: Quote07Input): Promise<Result<Quote07Output>>`. **Wire / UI:** `POST /v1/quotes` (`createQuote`); `/send/review`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Quote07Input` = exact quote, midmarket reference, locale/disclosure version; output `Quote07Output` = customer-visible rate/fee/rounding and consent-ready hash. Additional errors: POLICY_UNAVAILABLE; shared M2 errors apply.
* **DB:** `quotes`, `consents`; display rounding separate from execution; receipt uses same terms hash. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-QUOTE-07` — Display rounding never changes execution arithmetic; PACK-MONEY, PACK-API, PACK-UX; REQ-SC-01, REQ-SC-05, REQ-SC-06, REQ-SC-18 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `quote_terms_hash_mismatch` plus M2 trace/audit; alert/runbook owned by Pricing/money engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-QUOTE-07) with `TEST-QUOTE-07` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-QUOTE-08 — Draft resume multi-device concurrency

* **Objective:** deliver `KITA-QUOTE-08` end to end: Stale draft version cannot overwrite newer recipient/amount. **Role / estimate:** Pricing/money engineer (Qoder GPU; Sol review); 3 person-days.
* **Deps:** T-CORE-02; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/quotes/save-draft.ts; tests/features/test-quote-08.spec.ts. **Change:** packages/contracts/src/quotes.ts; apps/api/src/customer/quotes.controller.ts; apps/customer-web/app/send/page.tsx; apps/mobile/src/features/quotes.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `saveDraft(ctx: CommandContext, input: Quote08Input): Promise<Result<Quote08Output>>`. **Wire / UI:** `PUT /v1/drafts/{id}` (`updateDraft`); also owns `getDraft`; `/send`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Quote08Input` = owned draft, expectedVersion, amount/recipient intent; output `Quote08Output` = versioned resumable draft with invalidated stale quote. Additional errors: VERSION_CONFLICT; shared M2 errors apply.
* **DB:** `drafts`; compare-and-swap draft updates; no lost multi-device edit. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-QUOTE-08` — Stale draft version cannot overwrite newer recipient/amount; PACK-MONEY, PACK-API, PACK-UX; REQ-SC-01, REQ-SC-05, REQ-SC-06, REQ-SC-18 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `draft_write_conflict` plus M2 trace/audit; alert/runbook owned by Pricing/money engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-QUOTE-08) with `TEST-QUOTE-08` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-TX-01 — Idempotent transfer acceptance

* **Objective:** deliver `KITA-TX-01` end to end: Double tap and different keys on one quote create one transfer. **Role / estimate:** Payments full-stack engineer (Qoder GPU; Sol review); 5 person-days.
* **Deps:** T-QUOTE-05, T-QUOTE-06, T-KYC-06, T-PLAT-03; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/transfers/accept-transfer.ts; tests/features/test-tx-01.spec.ts; apps/workers/src/transfers/accept-transfer.worker.ts. **Change:** packages/contracts/src/transfers.ts; apps/api/src/customer/transfers.controller.ts; apps/customer-web/app/send/review/page.tsx; apps/mobile/src/features/transfers.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `acceptTransfer(ctx: WorkerContext, input: Tx01Input): Promise<Result<Tx01Output>>`. **Wire / UI:** `POST /v1/transfers` (`acceptTransfer`); also owns `getCommandResult`; `/send/review`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Tx01Input` = quoteId, recipientVersionId, purpose, sourceOfFunds, consent, command key; output `Tx01Output` = durable accepted transfer/operation, never delivery. Additional errors: QUOTE_ALREADY_ACCEPTED; IDEMPOTENCY_MISMATCH; shared M2 errors apply.
* **DB:** `command_keys`, `transfers`; atomic quote use, limits/liquidity/reward reservations, consent/event/outbox. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-TX-01` — Double tap and different keys on one quote create one transfer; PACK-API, PACK-MONEY, PACK-UX; REQ-SC-01, REQ-SC-02, REQ-SC-03, REQ-SC-06, REQ-SC-07, REQ-SC-08, REQ-SC-09, REQ-SC-11, REQ-SC-12, REQ-SC-15 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `acceptance_conflict_total` plus M2 trace/audit; alert/runbook owned by Payments full-stack engineer.
* **Rollback:** RB-MONEY. **Evidence:** EV(T-TX-01) with `TEST-TX-01` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-TX-02 — Independent states/timeline/SSE

* **Objective:** deliver `KITA-TX-02` end to end: Late return preserves paid history. **Role / estimate:** Payments full-stack engineer (Qoder GPU; Sol review); 4 person-days.
* **Deps:** T-TX-01, T-PLAT-03; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/transfers/derive-customer-status.ts; tests/features/test-tx-02.spec.ts; apps/workers/src/transfers/derive-customer-status.worker.ts. **Change:** packages/contracts/src/transfers.ts; apps/api/src/customer/transfers.controller.ts; apps/customer-web/app/transfers/[id]/page.tsx; apps/mobile/src/features/transfers.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `deriveCustomerStatus(ctx: WorkerContext, input: Tx02Input): Promise<Result<Tx02Output>>`. **Wire / UI:** `GET /v1/transfers/{id}/events` (`streamTransferEvents`); also owns `getTransferTimeline`; `/transfers/[id]`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Tx02Input` = owned transfer, event cursor and independent leg states; output `Tx02Output` = derived neutral customer status, timeline/SSE and allowed actions. Additional errors: VERSION_CONFLICT; shared M2 errors apply.
* **DB:** `transfer_events`, `provider_attempts`; stable event versions; retain delivered history after return; no projection authorizes money. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-TX-02` — Late return preserves paid history; PACK-API, PACK-MONEY, PACK-UX; REQ-SC-01, REQ-SC-02, REQ-SC-03, REQ-SC-06, REQ-SC-07, REQ-SC-08, REQ-SC-09, REQ-SC-11, REQ-SC-12, REQ-SC-15 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `projection_lag` plus M2 trace/audit; alert/runbook owned by Payments full-stack engineer.
* **Rollback:** RB-MONEY. **Evidence:** EV(T-TX-02) with `TEST-TX-02` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-TX-03 — History search and pagination

* **Objective:** deliver `KITA-TX-03` end to end: Stable cursor cannot expose another customer records. **Role / estimate:** Payments full-stack engineer (Qoder GPU; Sol review); 2 person-days.
* **Deps:** T-TX-02; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/transfers/list-transfers.ts; tests/features/test-tx-03.spec.ts; apps/workers/src/transfers/list-transfers.worker.ts. **Change:** packages/contracts/src/transfers.ts; apps/api/src/customer/transfers.controller.ts; apps/customer-web/app/activity/page.tsx; apps/mobile/src/features/transfers.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `listTransfers(ctx: WorkerContext, input: Tx03Input): Promise<Result<Tx03Output>>`. **Wire / UI:** `GET /v1/transfers` (`listTransfers`); `/activity`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Tx03Input` = owner, filters, opaque cursor and as-of; output `Tx03Output` = stable paginated transfer history within scope. Additional errors: invalid cursor; scoped404; shared M2 errors apply.
* **DB:** `transfers`; keyset ordering createdAt/id and entity/owner predicate on every read. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-TX-03` — Stable cursor cannot expose another customer records; PACK-API, PACK-MONEY, PACK-UX; REQ-SC-01, REQ-SC-02, REQ-SC-03, REQ-SC-06, REQ-SC-07, REQ-SC-08, REQ-SC-09, REQ-SC-11, REQ-SC-12, REQ-SC-15 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `history_query_latency` plus M2 trace/audit; alert/runbook owned by Payments full-stack engineer.
* **Rollback:** RB-MONEY. **Evidence:** EV(T-TX-03) with `TEST-TX-03` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-TX-04 — Immutable disclosure/receipt

* **Objective:** deliver `KITA-TX-04` end to end: Old receipt unchanged after pricing update. **Role / estimate:** Payments full-stack engineer (Qoder GPU; Sol review); 4 person-days.
* **Deps:** T-TX-01, T-PUB-05; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/transfers/render-receipt.ts; tests/features/test-tx-04.spec.ts; apps/workers/src/transfers/render-receipt.worker.ts. **Change:** packages/contracts/src/transfers.ts; apps/api/src/customer/transfers.controller.ts; apps/customer-web/app/transfers/[id]/page.tsx; apps/mobile/src/features/transfers.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `renderReceipt(ctx: WorkerContext, input: Tx04Input): Promise<Result<Tx04Output>>`. **Wire / UI:** `GET /v1/transfers/{id}/receipt` (`getReceipt`); `/transfers/[id]`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Tx04Input` = accepted quote/consent, outcome evidence and receipt version; output `Tx04Output` = immutable localized receipt/PDF with authorized download. Additional errors: POLICY_UNAVAILABLE; shared M2 errors apply.
* **DB:** `receipts`, `documents`, `consents`; render/hash retained receipt; corrections append version with reason. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-TX-04` — Old receipt unchanged after pricing update; PACK-API, PACK-MONEY, PACK-UX; REQ-SC-01, REQ-SC-02, REQ-SC-03, REQ-SC-06, REQ-SC-07, REQ-SC-08, REQ-SC-09, REQ-SC-11, REQ-SC-12, REQ-SC-15 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `receipt_render_failure` plus M2 trace/audit; alert/runbook owned by Payments full-stack engineer.
* **Rollback:** RB-MONEY. **Evidence:** EV(T-TX-04) with `TEST-TX-04` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-TX-05 — Customer cancellation and race

* **Objective:** deliver `KITA-TX-05` end to end: Receipt timestamp and actual delivery determine eligible remedy. **Role / estimate:** Payments full-stack engineer (Qoder GPU; Sol review); 5 person-days.
* **Deps:** T-TX-01, T-TX-06, T-PAY-01; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/transfers/request-cancellation.ts; tests/features/test-tx-05.spec.ts; apps/workers/src/transfers/request-cancellation.worker.ts. **Change:** packages/contracts/src/transfers.ts; apps/api/src/customer/transfers.controller.ts; apps/customer-web/app/transfers/[id]/page.tsx; apps/mobile/src/features/transfers.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `requestCancellation(ctx: WorkerContext, input: Tx05Input): Promise<Result<Tx05Output>>`. **Wire / UI:** `POST /v1/transfers/{id}/cancellation-requests` (`requestCancellation`); also owns `adminRequestCancellation`; `/transfers/[id]`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Tx05Input` = customer/agent receivedAt, channel, transfer and expectedVersion; output `Tx05Output` = cancellation case/decision, hold/inquiry and lawful remedy timer. Additional errors: PROVIDER_OUTCOME_UNKNOWN; shared M2 errors apply.
* **DB:** `cases`, `holds`; serialize with dispatch; actual delivery time determines policy; receipt timestamp immutable. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-TX-05` — Receipt timestamp and actual delivery determine eligible remedy; PACK-API, PACK-MONEY, PACK-UX; REQ-SC-01, REQ-SC-02, REQ-SC-03, REQ-SC-06, REQ-SC-07, REQ-SC-08, REQ-SC-09, REQ-SC-11, REQ-SC-12, REQ-SC-15 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `cancellation_deadline_remaining` plus M2 trace/audit; alert/runbook owned by Payments full-stack engineer.
* **Rollback:** RB-MONEY. **Evidence:** EV(T-TX-05) with `TEST-TX-05` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-TX-06 — Partial/full refund lifecycle

* **Objective:** deliver `KITA-TX-06` end to end: Concurrent partial refunds cannot exceed entitlement. **Role / estimate:** Payments full-stack engineer (Qoder GPU; Sol review); 6 person-days.
* **Deps:** T-LEDGER-02, T-ADAPTER-01; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/refunds/authorize-refund.ts; tests/features/test-tx-06.spec.ts; apps/workers/src/refunds/authorize-refund.worker.ts. **Change:** packages/contracts/src/refunds.ts; apps/api/src/customer/refunds.controller.ts; apps/customer-web/app/transfers/[id]/page.tsx; apps/mobile/src/features/refunds.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `authorizeRefund(ctx: WorkerContext, input: Tx06Input): Promise<Result<Tx06Output>>`. **Wire / UI:** `POST /v1/transfers/{id}/refund-requests` (`requestRefund`); also owns `adminRequestRefund`; `/transfers/[id]`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Tx06Input` = component claims, transfer, remedy evidence and remaining entitlement; output `Tx06Output` = refund obligation, capped allocations and original-instrument operation. Additional errors: APPROVAL_REQUIRED; PROVIDER_OUTCOME_UNKNOWN; shared M2 errors apply.
* **DB:** `refund_obligations`, `refund_allocations`; reserve all unknown/pending credits; cumulative caps/rounding and obligation recognition. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-TX-06` — Concurrent partial refunds cannot exceed entitlement; PACK-API, PACK-MONEY, PACK-UX; REQ-SC-01, REQ-SC-02, REQ-SC-03, REQ-SC-06, REQ-SC-07, REQ-SC-08, REQ-SC-09, REQ-SC-11, REQ-SC-12, REQ-SC-15 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `refund_overdue_count` plus M2 trace/audit; alert/runbook owned by Payments full-stack engineer.
* **Rollback:** RB-MONEY. **Evidence:** EV(T-TX-06) with `TEST-TX-06` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-TX-07 — Error claims and complaint deadlines

* **Objective:** deliver `KITA-TX-07` end to end: Support handoff never resets original statutory clock. **Role / estimate:** Payments full-stack engineer (Qoder GPU; Sol review); 4 person-days.
* **Deps:** T-TX-04; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/transfers/open-error-claim.ts; tests/features/test-tx-07.spec.ts; apps/workers/src/transfers/open-error-claim.worker.ts. **Change:** packages/contracts/src/transfers.ts; apps/api/src/customer/transfers.controller.ts; apps/customer-web/app/support/page.tsx; apps/mobile/src/features/transfers.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `openErrorClaim(ctx: WorkerContext, input: Tx07Input): Promise<Result<Tx07Output>>`. **Wire / UI:** `POST /v1/transfers/{id}/error-claims` (`createErrorClaim`); `/support`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Tx07Input` = error/complaint report, original receivedAt, preferred remedy and documents; output `Tx07Output` = assigned case/deadlines, notices and independently reviewed resolution. Additional errors: POLICY_UNAVAILABLE; shared M2 errors apply.
* **DB:** `cases`, `documents`; versioned jurisdiction calendars; handoff never resets first receipt; append case messages. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-TX-07` — Support handoff never resets original statutory clock; PACK-API, PACK-MONEY, PACK-UX; REQ-SC-01, REQ-SC-02, REQ-SC-03, REQ-SC-06, REQ-SC-07, REQ-SC-08, REQ-SC-09, REQ-SC-11, REQ-SC-12, REQ-SC-15 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `error_case_deadline_remaining` plus M2 trace/audit; alert/runbook owned by Payments full-stack engineer.
* **Rollback:** RB-MONEY. **Evidence:** EV(T-TX-07) with `TEST-TX-07` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-TX-08 — Secure support messages

* **Objective:** deliver `KITA-TX-08` end to end: Wrong account cannot read or attach case evidence. **Role / estimate:** Payments full-stack engineer (Qoder GPU; Sol review); 3 person-days.
* **Deps:** T-KYC-03, T-TX-07; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/transfers/append-support-message.ts; tests/features/test-tx-08.spec.ts; apps/workers/src/transfers/append-support-message.worker.ts. **Change:** packages/contracts/src/transfers.ts; apps/api/src/customer/transfers.controller.ts; apps/customer-web/app/support/page.tsx; apps/mobile/src/features/transfers.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `appendSupportMessage(ctx: WorkerContext, input: Tx08Input): Promise<Result<Tx08Output>>`. **Wire / UI:** `POST /v1/support/cases/{id}/messages` (`createSupportMessage`); also owns `createSupportCase`, `getCase`; `/support`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Tx08Input` = owned case, message and scanned document IDs; output `Tx08Output` = secure append-only message and appropriate escalation. Additional errors: scoped404; invalid document state; shared M2 errors apply.
* **DB:** `cases`, `documents`; message/thread participants and immutable receipt time; no cross-case attachment. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-TX-08` — Wrong account cannot read or attach case evidence; PACK-API, PACK-MONEY, PACK-UX; REQ-SC-01, REQ-SC-02, REQ-SC-03, REQ-SC-06, REQ-SC-07, REQ-SC-08, REQ-SC-09, REQ-SC-11, REQ-SC-12, REQ-SC-15 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `support_case_queue_age` plus M2 trace/audit; alert/runbook owned by Payments full-stack engineer.
* **Rollback:** RB-MONEY. **Evidence:** EV(T-TX-08) with `TEST-TX-08` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-TX-09 — Provider RFI and neutral customer action

* **Objective:** deliver `KITA-TX-09` end to end: Confidential risk details absent from public projection. **Role / estimate:** Payments full-stack engineer (Qoder GPU; Sol review); 3 person-days.
* **Deps:** T-TX-08, T-KYC-07; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/transfers/respond-to-rfi.ts; tests/features/test-tx-09.spec.ts; apps/workers/src/transfers/respond-to-rfi.worker.ts. **Change:** packages/contracts/src/transfers.ts; apps/api/src/customer/transfers.controller.ts; apps/customer-web/app/transfers/[id]/page.tsx; apps/mobile/src/features/transfers.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `respondToRfi(ctx: WorkerContext, input: Tx09Input): Promise<Result<Tx09Output>>`. **Wire / UI:** `POST /v1/support/cases/{id}/responses` (`respondCase`); `/transfers/[id]`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Tx09Input` = case/RFI version, permitted response and evidence; output `Tx09Output` = provider RFI resolution with neutral customer action. Additional errors: VERSION_CONFLICT; shared M2 errors apply.
* **DB:** `cases`, `documents`; confidential facts remain restricted; evidence bound to assigned case. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-TX-09` — Confidential risk details absent from public projection; PACK-API, PACK-MONEY, PACK-UX; REQ-SC-01, REQ-SC-02, REQ-SC-03, REQ-SC-06, REQ-SC-07, REQ-SC-08, REQ-SC-09, REQ-SC-11, REQ-SC-12, REQ-SC-15 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `provider_rfi_age` plus M2 trace/audit; alert/runbook owned by Payments full-stack engineer.
* **Rollback:** RB-MONEY. **Evidence:** EV(T-TX-09) with `TEST-TX-09` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-TX-10 — Schedule/reminder and recurring mandate

* **Objective:** deliver `KITA-TX-10` end to end: DST retry produces one authorized occurrence. **Role / estimate:** Payments full-stack engineer (Qoder GPU; Sol review); 5 person-days.
* **Deps:** T-TX-01, T-PLAT-05; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/schedules/execute-occurrence.ts; tests/features/test-tx-10.spec.ts; apps/workers/src/schedules/execute-occurrence.worker.ts. **Change:** packages/contracts/src/schedules.ts; apps/api/src/customer/schedules.controller.ts; apps/customer-web/app/schedules/page.tsx; apps/mobile/src/features/schedules.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `executeOccurrence(ctx: WorkerContext, input: Tx10Input): Promise<Result<Tx10Output>>`. **Wire / UI:** `POST /v1/schedules` (`createSchedule`); also owns `listSchedules`, `revokeSchedule`; `/schedules`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Tx10Input` = reminder/recurring mandate, local schedule/IANA zone, bounds/version; output `Tx10Output` = one occurrence/operation, consent-required/skip/execute result. Additional errors: COMPLIANCE_HOLD; LIMIT_EXCEEDED; shared M2 errors apply.
* **DB:** `schedules`, `schedule_runs`; unique schedule/occurrenceUTC; revocation serialized; no unauthorized catch-up. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-TX-10` — DST retry produces one authorized occurrence; PACK-API, PACK-MONEY, PACK-UX; REQ-SC-01, REQ-SC-02, REQ-SC-03, REQ-SC-06, REQ-SC-07, REQ-SC-08, REQ-SC-09, REQ-SC-11, REQ-SC-12, REQ-SC-15 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `schedule_due_lag` plus M2 trace/audit; alert/runbook owned by Payments full-stack engineer.
* **Rollback:** RB-MONEY. **Evidence:** EV(T-TX-10) with `TEST-TX-10` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-FUND-01 — Hosted instrument and mandate

* **Objective:** deliver `KITA-FUND-01` end to end: No raw PAN/CVV in app server logs or DB. **Role / estimate:** Funding integrations engineer (Qoder GPU; Sol review); 4 person-days.
* **Deps:** T-IDENTITY-01, T-ADAPTER-01; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/funding/create-instrument-session.ts; tests/features/test-fund-01.spec.ts; apps/workers/src/funding/create-instrument-session.worker.ts. **Change:** packages/contracts/src/funding.ts; apps/api/src/customer/funding.controller.ts; apps/customer-web/app/profile/funding/page.tsx; apps/mobile/src/features/funding.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `createInstrumentSession(ctx: WorkerContext, input: Fund01Input): Promise<Result<Fund01Output>>`. **Wire / UI:** `POST /v1/funding-instrument-sessions` (`createFundingInstrumentSession`); also owns `confirmFundingInstrument`, `listFundingInstruments`, `revokeFundingInstrument`; `/profile/funding`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Fund01Input` = owned customer/instrument type, amount currency, consent and returnUri; output `Fund01Output` = hosted token/mandate session bound to entity/customer. Additional errors: CAPABILITY_UNAVAILABLE; shared M2 errors apply.
* **DB:** `consents`, `evidence`; provider instrument ownership; retain approved mandate hash; no PAN/CVV. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-FUND-01` — No raw PAN/CVV in app server logs or DB; PACK-PROVIDER, PACK-MONEY, PACK-FINANCE; REQ-SC-02, REQ-SC-03, REQ-SC-07, REQ-SC-08, REQ-SC-09, REQ-SC-10, REQ-SC-11, REQ-SC-17 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `hosted_funding_binding_failure` plus M2 trace/audit; alert/runbook owned by Funding integrations engineer.
* **Rollback:** RB-MONEY. **Evidence:** EV(T-FUND-01) with `TEST-FUND-01` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-FUND-02 — ACH collect/settle availability

* **Objective:** deliver `KITA-FUND-02` end to end: Initiation alone cannot authorize payout. **Role / estimate:** Funding integrations engineer (Qoder GPU; Sol review); 5 person-days.
* **Deps:** T-FUND-01, T-PLAT-04, T-LEDGER-02; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/funding/apply-ach-settlement.ts; tests/features/test-fund-02.spec.ts; apps/workers/src/funding/apply-ach-settlement.worker.ts; packages/providers/funding/ach-adapter.ts. **Change:** packages/contracts/src/funding.ts; apps/api/src/customer/funding.controller.ts; apps/customer-web/app/send/funding/page.tsx; apps/mobile/src/features/funding.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `applyAchSettlement(ctx: WorkerContext, input: Fund02Input): Promise<Result<Fund02Output>>`. **Wire / UI:** `POST /v1/transfers/{id}/funding-sessions` (`createFundingSession`); `/send/funding`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Fund02Input` = original ACH reference and authenticated settlement/return evidence; output `Fund02Output` = independent funding state and policy-qualified availability. Additional errors: FUNDING_PENDING; shared M2 errors apply.
* **DB:** `provider_attempts`, `journals`; initiation posts no money; settled receipt once; initial launch no ACH advance. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-FUND-02` — Initiation alone cannot authorize payout; PACK-PROVIDER, PACK-MONEY, PACK-FINANCE; REQ-SC-02, REQ-SC-03, REQ-SC-07, REQ-SC-08, REQ-SC-09, REQ-SC-10, REQ-SC-11, REQ-SC-17 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `ach_settlement_age` plus M2 trace/audit; alert/runbook owned by Funding integrations engineer.
* **Rollback:** RB-MONEY. **Evidence:** EV(T-FUND-02) with `TEST-FUND-02` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-FUND-03 — Debit authorize/capture/settle

* **Objective:** deliver `KITA-FUND-03` end to end: Authorization posts no cash and capture remains receivable. **Role / estimate:** Funding integrations engineer (Qoder GPU; Sol review); 5 person-days.
* **Deps:** T-FUND-01, T-FIN-05; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/funding/apply-card-evidence.ts; tests/features/test-fund-03.spec.ts; apps/workers/src/funding/apply-card-evidence.worker.ts; packages/providers/funding/card-adapter.ts. **Change:** packages/contracts/src/funding.ts; apps/api/src/customer/funding.controller.ts; apps/customer-web/app/send/funding/page.tsx; apps/mobile/src/features/funding.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `applyCardEvidence(ctx: WorkerContext, input: Fund03Input): Promise<Result<Fund03Output>>`. **Wire / UI:** `POST /v1/transfers/{id}/funding-sessions` (`createFundingSession`); `/send/funding`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Fund03Input` = authorize/capture/settlement evidence, gross/net fees/reserve; output `Fund03Output` = authorized memorandum, captured receivable and real settled cash. Additional errors: LIQUIDITY_UNAVAILABLE; shared M2 errors apply.
* **DB:** `provider_attempts`, `journals`; Express capital reserved before advance; captured receivable never labeled bank cash. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-FUND-03` — Authorization posts no cash and capture remains receivable; PACK-PROVIDER, PACK-MONEY, PACK-FINANCE; REQ-SC-02, REQ-SC-03, REQ-SC-07, REQ-SC-08, REQ-SC-09, REQ-SC-10, REQ-SC-11, REQ-SC-17 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `card_capture_unsettled_age` plus M2 trace/audit; alert/runbook owned by Funding integrations engineer.
* **Rollback:** RB-MONEY. **Evidence:** EV(T-FUND-03) with `TEST-FUND-03` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-FUND-04 — Credit and Apple/Google Pay capabilities

* **Objective:** deliver `KITA-FUND-04` end to end: Unapproved method fails closed. **Role / estimate:** Funding integrations engineer (Qoder GPU; Sol review); 3 person-days.
* **Deps:** T-FUND-03, T-DEPEND-01; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/funding/validate-funding-capability.ts; tests/features/test-fund-04.spec.ts; apps/workers/src/funding/validate-funding-capability.worker.ts. **Change:** packages/contracts/src/funding.ts; apps/api/src/customer/funding.controller.ts; apps/customer-web/app/send/funding/page.tsx; apps/mobile/src/features/funding.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `validateFundingCapability(ctx: WorkerContext, input: Fund04Input): Promise<Result<Fund04Output>>`. **Wire / UI:** `POST /v1/transfers/{id}/funding-sessions` (`createFundingSession`); `/send/funding`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Fund04Input` = credit/debit/Apple Pay/Google Pay method, entity/device/approval; output `Fund04Output` = only separately approved hosted capabilities available. Additional errors: CAPABILITY_UNAVAILABLE; shared M2 errors apply.
* **DB:** `capabilities`, `provider_attempts`; account/method permissions effective and environment bound; wallet button is instrument wrapper. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-FUND-04` — Unapproved method fails closed; PACK-PROVIDER, PACK-MONEY, PACK-FINANCE; REQ-SC-02, REQ-SC-03, REQ-SC-07, REQ-SC-08, REQ-SC-09, REQ-SC-10, REQ-SC-11, REQ-SC-17 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `funding_capability_denial` plus M2 trace/audit; alert/runbook owned by Funding integrations engineer.
* **Rollback:** RB-MONEY. **Evidence:** EV(T-FUND-04) with `TEST-FUND-04` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-FUND-05 — Funding unknown/recovery

* **Objective:** deliver `KITA-FUND-05` end to end: Timeout after debit never creates second charge. **Role / estimate:** Funding integrations engineer (Qoder GPU; Sol review); 4 person-days.
* **Deps:** T-FUND-02, T-FUND-03, T-PLAT-05; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/funding/recover-funding.ts; tests/features/test-fund-05.spec.ts; apps/workers/src/funding/recover-funding.worker.ts. **Change:** packages/contracts/src/funding.ts; apps/api/src/customer/funding.controller.ts; apps/customer-web/app/transfers/[id]/page.tsx; apps/mobile/src/features/funding.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `recoverFunding(ctx: WorkerContext, input: Fund05Input): Promise<Result<Fund05Output>>`. **Wire / UI:** `GET /v1/operations/{id}` (`getOperation`); `/transfers/[id]`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Fund05Input` = ambiguous original funding attempt/reference and inquiry evidence; output `Fund05Output` = known result or retained unknown operation. Additional errors: PROVIDER_OUTCOME_UNKNOWN; shared M2 errors apply.
* **DB:** `provider_attempts`, `inbox`; keep collection identity and exposure; no automatic re-debit from generic return code. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-FUND-05` — Timeout after debit never creates second charge; PACK-PROVIDER, PACK-MONEY, PACK-FINANCE; REQ-SC-02, REQ-SC-03, REQ-SC-07, REQ-SC-08, REQ-SC-09, REQ-SC-10, REQ-SC-11, REQ-SC-17 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `unknown_funding_age` plus M2 trace/audit; alert/runbook owned by Funding integrations engineer.
* **Rollback:** RB-MONEY. **Evidence:** EV(T-FUND-05) with `TEST-FUND-05` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-FUND-06 — ACH return and chargeback after payout

* **Objective:** deliver `KITA-FUND-06` end to end: Paid PHP persists with separate loss/recovery. **Role / estimate:** Funding integrations engineer (Qoder GPU; Sol review); 5 person-days.
* **Deps:** T-FUND-05, T-FIN-08; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/funding/apply-funding-return.ts; tests/features/test-fund-06.spec.ts; apps/workers/src/funding/apply-funding-return.worker.ts. **Change:** packages/contracts/src/funding.ts; apps/api/src/admin/funding.controller.ts; apps/admin-web/app/disputes/page.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `applyFundingReturn(ctx: WorkerContext, input: Fund06Input): Promise<Result<Fund06Output>>`. **Wire / UI:** `POST /admin/v1/disputes/{id}/responses` (`createDisputeResponse`); `admin/disputes`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Fund06Input` = return/dispute movement, paid history, fees and recovery policy; output `Fund06Output` = separate recovery/loss case, restriction and contest deadline. Additional errors: POLICY_UNAVAILABLE; shared M2 errors apply.
* **DB:** `disputes`, `journals`; delivery immutable; recovery accounting only for legally collectible claim; no unrelated wallet seizure. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-FUND-06` — Paid PHP persists with separate loss/recovery; PACK-PROVIDER, PACK-MONEY, PACK-FINANCE; REQ-SC-02, REQ-SC-03, REQ-SC-07, REQ-SC-08, REQ-SC-09, REQ-SC-10, REQ-SC-11, REQ-SC-17 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `post_payout_return_exposure` plus M2 trace/audit; alert/runbook owned by Funding integrations engineer.
* **Rollback:** RB-MONEY. **Evidence:** EV(T-FUND-06) with `TEST-FUND-06` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-FUND-07 — Unmatched or late inbound funding

* **Objective:** deliver `KITA-FUND-07` end to end: Unowned cash remains suspense not revenue. **Role / estimate:** Funding integrations engineer (Qoder GPU; Sol review); 4 person-days.
* **Deps:** T-FIN-03, T-TX-06; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/funding/attribute-incoming-cash.ts; tests/features/test-fund-07.spec.ts; apps/workers/src/funding/attribute-incoming-cash.worker.ts. **Change:** packages/contracts/src/funding.ts; apps/api/src/admin/funding.controller.ts; apps/admin-web/app/reconciliation/page.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `attributeIncomingCash(ctx: WorkerContext, input: Fund07Input): Promise<Result<Fund07Output>>`. **Wire / UI:** `POST /admin/v1/reconciliation-breaks/{id}/resolutions` (`resolveBreak`); `admin/reconciliation`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Fund07Input` = independent inbound cash evidence, expected amount/deadline and ownership; output `Fund07Output` = matched allocation or late/short/excess/suspense case. Additional errors: VERSION_CONFLICT; shared M2 errors apply.
* **DB:** `reconciliation_breaks`, `journals`; one cash movement; gross/net distinction; excess liability, no resurrection/repricing. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-FUND-07` — Unowned cash remains suspense not revenue; PACK-PROVIDER, PACK-MONEY, PACK-FINANCE; REQ-SC-02, REQ-SC-03, REQ-SC-07, REQ-SC-08, REQ-SC-09, REQ-SC-10, REQ-SC-11, REQ-SC-17 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `unidentified_cash_age` plus M2 trace/audit; alert/runbook owned by Funding integrations engineer.
* **Rollback:** RB-MONEY. **Evidence:** EV(T-FUND-07) with `TEST-FUND-07` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-PAY-01 — Primary/secondary safe routing

* **Objective:** deliver `KITA-PAY-01` end to end: Unknown first provider blocks second payout. **Role / estimate:** Payout integrations engineer (Qoder GPU; Sol review); 6 person-days.
* **Deps:** T-ADAPTER-01, T-FIN-05, T-KYC-05, T-ADM-05; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/payouts/select-route.ts; tests/features/test-pay-01.spec.ts; apps/workers/src/payouts/select-route.worker.ts; packages/providers/thunes/adapter.ts; packages/providers/nium/adapter.ts. **Change:** packages/contracts/src/payouts.ts; apps/api/src/admin/payouts.controller.ts; apps/admin-web/app/routes/page.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `selectRoute(ctx: WorkerContext, input: Pay01Input): Promise<Result<Pay01Output>>`. **Wire / UI:** `POST /admin/v1/transfers/{id}/reroute-requests` (`requestReroute`); `admin/routes`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Pay01Input` = approved transfer/attempt, route candidates, definitive nonpayment evidence; output `Pay01Output` = deterministic eligible route and fenced submission or inquiry. Additional errors: PROVIDER_OUTCOME_UNKNOWN; LIQUIDITY_UNAVAILABLE; shared M2 errors apply.
* **DB:** `provider_attempts`, `liquidity_reservations`; current holds/recipient/list/capital rechecked at dispatch; no alternate while unknown. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-PAY-01` — Unknown first provider blocks second payout; PACK-PROVIDER, PACK-MONEY, PACK-UX; REQ-SC-02, REQ-SC-03, REQ-SC-04, REQ-SC-05, REQ-SC-12, REQ-SC-13, REQ-SC-17 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `unknown_payout_age` plus M2 trace/audit; alert/runbook owned by Payout integrations engineer.
* **Rollback:** RB-MONEY. **Evidence:** EV(T-PAY-01) with `TEST-PAY-01` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-PAY-02 — PHP bank InstaPay/PESONet route calendars

* **Objective:** deliver `KITA-PAY-02` end to end: Cutoff/holiday and amount cannot be bypassed by splitting. **Role / estimate:** Payout integrations engineer (Qoder GPU; Sol review); 4 person-days.
* **Deps:** T-ADAPTER-01, T-EXT-01; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/payouts/resolve-bank-route.ts; tests/features/test-pay-02.spec.ts; apps/workers/src/payouts/resolve-bank-route.worker.ts. **Change:** packages/contracts/src/payouts.ts; apps/api/src/customer/payouts.controller.ts; apps/customer-web/app/send/page.tsx; apps/mobile/src/features/payouts.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `resolveBankRoute(ctx: WorkerContext, input: Pay02Input): Promise<Result<Pay02Output>>`. **Wire / UI:** `GET /v1/corridors/{id}/payout-options` (`listPayoutOptions`); `/send`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Pay02Input` = bank/institution, amount/currency, cutoff/timezone/calendar; output `Pay02Output` = permitted InstaPay/PESONet option and delivery bounds. Additional errors: CAPABILITY_UNAVAILABLE; LIMIT_EXCEEDED; shared M2 errors apply.
* **DB:** `capabilities`, `policies`; versioned approved limits/calendars; no splitting to evade rail cap. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-PAY-02` — Cutoff/holiday and amount cannot be bypassed by splitting; PACK-PROVIDER, PACK-MONEY, PACK-UX; REQ-SC-02, REQ-SC-03, REQ-SC-04, REQ-SC-05, REQ-SC-12, REQ-SC-13, REQ-SC-17 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `bank_cutoff_denial` plus M2 trace/audit; alert/runbook owned by Payout integrations engineer.
* **Rollback:** RB-MONEY. **Evidence:** EV(T-PAY-02) with `TEST-PAY-02` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-PAY-03 — GCash/Maya actual delivery

* **Objective:** deliver `KITA-PAY-03` end to end: Accepted request is not recipient credited. **Role / estimate:** Payout integrations engineer (Qoder GPU; Sol review); 4 person-days.
* **Deps:** T-PAY-01, T-REC-02, T-PLAT-04; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/payouts/apply-wallet-payout.ts; tests/features/test-pay-03.spec.ts; apps/workers/src/payouts/apply-wallet-payout.worker.ts. **Change:** packages/contracts/src/payouts.ts; apps/api/src/customer/payouts.controller.ts; apps/customer-web/app/transfers/[id]/page.tsx; apps/mobile/src/features/payouts.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `applyWalletPayout(ctx: WorkerContext, input: Pay03Input): Promise<Result<Pay03Output>>`. **Wire / UI:** `GET /v1/transfers/{id}` (`getTransfer`); `/transfers/[id]`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Pay03Input` = authenticated GCash/Maya accepted/debit/credit evidence; output `Pay03Output` = recipient delivery only on actual credited proof. Additional errors: PROVIDER_OUTCOME_UNKNOWN; shared M2 errors apply.
* **DB:** `provider_attempts`, `evidence`; amount/destination/movement verified; accepted != paid; ledger transit resolved once. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-PAY-03` — Accepted request is not recipient credited; PACK-PROVIDER, PACK-MONEY, PACK-UX; REQ-SC-02, REQ-SC-03, REQ-SC-04, REQ-SC-05, REQ-SC-12, REQ-SC-13, REQ-SC-17 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `wallet_payout_delivery_age` plus M2 trace/audit; alert/runbook owned by Payout integrations engineer.
* **Rollback:** RB-MONEY. **Evidence:** EV(T-PAY-03) with `TEST-PAY-03` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-PAY-04 — Cash pickup collection/expiry

* **Objective:** deliver `KITA-PAY-04` end to end: Available and collected differ; expiry alone never fabricates return. **Role / estimate:** Payout integrations engineer (Qoder GPU; Sol review); 5 person-days.
* **Deps:** T-PAY-01, T-TX-06, T-KYC-03; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/payouts/apply-cash-pickup.ts; tests/features/test-pay-04.spec.ts; apps/workers/src/payouts/apply-cash-pickup.worker.ts. **Change:** packages/contracts/src/payouts.ts; apps/api/src/customer/payouts.controller.ts; apps/customer-web/app/transfers/[id]/page.tsx; apps/mobile/src/features/payouts.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `applyCashPickup(ctx: WorkerContext, input: Pay04Input): Promise<Result<Pay04Output>>`. **Wire / UI:** `GET /v1/transfers/{id}/pickup-instructions` (`getPickupInstructions`); `/transfers/[id]`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Pay04Input` = pickup availability/secret, collection/expiry/return evidence; output `Pay04Output` = masked instructions and distinct available/collected/returned status. Additional errors: PROVIDER_OUTCOME_UNKNOWN; shared M2 errors apply.
* **DB:** `provider_attempts`, `documents`; expiry schedules inquiry; actual collection/return required; encrypted pickup secret. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-PAY-04` — Available and collected differ; expiry alone never fabricates return; PACK-PROVIDER, PACK-MONEY, PACK-UX; REQ-SC-02, REQ-SC-03, REQ-SC-04, REQ-SC-05, REQ-SC-12, REQ-SC-13, REQ-SC-17 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `uncollected_cash_age` plus M2 trace/audit; alert/runbook owned by Payout integrations engineer.
* **Rollback:** RB-MONEY. **Evidence:** EV(T-PAY-04) with `TEST-PAY-04` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-PAY-05 — Payout rejected/returned/partially returned

* **Objective:** deliver `KITA-PAY-05` end to end: Returned amount capped and original delivered timestamp preserved. **Role / estimate:** Payout integrations engineer (Qoder GPU; Sol review); 5 person-days.
* **Deps:** T-PAY-01, T-TX-06; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/payouts/apply-payout-return.ts; tests/features/test-pay-05.spec.ts; apps/workers/src/payouts/apply-payout-return.worker.ts. **Change:** packages/contracts/src/payouts.ts; apps/api/src/admin/payouts.controller.ts; apps/admin-web/app/transfers/page.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `applyPayoutReturn(ctx: WorkerContext, input: Pay05Input): Promise<Result<Pay05Output>>`. **Wire / UI:** `POST /admin/v1/payout-attempts/{id}/status-inquiries` (`inquireAttempt`); `admin/transfers`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Pay05Input` = definitive rejection, partial/full returned amount and movement IDs; output `Pay05Output` = new return/remedy state preserving original delivery. Additional errors: PROVIDER_OUTCOME_UNKNOWN; shared M2 errors apply.
* **DB:** `provider_attempts`, `refund_obligations`; cumulative recipient-return cap and refund allocations; new authority only with proof. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-PAY-05` — Returned amount capped and original delivered timestamp preserved; PACK-PROVIDER, PACK-MONEY, PACK-UX; REQ-SC-02, REQ-SC-03, REQ-SC-04, REQ-SC-05, REQ-SC-12, REQ-SC-13, REQ-SC-17 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `payout_return_unresolved_age` plus M2 trace/audit; alert/runbook owned by Payout integrations engineer.
* **Rollback:** RB-MONEY. **Evidence:** EV(T-PAY-05) with `TEST-PAY-05` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-PAY-06 — Bills catalog/validation/posting/proof

* **Objective:** deliver `KITA-PAY-06` end to end: Aggregator accepted does not mark bill paid. **Role / estimate:** Payout integrations engineer (Qoder GPU; Sol review); 6 person-days.
* **Deps:** T-PAY-01, T-TX-06; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/payouts/apply-bill-posting.ts; tests/features/test-pay-06.spec.ts; apps/workers/src/payouts/apply-bill-posting.worker.ts; packages/providers/bills/adapter.ts. **Change:** packages/contracts/src/payouts.ts; apps/api/src/customer/payouts.controller.ts; apps/customer-web/app/bills/page.tsx; apps/mobile/src/features/payouts.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `applyBillPosting(ctx: WorkerContext, input: Pay06Input): Promise<Result<Pay06Output>>`. **Wire / UI:** `POST /v1/bill-payments` (`createBillPayment`); also owns `listBillers`, `validateBillAccount`; `/bills`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Pay06Input` = biller catalog/schema, account token, period/amount and posting proof; output `Pay06Output` = bill obligation then posted proof or investigation/refund. Additional errors: CAPABILITY_UNAVAILABLE; shared M2 errors apply.
* **DB:** `bill_payments`, `transfers`; immutable bill schema and duplicate-period checks; acceptance not biller posting. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-PAY-06` — Aggregator accepted does not mark bill paid; PACK-PROVIDER, PACK-MONEY, PACK-UX; REQ-SC-02, REQ-SC-03, REQ-SC-04, REQ-SC-05, REQ-SC-12, REQ-SC-13, REQ-SC-17 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `bill_posting_age` plus M2 trace/audit; alert/runbook owned by Payout integrations engineer.
* **Rollback:** RB-MONEY. **Evidence:** EV(T-PAY-06) with `TEST-PAY-06` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-WAL-01 — Multi-currency available pending reserved

* **Objective:** deliver `KITA-WAL-01` end to end: Projection and ledger agree per currency. **Role / estimate:** Wallet/ledger engineer (Qoder GPU; Sol review); 3 person-days.
* **Deps:** T-LEDGER-02; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/wallets/get-wallet-balances.ts; tests/features/test-wal-01.spec.ts; apps/workers/src/wallets/get-wallet-balances.worker.ts. **Change:** packages/contracts/src/wallets.ts; apps/api/src/customer/wallets.controller.ts; apps/customer-web/app/wallet/page.tsx; apps/mobile/src/features/wallets.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `getWalletBalances(ctx: WorkerContext, input: Wal01Input): Promise<Result<Wal01Output>>`. **Wire / UI:** `GET /v1/wallets` (`listWallets`); `/wallet`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Wal01Input` = customer/book/currency and snapshot as-of; output `Wal01Output` = available/pending/reserved balances and safe allowed actions. Additional errors: CAPABILITY_UNAVAILABLE; shared M2 errors apply.
* **DB:** `ledger_accounts`, `account_balances`; ledger-derived projection per currency, no read-replica authority. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-WAL-01` — Projection and ledger agree per currency; PACK-MONEY, PACK-FINANCE, PACK-API; REQ-SC-02, REQ-SC-05, REQ-SC-07, REQ-SC-08, REQ-SC-09, REQ-SC-11, REQ-SC-15 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `wallet_projection_drift` plus M2 trace/audit; alert/runbook owned by Wallet/ledger engineer.
* **Rollback:** RB-MONEY. **Evidence:** EV(T-WAL-01) with `TEST-WAL-01` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-WAL-02 — Real top-up and funding return

* **Objective:** deliver `KITA-WAL-02` end to end: No funds credited without real settlement/approved risk evidence. **Role / estimate:** Wallet/ledger engineer (Qoder GPU; Sol review); 5 person-days.
* **Deps:** T-WAL-01, T-FUND-02, T-FUND-03; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/wallets/credit-wallet-from-evidence.ts; tests/features/test-wal-02.spec.ts; apps/workers/src/wallets/credit-wallet-from-evidence.worker.ts. **Change:** packages/contracts/src/wallets.ts; apps/api/src/customer/wallets.controller.ts; apps/customer-web/app/wallet/page.tsx; apps/mobile/src/features/wallets.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `creditWalletFromEvidence(ctx: WorkerContext, input: Wal02Input): Promise<Result<Wal02Output>>`. **Wire / UI:** `POST /v1/wallets/topups` (`createWalletTopup`); `/wallet`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Wal02Input` = real hosted top-up evidence and availability policy; output `Wal02Output` = pending then available wallet credit; separate return exposure. Additional errors: FUNDING_PENDING; shared M2 errors apply.
* **DB:** `provider_attempts`, `journals`; non-transfer financial operation parent; actual settlement/approved advance only. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-WAL-02` — No funds credited without real settlement/approved risk evidence; PACK-MONEY, PACK-FINANCE, PACK-API; REQ-SC-02, REQ-SC-05, REQ-SC-07, REQ-SC-08, REQ-SC-09, REQ-SC-11, REQ-SC-15 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `wallet_topup_pending_age` plus M2 trace/audit; alert/runbook owned by Wallet/ledger engineer.
* **Rollback:** RB-MONEY. **Evidence:** EV(T-WAL-02) with `TEST-WAL-02` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-WAL-03 — Atomic wallet remittance debit

* **Objective:** deliver `KITA-WAL-03` end to end: Two simultaneous spends cannot overdraw. **Role / estimate:** Wallet/ledger engineer (Qoder GPU; Sol review); 4 person-days.
* **Deps:** T-WAL-01, T-CORE-02; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/wallets/reserve-wallet.ts; tests/features/test-wal-03.spec.ts; apps/workers/src/wallets/reserve-wallet.worker.ts. **Change:** packages/contracts/src/wallets.ts; apps/api/src/customer/wallets.controller.ts; apps/customer-web/app/send/page.tsx; apps/mobile/src/features/wallets.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `reserveWallet(ctx: WorkerContext, input: Wal03Input): Promise<Result<Wal03Output>>`. **Wire / UI:** `POST /v1/transfers` (`acceptTransfer`); `/send`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Wal03Input` = transfer amount/fee, available balance and command identity; output `Wal03Output` = atomic available→reserved→principal/fee or release. Additional errors: INSUFFICIENT_FUNDS; shared M2 errors apply.
* **DB:** `journals`, `liquidity_reservations`; ordered account locks, no negative balance, atomic transfer reservation. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-WAL-03` — Two simultaneous spends cannot overdraw; PACK-MONEY, PACK-FINANCE, PACK-API; REQ-SC-02, REQ-SC-05, REQ-SC-07, REQ-SC-08, REQ-SC-09, REQ-SC-11, REQ-SC-15 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `wallet_reservation_conflict` plus M2 trace/audit; alert/runbook owned by Wallet/ledger engineer.
* **Rollback:** RB-MONEY. **Evidence:** EV(T-WAL-03) with `TEST-WAL-03` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-WAL-04 — Quoted wallet conversion

* **Objective:** deliver `KITA-WAL-04` end to end: Four currency legs balance and exact target obligation is funded. **Role / estimate:** Wallet/ledger engineer (Qoder GPU; Sol review); 5 person-days.
* **Deps:** T-WAL-01, T-QUOTE-02, T-FIN-06; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/wallets/convert-wallet.ts; tests/features/test-wal-04.spec.ts; apps/workers/src/wallets/convert-wallet.worker.ts. **Change:** packages/contracts/src/wallets.ts; apps/api/src/customer/wallets.controller.ts; apps/customer-web/app/wallet/convert/page.tsx; apps/mobile/src/features/wallets.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `convertWallet(ctx: WorkerContext, input: Wal04Input): Promise<Result<Wal04Output>>`. **Wire / UI:** `POST /v1/wallets/conversions` (`createWalletConversion`); also owns `createWalletQuote`; `/wallet/convert`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Wal04Input` = owned accepted conversion quote and exact source/target currencies; output `Wal04Output` = quoted source debit and exact target obligation with trade evidence. Additional errors: INSUFFICIENT_FUNDS; PROVIDER_OUTCOME_UNKNOWN; shared M2 errors apply.
* **DB:** `quotes`, `journals`; four currency legs/bridges balance; no target availability from unconfirmed asset receipt. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-WAL-04` — Four currency legs balance and exact target obligation is funded; PACK-MONEY, PACK-FINANCE, PACK-API; REQ-SC-02, REQ-SC-05, REQ-SC-07, REQ-SC-08, REQ-SC-09, REQ-SC-11, REQ-SC-15 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `wallet_fx_unsettled_age` plus M2 trace/audit; alert/runbook owned by Wallet/ledger engineer.
* **Rollback:** RB-MONEY. **Evidence:** EV(T-WAL-04) with `TEST-WAL-04` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-WAL-05 — Wallet withdrawal/redemption/closure

* **Objective:** deliver `KITA-WAL-05` end to end: Failed refund retains obligation; closure cannot lose remaining funds. **Role / estimate:** Wallet/ledger engineer (Qoder GPU; Sol review); 5 person-days.
* **Deps:** T-WAL-01, T-TX-06; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/wallets/withdraw-wallet.ts; tests/features/test-wal-05.spec.ts; apps/workers/src/wallets/withdraw-wallet.worker.ts. **Change:** packages/contracts/src/wallets.ts; apps/api/src/customer/wallets.controller.ts; apps/customer-web/app/wallet/page.tsx; apps/mobile/src/features/wallets.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `withdrawWallet(ctx: WorkerContext, input: Wal05Input): Promise<Result<Wal05Output>>`. **Wire / UI:** `POST /v1/wallets/withdrawals` (`createWithdrawal`); `/wallet`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Wal05Input` = owned withdrawal/redemption/closure request and verified destination; output `Wal05Output` = payable/operation retained through failed/unknown refund. Additional errors: COMPLIANCE_HOLD; PROVIDER_OUTCOME_UNKNOWN; shared M2 errors apply.
* **DB:** `refund_obligations`, `provider_attempts`; account restriction preserves lawful redemption entitlement; closure cannot orphan balance. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-WAL-05` — Failed refund retains obligation; closure cannot lose remaining funds; PACK-MONEY, PACK-FINANCE, PACK-API; REQ-SC-02, REQ-SC-05, REQ-SC-07, REQ-SC-08, REQ-SC-09, REQ-SC-11, REQ-SC-15 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `withdrawal_overdue_count` plus M2 trace/audit; alert/runbook owned by Wallet/ledger engineer.
* **Rollback:** RB-MONEY. **Evidence:** EV(T-WAL-05) with `TEST-WAL-05` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-WAL-06 — Same-book wallet P2P

* **Objective:** deliver `KITA-WAL-06` end to end: Both parties screened; cross-book unsupported without settlement policy. **Role / estimate:** Wallet/ledger engineer (Qoder GPU; Sol review); 4 person-days.
* **Deps:** T-WAL-01, T-KYC-04; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/wallets/transfer-wallet.ts; tests/features/test-wal-06.spec.ts; apps/workers/src/wallets/transfer-wallet.worker.ts. **Change:** packages/contracts/src/wallets.ts; apps/api/src/customer/wallets.controller.ts; apps/customer-web/app/wallet/send/page.tsx; apps/mobile/src/features/wallets.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `transferWallet(ctx: WorkerContext, input: Wal06Input): Promise<Result<Wal06Output>>`. **Wire / UI:** `POST /v1/wallets/transfers` (`createWalletTransfer`); `/wallet/send`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Wal06Input` = same-book sender/recipient, same currency, amount and consent; output `Wal06Output` = atomic sender available debit/recipient pending credit then release. Additional errors: CAPABILITY_UNAVAILABLE; INSUFFICIENT_FUNDS; shared M2 errors apply.
* **DB:** `journals`, `screenings`; screen both sides/limits; cross-book needs separate settlement policy and stays disabled. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-WAL-06` — Both parties screened; cross-book unsupported without settlement policy; PACK-MONEY, PACK-FINANCE, PACK-API; REQ-SC-02, REQ-SC-05, REQ-SC-07, REQ-SC-08, REQ-SC-09, REQ-SC-11, REQ-SC-15 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `wallet_p2p_denial` plus M2 trace/audit; alert/runbook owned by Wallet/ledger engineer.
* **Rollback:** RB-MONEY. **Evidence:** EV(T-WAL-06) with `TEST-WAL-06` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-GROW-01 — Points earn/vest/reverse

* **Objective:** deliver `KITA-GROW-01` end to end: Duplicate payout callback awards once. **Role / estimate:** Growth full-stack engineer (Qoder GPU; Sol review); 4 person-days.
* **Deps:** T-REWARD-01, T-TX-02, T-PLAT-05; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/rewards/vest-points.ts; tests/features/test-grow-01.spec.ts; apps/workers/src/rewards/vest-points.worker.ts. **Change:** packages/contracts/src/rewards.ts; apps/api/src/customer/rewards.controller.ts; apps/customer-web/app/rewards/page.tsx; apps/mobile/src/features/rewards.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `vestPoints(ctx: WorkerContext, input: Grow01Input): Promise<Result<Grow01Output>>`. **Wire / UI:** `GET /v1/points` (`getPoints`); `/rewards`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Grow01Input` = qualified delivery/source valuation, policy version and return status; output `Grow01Output` = one pending earn, timed vest or linked reversal/debt. Additional errors: POLICY_UNAVAILABLE; shared M2 errors apply.
* **DB:** `point_lots`, `point_events`; unique source/rule event; P1 vest/expiry timers and provision linkage. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-GROW-01` — Duplicate payout callback awards once; PACK-REWARDS, PACK-AUTOMATION, PACK-UX; REQ-SC-01, REQ-SC-02, REQ-SC-05, REQ-SC-06, REQ-SC-18 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `reward_vesting_lag` plus M2 trace/audit; alert/runbook owned by Growth full-stack engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-GROW-01) with `TEST-GROW-01` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-GROW-02 — Points FIFO reserve/redeem/expiry

* **Objective:** deliver `KITA-GROW-02` end to end: Concurrent redemption/expiry cannot overspend lot. **Role / estimate:** Growth full-stack engineer (Qoder GPU; Sol review); 4 person-days.
* **Deps:** T-REWARD-01; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/rewards/reserve-points.ts; tests/features/test-grow-02.spec.ts; apps/workers/src/rewards/reserve-points.worker.ts. **Change:** packages/contracts/src/rewards.ts; apps/api/src/customer/rewards.controller.ts; apps/customer-web/app/rewards/page.tsx; apps/mobile/src/features/rewards.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `reservePoints(ctx: WorkerContext, input: Grow02Input): Promise<Result<Grow02Output>>`. **Wire / UI:** `POST /v1/points/reservations` (`reservePoints`); `/rewards`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Grow02Input` = fee-discount units, vested lots, quote expiry and command identity; output `Grow02Output` = FIFO reservation/consume/release/expiry with remaining units. Additional errors: INSUFFICIENT_FUNDS; shared M2 errors apply.
* **DB:** `point_events`, `reward_reservations`; lock earliest-expiry/id lots; expire only unreserved; never convert units to fiat cash. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-GROW-02` — Concurrent redemption/expiry cannot overspend lot; PACK-REWARDS, PACK-AUTOMATION, PACK-UX; REQ-SC-01, REQ-SC-02, REQ-SC-05, REQ-SC-06, REQ-SC-18 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `points_reservation_conflict` plus M2 trace/audit; alert/runbook owned by Growth full-stack engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-GROW-02) with `TEST-GROW-02` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-GROW-03 — Promo budget and eligibility

* **Objective:** deliver `KITA-GROW-03` end to end: Last budget unit reserved by one transfer only. **Role / estimate:** Growth full-stack engineer (Qoder GPU; Sol review); 4 person-days.
* **Deps:** T-REWARD-01, T-QUOTE-03; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/rewards/reserve-promotion.ts; tests/features/test-grow-03.spec.ts; apps/workers/src/rewards/reserve-promotion.worker.ts. **Change:** packages/contracts/src/rewards.ts; apps/api/src/customer/rewards.controller.ts; apps/customer-web/app/send/page.tsx; apps/mobile/src/features/rewards.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `reservePromotion(ctx: WorkerContext, input: Grow03Input): Promise<Result<Grow03Output>>`. **Wire / UI:** `POST /v1/promotions/validations` (`validatePromotion`); `/send`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Grow03Input` = campaign code, eligibility, budget/caps and quote; output `Grow03Output` = conditional validation then atomic accepted promotion reservation. Additional errors: LIMIT_EXCEEDED; shared M2 errors apply.
* **DB:** `campaigns`, `reward_reservations`; campaign budget/customer/device/instrument/recipient caps; one code OR points; exact subsidy. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-GROW-03` — Last budget unit reserved by one transfer only; PACK-REWARDS, PACK-AUTOMATION, PACK-UX; REQ-SC-01, REQ-SC-02, REQ-SC-05, REQ-SC-06, REQ-SC-18 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `promotion_budget_remaining` plus M2 trace/audit; alert/runbook owned by Growth full-stack engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-GROW-03) with `TEST-GROW-03` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-GROW-04 — Referral antiabuse qualified reward

* **Objective:** deliver `KITA-GROW-04` end to end: Self-referral blocked and household signal reviewed. **Role / estimate:** Growth full-stack engineer (Qoder GPU; Sol review); 4 person-days.
* **Deps:** T-GROW-01, T-KYC-06; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/rewards/qualify-referral.ts; tests/features/test-grow-04.spec.ts; apps/workers/src/rewards/qualify-referral.worker.ts. **Change:** packages/contracts/src/rewards.ts; apps/api/src/customer/rewards.controller.ts; apps/customer-web/app/referrals/page.tsx; apps/mobile/src/features/rewards.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `qualifyReferral(ctx: WorkerContext, input: Grow04Input): Promise<Result<Grow04Output>>`. **Wire / UI:** `POST /v1/referrals` (`createReferral`); `/referrals`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Grow04Input` = referrer/referee and qualifying first transfer evidence; output `Grow04Output` = qualified pending points or antiabuse review/rejection. Additional errors: LIMIT_EXCEEDED; shared M2 errors apply.
* **DB:** `referrals`, `point_lots`; one referrer, no self-referral; policy monthly cap and household review; no false accusation. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-GROW-04` — Self-referral blocked and household signal reviewed; PACK-REWARDS, PACK-AUTOMATION, PACK-UX; REQ-SC-01, REQ-SC-02, REQ-SC-05, REQ-SC-06, REQ-SC-18 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `referral_review_age` plus M2 trace/audit; alert/runbook owned by Growth full-stack engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-GROW-04) with `TEST-GROW-04` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-GROW-05 — Rate alert threshold/cooldown

* **Objective:** deliver `KITA-GROW-05` end to end: Oscillating or stale rate does not spam or execute money. **Role / estimate:** Growth full-stack engineer (Qoder GPU; Sol review); 3 person-days.
* **Deps:** T-QUOTE-04, T-PLAT-05; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/rate-alerts/evaluate-alerts.ts; tests/features/test-grow-05.spec.ts; apps/workers/src/rate-alerts/evaluate-alerts.worker.ts. **Change:** packages/contracts/src/rate-alerts.ts; apps/api/src/customer/rate-alerts.controller.ts; apps/customer-web/app/alerts/page.tsx; apps/mobile/src/features/rate-alerts.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `evaluateAlerts(ctx: WorkerContext, input: Grow05Input): Promise<Result<Grow05Output>>`. **Wire / UI:** `POST /v1/rate-alerts` (`createRateAlert`); also owns `listRateAlerts`, `pauseRateAlert`; `/alerts`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Grow05Input` = pair/basis/threshold/channel, fresh snapshots and prior trigger; output `Grow05Output` = one informational crossing event, cooldown/rearm/expiry. Additional errors: RATE_STALE; shared M2 errors apply.
* **DB:** `rate_alerts`, `notifications`; dedup alert+snapshot, max active limits; no spend authority. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-GROW-05` — Oscillating or stale rate does not spam or execute money; PACK-REWARDS, PACK-AUTOMATION, PACK-UX; REQ-SC-01, REQ-SC-02, REQ-SC-05, REQ-SC-06, REQ-SC-18 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `rate_alert_suppressed` plus M2 trace/audit; alert/runbook owned by Growth full-stack engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-GROW-05) with `TEST-GROW-05` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-GROW-06 — Explicit auto-conversion mandate

* **Objective:** deliver `KITA-GROW-06` end to end: Revocation race serializes before conversion reservation. **Role / estimate:** Growth full-stack engineer (Qoder GPU; Sol review); 6 person-days.
* **Deps:** T-WAL-04, T-GROW-05, T-PLAT-05; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/schedules/execute-auto-conversion.ts; tests/features/test-grow-06.spec.ts; apps/workers/src/schedules/execute-auto-conversion.worker.ts. **Change:** packages/contracts/src/schedules.ts; apps/api/src/customer/schedules.controller.ts; apps/customer-web/app/auto-conversions/page.tsx; apps/mobile/src/features/schedules.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `executeAutoConversion(ctx: WorkerContext, input: Grow06Input): Promise<Result<Grow06Output>>`. **Wire / UI:** `POST /v1/auto-conversions` (`createAutoConversion`); `/auto-conversions`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Grow06Input` = explicit one-shot mandate, rate/fee/amount/count/expiry bounds and revoke version; output `Grow06Output` = one bounded conversion or armed/paused/revoked result. Additional errors: COMPLIANCE_HOLD; INSUFFICIENT_FUNDS; shared M2 errors apply.
* **DB:** `schedules`, `schedule_runs`; lock mandate and funds; fresh quote; unique operation; unknown retains execution; consent/receipt. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-GROW-06` — Revocation race serializes before conversion reservation; PACK-REWARDS, PACK-AUTOMATION, PACK-UX; REQ-SC-01, REQ-SC-02, REQ-SC-05, REQ-SC-06, REQ-SC-18 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `auto_conversion_bound_denial` plus M2 trace/audit; alert/runbook owned by Growth full-stack engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-GROW-06) with `TEST-GROW-06` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-GROW-07 — Push/email/SMS service notifications

* **Objective:** deliver `KITA-GROW-07` end to end: Duplicate event gives one intended message per channel. **Role / estimate:** Growth full-stack engineer (Qoder GPU; Sol review); 4 person-days.
* **Deps:** T-PLAT-03, T-ADAPTER-01; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/notifications/send-notification.ts; tests/features/test-grow-07.spec.ts; apps/workers/src/notifications/send-notification.worker.ts; packages/providers/notifications/adapter.ts. **Change:** packages/contracts/src/notifications.ts; apps/api/src/customer/notifications.controller.ts; apps/customer-web/app/profile/notifications/page.tsx; apps/mobile/src/features/notifications.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `sendNotification(ctx: WorkerContext, input: Grow07Input): Promise<Result<Grow07Output>>`. **Wire / UI:** `PUT /v1/notification-preferences` (`updateNotificationPreferences`); `/profile/notifications`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Grow07Input` = domain event, template/locale/channel, destination token and consent; output `Grow07Output` = deduped notification submission/status. Additional errors: CAPABILITY_UNAVAILABLE; shared M2 errors apply.
* **DB:** `notifications`, `outbox`; event/customer/template/channel unique; unknown vendor status queried, no duplicate success. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-GROW-07` — Duplicate event gives one intended message per channel; PACK-REWARDS, PACK-AUTOMATION, PACK-UX; REQ-SC-01, REQ-SC-02, REQ-SC-05, REQ-SC-06, REQ-SC-18 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `notification_submission_latency` plus M2 trace/audit; alert/runbook owned by Growth full-stack engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-GROW-07) with `TEST-GROW-07` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-GROW-08 — Consent/quiet hours/unsubscribe

* **Objective:** deliver `KITA-GROW-08` end to end: Marketing opt-out suppresses campaign but preserves necessary service notices. **Role / estimate:** Growth full-stack engineer (Qoder GPU; Sol review); 3 person-days.
* **Deps:** T-IDENTITY-01, T-GROW-07; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/notifications/apply-communication-consent.ts; tests/features/test-grow-08.spec.ts; apps/workers/src/notifications/apply-communication-consent.worker.ts. **Change:** packages/contracts/src/notifications.ts; apps/api/src/customer/notifications.controller.ts; apps/customer-web/app/profile/notifications/page.tsx; apps/mobile/src/features/notifications.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `applyCommunicationConsent(ctx: WorkerContext, input: Grow08Input): Promise<Result<Grow08Output>>`. **Wire / UI:** `PUT /v1/notification-preferences` (`updateNotificationPreferences`); `/profile/notifications`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Grow08Input` = category consent, unsubscribe token, locale/timezone quiet hours; output `Grow08Output` = versioned preferences and suppressed/queued/permitted delivery. Additional errors: VERSION_CONFLICT; shared M2 errors apply.
* **DB:** `consents`, `notifications`; marketing opt-out does not suppress necessary lawful service notices; audit consent source. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-GROW-08` — Marketing opt-out suppresses campaign but preserves necessary service notices; PACK-REWARDS, PACK-AUTOMATION, PACK-UX; REQ-SC-01, REQ-SC-02, REQ-SC-05, REQ-SC-06, REQ-SC-18 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `notification_consent_denial` plus M2 trace/audit; alert/runbook owned by Growth full-stack engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-GROW-08) with `TEST-GROW-08` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-GROW-09 — Reward statements and unit economics

* **Objective:** deliver `KITA-GROW-09` end to end: Issued/vested/redeemed/expired totals reconcile to provision. **Role / estimate:** Growth full-stack engineer (Qoder GPU; Sol review); 3 person-days.
* **Deps:** T-GROW-01, T-GROW-02, T-FIN-07; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/rewards/report-reward-liability.ts; tests/features/test-grow-09.spec.ts; apps/workers/src/rewards/report-reward-liability.worker.ts. **Change:** packages/contracts/src/rewards.ts; apps/api/src/customer/rewards.controller.ts; apps/customer-web/app/rewards/page.tsx; apps/mobile/src/features/rewards.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `reportRewardLiability(ctx: WorkerContext, input: Grow09Input): Promise<Result<Grow09Output>>`. **Wire / UI:** `GET /v1/reward-events` (`listRewardEvents`); `/rewards`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Grow09Input` = point/provision ledger, campaign cost and snapshot/as-of; output `Grow09Output` = reconciled rewards statement and unit economics. Additional errors: VERSION_CONFLICT; shared M2 errors apply.
* **DB:** `point_events`, `journals`; issued/vested/reserved/redeemed/expired/debt reconcile; no fiat balance implication. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-GROW-09` — Issued/vested/redeemed/expired totals reconcile to provision; PACK-REWARDS, PACK-AUTOMATION, PACK-UX; REQ-SC-01, REQ-SC-02, REQ-SC-05, REQ-SC-06, REQ-SC-18 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `reward_provision_drift` plus M2 trace/audit; alert/runbook owned by Growth full-stack engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-GROW-09) with `TEST-GROW-09` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-ADM-01 — Workforce SSO granular scoped access

* **Objective:** deliver `KITA-ADM-01` end to end: Customer token and unrelated entity denied. **Role / estimate:** Admin/security full-stack engineer (Qoder GPU; Sol review); 4 person-days.
* **Deps:** T-IDENTITY-01; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/admin/authorize-staff.ts; tests/features/test-adm-01.spec.ts. **Change:** packages/contracts/src/admin.ts; apps/api/src/admin/admin.controller.ts; apps/admin-web/app/login/page.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `authorizeStaff(ctx: CommandContext, input: Adm01Input): Promise<Result<Adm01Output>>`. **Wire / UI:** `POST /admin/v1/auth/sessions` (`createAdminSession`); `admin/login`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Adm01Input` = workforce OIDC identity, personId, entity/action/value scope and assurance; output `Adm01Output` = default-deny scoped staff context/session. Additional errors: APPROVAL_REQUIRED; shared M2 errors apply.
* **DB:** `staff_people`, `staff_grants`; staff identities map stable person; separate customer/admin audiences and no owner auto-admin. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-ADM-01` — Customer token and unrelated entity denied; PACK-ADMIN, PACK-SECURITY, PACK-API; REQ-SC-04, REQ-SC-11, REQ-SC-12, REQ-SC-14, REQ-SC-15, REQ-SC-16, REQ-SC-17, REQ-SC-19, REQ-SC-21 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `staff_authorization_denial` plus M2 trace/audit; alert/runbook owned by Admin/security full-stack engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-ADM-01) with `TEST-ADM-01` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-ADM-02 — Real-time queues filters assignment

* **Objective:** deliver `KITA-ADM-02` end to end: Paginated queue shows deadlines and freshness. **Role / estimate:** Admin/security full-stack engineer (Qoder GPU; Sol review); 4 person-days.
* **Deps:** T-ADM-01, T-TX-02; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/admin/query-ops-queue.ts; tests/features/test-adm-02.spec.ts. **Change:** packages/contracts/src/admin.ts; apps/api/src/admin/admin.controller.ts; apps/admin-web/app/transfers/page.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `queryOpsQueue(ctx: ReadContext, input: Adm02Input): Promise<Result<Adm02Output>>`. **Wire / UI:** `GET /admin/v1/transfers` (`listAdminTransfers`); also owns `getAdminTransfer`, `assignCase`; `admin/transfers`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Adm02Input` = permitted filters/cursor/as-of, assignment and expectedVersion; output `Adm02Output` = fresh paginated queue/detail/deadlines and allowed actions. Additional errors: VERSION_CONFLICT; shared M2 errors apply.
* **DB:** `transfers`, `cases`; read scope and assignment history; projections never confer mutation rights. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-ADM-02` — Paginated queue shows deadlines and freshness; PACK-ADMIN, PACK-SECURITY, PACK-API; REQ-SC-04, REQ-SC-11, REQ-SC-12, REQ-SC-14, REQ-SC-15, REQ-SC-16, REQ-SC-17, REQ-SC-19, REQ-SC-21 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `ops_queue_freshness` plus M2 trace/audit; alert/runbook owned by Admin/security full-stack engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-ADM-02) with `TEST-ADM-02` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-ADM-03 — Safe hold/resume

* **Objective:** deliver `KITA-ADM-03` end to end: Hold before dispatch wins; after dispatch recorded in-flight. **Role / estimate:** Admin/security full-stack engineer (Qoder GPU; Sol review); 4 person-days.
* **Deps:** T-ADM-01, T-CORE-02; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/admin/set-hold.ts; tests/features/test-adm-03.spec.ts. **Change:** packages/contracts/src/admin.ts; apps/api/src/admin/admin.controller.ts; apps/admin-web/app/transfers/page.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `setHold(ctx: CommandContext, input: Adm03Input): Promise<Result<Adm03Output>>`. **Wire / UI:** `POST /admin/v1/transfers/{id}/holds` (`createHold`); also owns `resolveHold`; `admin/transfers`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Adm03Input` = hold scope/reason, transfer or subject, resolver and evidence; output `Adm03Output` = additive hold or specific resolution; in-flight warning. Additional errors: COMPLIANCE_HOLD; VERSION_CONFLICT; shared M2 errors apply.
* **DB:** `holds`, `transfer_events`; same dispatch lock; clearing one cannot clear other holds; subject scopes enforced. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-ADM-03` — Hold before dispatch wins; after dispatch recorded in-flight; PACK-ADMIN, PACK-SECURITY, PACK-API; REQ-SC-04, REQ-SC-11, REQ-SC-12, REQ-SC-14, REQ-SC-15, REQ-SC-16, REQ-SC-17, REQ-SC-19, REQ-SC-21 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `hold_inflight_count` plus M2 trace/audit; alert/runbook owned by Admin/security full-stack engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-ADM-03) with `TEST-ADM-03` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-ADM-04 — Manual KYC/AML review/RFI

* **Objective:** deliver `KITA-ADM-04` end to end: Unqualified role cannot override blocked-property restriction. **Role / estimate:** Admin/security full-stack engineer (Qoder GPU; Sol review); 4 person-days.
* **Deps:** T-ADM-01, T-KYC-02, T-KYC-07; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/admin/decide-case.ts; tests/features/test-adm-04.spec.ts. **Change:** packages/contracts/src/admin.ts; apps/api/src/admin/admin.controller.ts; apps/admin-web/app/compliance/page.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `decideCase(ctx: CommandContext, input: Adm04Input): Promise<Result<Adm04Output>>`. **Wire / UI:** `POST /admin/v1/cases/{id}/decisions` (`decideCase`); also owns `listAdminCases`; `admin/compliance`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Adm04Input` = assigned case/evidence, approved decision/policy and expectedVersion; output `Adm04Output` = append-only KYC/AML/RFI decision and scoped workflow effect. Additional errors: APPROVAL_REQUIRED; shared M2 errors apply.
* **DB:** `cases`, `identity_decisions`; qualified reviewer and independent high-risk control; no sanctions override. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-ADM-04` — Unqualified role cannot override blocked-property restriction; PACK-ADMIN, PACK-SECURITY, PACK-API; REQ-SC-04, REQ-SC-11, REQ-SC-12, REQ-SC-14, REQ-SC-15, REQ-SC-16, REQ-SC-17, REQ-SC-19, REQ-SC-21 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `manual_review_deadline` plus M2 trace/audit; alert/runbook owned by Admin/security full-stack engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-ADM-04) with `TEST-ADM-04` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-ADM-05 — Person-level maker-checker and expiry

* **Objective:** deliver `KITA-ADM-05` end to end: Second login of same person cannot approve. **Role / estimate:** Admin/security full-stack engineer (Qoder GPU; Sol review); 5 person-days.
* **Deps:** T-ADM-01; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/admin/decide-approval.ts; tests/features/test-adm-05.spec.ts. **Change:** packages/contracts/src/admin.ts; apps/api/src/admin/admin.controller.ts; apps/admin-web/app/approvals/page.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `decideApproval(ctx: CommandContext, input: Adm05Input): Promise<Result<Adm05Output>>`. **Wire / UI:** `POST /admin/v1/approvals/{id}/decisions` (`decideApproval`); also owns `listApprovals`, `executeApproval`; `admin/approvals`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Adm05Input` = approval payload/hash, target version, requester/checker person and expiry; output `Adm05Output` = single approved/rejected/invalidated/consumed command authority. Additional errors: APPROVAL_STALE; shared M2 errors apply.
* **DB:** `approvals`, `approval_decisions`; stable person prevents two-login self-approval; execution rechecks current grants/holds. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-ADM-05` — Second login of same person cannot approve; PACK-ADMIN, PACK-SECURITY, PACK-API; REQ-SC-04, REQ-SC-11, REQ-SC-12, REQ-SC-14, REQ-SC-15, REQ-SC-16, REQ-SC-17, REQ-SC-19, REQ-SC-21 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `approval_stale_denial` plus M2 trace/audit; alert/runbook owned by Admin/security full-stack engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-ADM-05) with `TEST-ADM-05` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-ADM-06 — Refund/reroute/adjustment requests

* **Objective:** deliver `KITA-ADM-06` end to end: Stale payload and unauthorized accounts fail. **Role / estimate:** Admin/security full-stack engineer (Qoder GPU; Sol review); 4 person-days.
* **Deps:** T-ADM-05, T-LEDGER-02; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/admin/request-adjustment.ts; tests/features/test-adm-06.spec.ts. **Change:** packages/contracts/src/admin.ts; apps/api/src/admin/admin.controller.ts; apps/admin-web/app/transfers/page.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `requestAdjustment(ctx: CommandContext, input: Adm06Input): Promise<Result<Adm06Output>>`. **Wire / UI:** `POST /admin/v1/adjustment-requests` (`createAdjustmentRequest`); `admin/transfers`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Adm06Input` = typed refund/reroute/correction request, evidence and reason; output `Adm06Output` = reviewable bound approval; execute only through normal command. Additional errors: APPROVAL_REQUIRED; PROVIDER_OUTCOME_UNKNOWN; shared M2 errors apply.
* **DB:** `approvals`, `journals`; no arbitrary accounts/lines/balance patch; entitlement and original journal links. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-ADM-06` — Stale payload and unauthorized accounts fail; PACK-ADMIN, PACK-SECURITY, PACK-API; REQ-SC-04, REQ-SC-11, REQ-SC-12, REQ-SC-14, REQ-SC-15, REQ-SC-16, REQ-SC-17, REQ-SC-19, REQ-SC-21 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `adjustment_request_reject` plus M2 trace/audit; alert/runbook owned by Admin/security full-stack engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-ADM-06) with `TEST-ADM-06` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-ADM-07 — Evidence-only manual completion

* **Objective:** deliver `KITA-ADM-07` end to end: No manual paid result without verified evidence and reviewer. **Role / estimate:** Admin/security full-stack engineer (Qoder GPU; Sol review); 4 person-days.
* **Deps:** T-ADM-05, T-PLAT-04; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/admin/ingest-manual-evidence.ts; tests/features/test-adm-07.spec.ts. **Change:** packages/contracts/src/admin.ts; apps/api/src/admin/admin.controller.ts; apps/admin-web/app/transfers/page.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `ingestManualEvidence(ctx: CommandContext, input: Adm07Input): Promise<Result<Adm07Output>>`. **Wire / UI:** `POST /admin/v1/provider-evidence` (`submitProviderEvidence`); `admin/transfers`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Adm07Input` = independent verified provider evidence, amount/currency/destination; output `Adm07Output` = reviewed evidence intake then normal reducer result. Additional errors: APPROVAL_REQUIRED; shared M2 errors apply.
* **DB:** `evidence`, `provider_attempts`; manual evidence cannot set paid directly; same evidence mapping/idempotency and journal policy. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-ADM-07` — No manual paid result without verified evidence and reviewer; PACK-ADMIN, PACK-SECURITY, PACK-API; REQ-SC-04, REQ-SC-11, REQ-SC-12, REQ-SC-14, REQ-SC-15, REQ-SC-16, REQ-SC-17, REQ-SC-19, REQ-SC-21 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `manual_evidence_rejection` plus M2 trace/audit; alert/runbook owned by Admin/security full-stack engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-ADM-07) with `TEST-ADM-07` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-ADM-08 — Pricing/routing/limit campaign releases

* **Objective:** deliver `KITA-ADM-08` end to end: Existing quote unchanged and new quote uses approved effective version. **Role / estimate:** Admin/security full-stack engineer (Qoder GPU; Sol review); 5 person-days.
* **Deps:** T-ADM-05, T-QUOTE-03; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/admin/release-policy.ts; tests/features/test-adm-08.spec.ts. **Change:** packages/contracts/src/admin.ts; apps/api/src/admin/admin.controller.ts; apps/admin-web/app/configuration/page.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `releasePolicy(ctx: CommandContext, input: Adm08Input): Promise<Result<Adm08Output>>`. **Wire / UI:** `POST /admin/v1/configuration-releases` (`createConfigRelease`); also owns `listConfigVersions`, `simulatePricing`; `admin/configuration`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Adm08Input` = draft pricing/routes/limit/campaign policy, simulations and effective date; output `Adm08Output` = approved effective release and forward rollback version. Additional errors: APPROVAL_STALE; POLICY_UNAVAILABLE; shared M2 errors apply.
* **DB:** `policies`, `approvals`; immutable versioned policy; no rewrite accepted quote; staged exposure and audit. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-ADM-08` — Existing quote unchanged and new quote uses approved effective version; PACK-ADMIN, PACK-SECURITY, PACK-API; REQ-SC-04, REQ-SC-11, REQ-SC-12, REQ-SC-14, REQ-SC-15, REQ-SC-16, REQ-SC-17, REQ-SC-19, REQ-SC-21 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `policy_release_failure` plus M2 trace/audit; alert/runbook owned by Admin/security full-stack engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-ADM-08) with `TEST-ADM-08` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-ADM-09 — PII reveal/export permission

* **Objective:** deliver `KITA-ADM-09` end to end: Reveal step-up/reason/audit and expiry enforced. **Role / estimate:** Admin/security full-stack engineer (Qoder GPU; Sol review); 4 person-days.
* **Deps:** T-ADM-01, T-KYC-03; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/admin/reveal-pii.ts; tests/features/test-adm-09.spec.ts. **Change:** packages/contracts/src/admin.ts; apps/api/src/admin/admin.controller.ts; apps/admin-web/app/customers/page.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `revealPii(ctx: CommandContext, input: Adm09Input): Promise<Result<Adm09Output>>`. **Wire / UI:** `POST /admin/v1/customers/{id}/pii-reveals` (`requestPiiReveal`); `admin/customers`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Adm09Input` = PII target, purpose/reason, fresh step-up and export scope; output `Adm09Output` = masked-by-default timed reveal/export link. Additional errors: APPROVAL_REQUIRED; shared M2 errors apply.
* **DB:** `audit_events`, `documents`; ≤60s signed document grants; scoped purpose, watermark and immutable audit; no broad PII permission. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-ADM-09` — Reveal step-up/reason/audit and expiry enforced; PACK-ADMIN, PACK-SECURITY, PACK-API; REQ-SC-04, REQ-SC-11, REQ-SC-12, REQ-SC-14, REQ-SC-15, REQ-SC-16, REQ-SC-17, REQ-SC-19, REQ-SC-21 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `pii_reveal_anomaly` plus M2 trace/audit; alert/runbook owned by Admin/security full-stack engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-ADM-09) with `TEST-ADM-09` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-ADM-10 — Staff grant/revoke/access reviews

* **Objective:** deliver `KITA-ADM-10` end to end: Revoked approver cannot execute queued request. **Role / estimate:** Admin/security full-stack engineer (Qoder GPU; Sol review); 4 person-days.
* **Deps:** T-ADM-05; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/admin/change-access.ts; tests/features/test-adm-10.spec.ts. **Change:** packages/contracts/src/admin.ts; apps/api/src/admin/admin.controller.ts; apps/admin-web/app/access/page.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `changeAccess(ctx: CommandContext, input: Adm10Input): Promise<Result<Adm10Output>>`. **Wire / UI:** `POST /admin/v1/access-changes` (`requestAccessChange`); `admin/access`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Adm10Input` = staff person/scope/value grants or revocation, reason and approval; output `Adm10Output` = bounded active grants or immediate revocation with review record. Additional errors: APPROVAL_STALE; shared M2 errors apply.
* **DB:** `staff_grants`, `approvals`; recheck role at queued execution; no financial self-grant bypass; offboarding revokes sessions. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-ADM-10` — Revoked approver cannot execute queued request; PACK-ADMIN, PACK-SECURITY, PACK-API; REQ-SC-04, REQ-SC-11, REQ-SC-12, REQ-SC-14, REQ-SC-15, REQ-SC-16, REQ-SC-17, REQ-SC-19, REQ-SC-21 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `grant_revocation_lag` plus M2 trace/audit; alert/runbook owned by Admin/security full-stack engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-ADM-10) with `TEST-ADM-10` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-ADM-11 — Tamper-evident audit/WORM

* **Objective:** deliver `KITA-ADM-11` end to end: Concurrent hash anchors verified against independent archive. **Role / estimate:** Admin/security full-stack engineer (Qoder GPU; Sol review); 5 person-days.
* **Deps:** T-ADM-01, T-PLAT-03; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/admin/archive-audit.ts; tests/features/test-adm-11.spec.ts. **Change:** packages/contracts/src/admin.ts; apps/api/src/admin/admin.controller.ts; apps/admin-web/app/audit/page.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `archiveAudit(ctx: WorkerContext, input: Adm11Input): Promise<Result<Adm11Output>>`. **Wire / UI:** `GET /admin/v1/audit-events` (`listAuditEvents`); `admin/audit`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Adm11Input` = canonical audit event, book anchor, independent archive receipt; output `Adm11Output` = serialized hash chain and signed external root/verification report. Additional errors: archive unavailable; chain mismatch; shared M2 errors apply.
* **DB:** `audit_events`; append-only audit; locked per-book anchor; independent WORM retention/control. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-ADM-11` — Concurrent hash anchors verified against independent archive; PACK-ADMIN, PACK-SECURITY, PACK-API; REQ-SC-04, REQ-SC-11, REQ-SC-12, REQ-SC-14, REQ-SC-15, REQ-SC-16, REQ-SC-17, REQ-SC-19, REQ-SC-21 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `audit_archive_lag` plus M2 trace/audit; alert/runbook owned by Admin/security full-stack engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-ADM-11) with `TEST-ADM-11` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-ADM-12 — Emergency route/intake stops

* **Objective:** deliver `KITA-ADM-12` end to end: New commands stop but inquiries and legal remedies continue. **Role / estimate:** Admin/security full-stack engineer (Qoder GPU; Sol review); 3 person-days.
* **Deps:** T-ADM-05, T-CORE-02; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/admin/pause-route.ts; tests/features/test-adm-12.spec.ts. **Change:** packages/contracts/src/admin.ts; apps/api/src/admin/admin.controller.ts; apps/admin-web/app/routes/page.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `pauseRoute(ctx: CommandContext, input: Adm12Input): Promise<Result<Adm12Output>>`. **Wire / UI:** `POST /admin/v1/routes/{id}/pauses` (`pauseRoute`); also owns `requestRouteReenable`; `admin/routes`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Adm12Input` = route/intake scope, incident reason or independent reenable evidence; output `Adm12Output` = immediate stop or approved capped reenable. Additional errors: APPROVAL_REQUIRED; shared M2 errors apply.
* **DB:** `capabilities`, `holds`; deny new exposure while inquiry/returns/remedies continue under policy. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-ADM-12` — New commands stop but inquiries and legal remedies continue; PACK-ADMIN, PACK-SECURITY, PACK-API; REQ-SC-04, REQ-SC-11, REQ-SC-12, REQ-SC-14, REQ-SC-15, REQ-SC-16, REQ-SC-17, REQ-SC-19, REQ-SC-21 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `route_pause_effect_latency` plus M2 trace/audit; alert/runbook owned by Admin/security full-stack engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-ADM-12) with `TEST-ADM-12` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-FIN-01 — In-house immutable balanced ledger

* **Objective:** deliver `KITA-FIN-01` end to end: Empty/unbalanced/cross-currency/edited journal rejected. **Role / estimate:** Financial-systems engineer + Controller (Qoder GPU; Sol review); 5 person-days.
* **Deps:** T-LEDGER-02; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/ledger/post-business-event.ts; tests/features/test-fin-01.spec.ts; apps/workers/src/ledger/post-business-event.worker.ts. **Change:** packages/contracts/src/ledger.ts; apps/api/src/admin/ledger.controller.ts; apps/admin-web/app/ledger/page.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `postBusinessEvent(ctx: WorkerContext, input: Fin01Input): Promise<Result<Fin01Output>>`. **Wire / UI:** `GET /admin/v1/journals/{id}` (`getJournal`); `admin/ledger`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Fin01Input` = verified economic event, book, policy and stable event key; output `Fin01Output` = immutable balanced journal, same-key replay result. Additional errors: IDEMPOTENCY_MISMATCH; shared M2 errors apply.
* **DB:** `journals`, `journal_lines`; nonempty per-currency balance, append-only, evidence/book FKs, aggregate nonnegative checks. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-FIN-01` — Empty/unbalanced/cross-currency/edited journal rejected; PACK-MONEY, PACK-FINANCE; REQ-SC-05, REQ-SC-07, REQ-SC-08, REQ-SC-09, REQ-SC-10, REQ-SC-11, REQ-SC-19, REQ-SC-20 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `ledger_integrity_violation` plus M2 trace/audit; alert/runbook owned by Financial-systems engineer.
* **Rollback:** RB-MONEY. **Evidence:** EV(T-FIN-01) with `TEST-FIN-01` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-FIN-02 — Full/partial reversal allocation

* **Objective:** deliver `KITA-FIN-02` end to end: Cumulative partial fees sum exactly on final refund. **Role / estimate:** Financial-systems engineer + Controller (Qoder GPU; Sol review); 5 person-days.
* **Deps:** T-FIN-01; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/ledger/allocate-correction.ts; tests/features/test-fin-02.spec.ts; apps/workers/src/ledger/allocate-correction.worker.ts. **Change:** packages/contracts/src/ledger.ts; apps/api/src/admin/ledger.controller.ts; apps/admin-web/app/ledger/page.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `allocateCorrection(ctx: WorkerContext, input: Fin02Input): Promise<Result<Fin02Output>>`. **Wire / UI:** `POST /admin/v1/adjustment-requests` (`createAdjustmentRequest`); `admin/ledger`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Fin02Input` = original journal/entitlement, cumulative partial principal/fee/tax/cost; output `Fin02Output` = exact linked full reversal or capped partial correction. Additional errors: LIMIT_EXCEEDED; shared M2 errors apply.
* **DB:** `journals`, `refund_allocations`; unique full reversal; cumulative allocation and final remainder; no original edit. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-FIN-02` — Cumulative partial fees sum exactly on final refund; PACK-MONEY, PACK-FINANCE; REQ-SC-05, REQ-SC-07, REQ-SC-08, REQ-SC-09, REQ-SC-10, REQ-SC-11, REQ-SC-19, REQ-SC-20 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `refund_allocation_conflict` plus M2 trace/audit; alert/runbook owned by Financial-systems engineer.
* **Rollback:** RB-MONEY. **Evidence:** EV(T-FIN-02) with `TEST-FIN-02` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-FIN-03 — Three-way statement reconciliation

* **Objective:** deliver `KITA-FIN-03` end to end: Missing/duplicate/fee/FX/timing breaks classified. **Role / estimate:** Financial-systems engineer + Controller (Qoder GPU; Sol review); 6 person-days.
* **Deps:** T-FIN-01, T-ADAPTER-01; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/reconciliation/reconcile-statements.ts; tests/features/test-fin-03.spec.ts; apps/workers/src/reconciliation/reconcile-statements.worker.ts. **Change:** packages/contracts/src/reconciliation.ts; apps/api/src/admin/reconciliation.controller.ts; apps/admin-web/app/reconciliation/page.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `reconcileStatements(ctx: WorkerContext, input: Fin03Input): Promise<Result<Fin03Output>>`. **Wire / UI:** `POST /admin/v1/statements` (`importStatement`); `admin/reconciliation`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Fin03Input` = bank/provider statements, hash/parser/account/date and ledger movements; output `Fin03Output` = exact three-way matches or classified breaks. Additional errors: invalid statement; amount/currency conflict; shared M2 errors apply.
* **DB:** `statement_files`, `statement_lines`, `reconciliation_matches`; hash dedup, immutable lines, gross-net caps, opening+movement=closing; independent balance rebuild. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-FIN-03` — Missing/duplicate/fee/FX/timing breaks classified; PACK-MONEY, PACK-FINANCE; REQ-SC-05, REQ-SC-07, REQ-SC-08, REQ-SC-09, REQ-SC-10, REQ-SC-11, REQ-SC-19, REQ-SC-20 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `statement_completeness_lag` plus M2 trace/audit; alert/runbook owned by Financial-systems engineer.
* **Rollback:** RB-MONEY. **Evidence:** EV(T-FIN-03) with `TEST-FIN-03` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-FIN-04 — Break owner resolution/suspense

* **Objective:** deliver `KITA-FIN-04` end to end: Force match impossible; correction links approved journal. **Role / estimate:** Financial-systems engineer + Controller (Qoder GPU; Sol review); 4 person-days.
* **Deps:** T-FIN-03, T-ADM-05; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/reconciliation/resolve-break.ts; tests/features/test-fin-04.spec.ts; apps/workers/src/reconciliation/resolve-break.worker.ts. **Change:** packages/contracts/src/reconciliation.ts; apps/api/src/admin/reconciliation.controller.ts; apps/admin-web/app/reconciliation/page.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `resolveBreak(ctx: WorkerContext, input: Fin04Input): Promise<Result<Fin04Output>>`. **Wire / UI:** `POST /admin/v1/reconciliation-breaks/{id}/resolutions` (`resolveBreak`); also owns `listBreaks`; `admin/reconciliation`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Fin04Input` = break evidence, owner, SLA and typed resolution proposal; output `Fin04Output` = approved linked correction/match or open case with reason. Additional errors: APPROVAL_REQUIRED; shared M2 errors apply.
* **DB:** `reconciliation_breaks`, `cases`; no force match; zero-minor tolerance; preserve suspense until ownership proved. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-FIN-04` — Force match impossible; correction links approved journal; PACK-MONEY, PACK-FINANCE; REQ-SC-05, REQ-SC-07, REQ-SC-08, REQ-SC-09, REQ-SC-10, REQ-SC-11, REQ-SC-19, REQ-SC-20 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `unresolved_break_age` plus M2 trace/audit; alert/runbook owned by Financial-systems engineer.
* **Rollback:** RB-MONEY. **Evidence:** EV(T-FIN-04) with `TEST-FIN-04` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-FIN-05 — Liquidity reservation/prefund forecast

* **Objective:** deliver `KITA-FIN-05` end to end: Concurrent transfers cannot spend same last prefund. **Role / estimate:** Financial-systems engineer + Controller (Qoder GPU; Sol review); 5 person-days.
* **Deps:** T-LEDGER-02; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/treasury/reserve-liquidity.ts; tests/features/test-fin-05.spec.ts; apps/workers/src/treasury/reserve-liquidity.worker.ts. **Change:** packages/contracts/src/treasury.ts; apps/api/src/admin/treasury.controller.ts; apps/admin-web/app/treasury/page.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `reserveLiquidity(ctx: WorkerContext, input: Fin05Input): Promise<Result<Fin05Output>>`. **Wire / UI:** `GET /admin/v1/treasury-positions` (`getTreasuryPositions`); `admin/treasury`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Fin05Input` = pool/book/currency, principal+cost, buffer, confirmed provider balance; output `Fin05Output` = atomic liquidity/capital reservation and conservative position. Additional errors: LIQUIDITY_UNAVAILABLE; shared M2 errors apply.
* **DB:** `liquidity_reservations`, `account_balances`; min(eligible ledger, fresh reconciled provider balance) less reservations/buffer; pending cash excluded. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-FIN-05` — Concurrent transfers cannot spend same last prefund; PACK-MONEY, PACK-FINANCE; REQ-SC-05, REQ-SC-07, REQ-SC-08, REQ-SC-09, REQ-SC-10, REQ-SC-11, REQ-SC-19, REQ-SC-20 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `prefund_buffer_headroom` plus M2 trace/audit; alert/runbook owned by Financial-systems engineer.
* **Rollback:** RB-MONEY. **Evidence:** EV(T-FIN-05) with `TEST-FIN-05` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-FIN-06 — FX execution/netting/revaluation

* **Objective:** deliver `KITA-FIN-06` end to end: Trade allocations equal actual cost and no customer terms drift. **Role / estimate:** Financial-systems engineer + Controller (Qoder GPU; Sol review); 6 person-days.
* **Deps:** T-FIN-01, T-FIN-05, T-ADAPTER-01; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/treasury/allocate-fx-trade.ts; tests/features/test-fin-06.spec.ts; apps/workers/src/treasury/allocate-fx-trade.worker.ts. **Change:** packages/contracts/src/treasury.ts; apps/api/src/admin/treasury.controller.ts; apps/admin-web/app/treasury/page.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `allocateFxTrade(ctx: WorkerContext, input: Fin06Input): Promise<Result<Fin06Output>>`. **Wire / UI:** `POST /admin/v1/treasury-movement-requests` (`requestTreasuryMovement`); `admin/treasury`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Fin06Input` = accepted target obligations, executed trade evidence, net allocation and close rate; output `Fin06Output` = exact actual-cost allocations, settlement bridges and revaluation. Additional errors: PROVIDER_OUTCOME_UNKNOWN; shared M2 errors apply.
* **DB:** `treasury_movements`, `journals`; largest remainder allocation sums actual cost; corporate loss protects promise; no cross-book netting. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-FIN-06` — Trade allocations equal actual cost and no customer terms drift; PACK-MONEY, PACK-FINANCE; REQ-SC-05, REQ-SC-07, REQ-SC-08, REQ-SC-09, REQ-SC-10, REQ-SC-11, REQ-SC-19, REQ-SC-20 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `unsettled_fx_exposure` plus M2 trace/audit; alert/runbook owned by Financial-systems engineer.
* **Rollback:** RB-MONEY. **Evidence:** EV(T-FIN-06) with `TEST-FIN-06` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-FIN-07 — Safeguarding/close/GL/regulatory exports

* **Objective:** deliver `KITA-FIN-07` end to end: Closed period cannot receive unauthorized backdated posting. **Role / estimate:** Financial-systems engineer + Controller (Qoder GPU; Sol review); 6 person-days.
* **Deps:** T-FIN-03, T-FIN-04, T-FIN-06; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/ledger/close-period.ts; tests/features/test-fin-07.spec.ts; apps/workers/src/ledger/close-period.worker.ts. **Change:** packages/contracts/src/ledger.ts; apps/api/src/admin/ledger.controller.ts; apps/admin-web/app/reports/page.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `closePeriod(ctx: WorkerContext, input: Fin07Input): Promise<Result<Fin07Output>>`. **Wire / UI:** `POST /admin/v1/report-exports` (`createReportExport`); `admin/reports`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Fin07Input` = period/book/currency, bank/ledger balances, GL mapping and export scope; output `Fin07Output` = signed close, safeguarding/GL/regulatory/operating reports. Additional errors: APPROVAL_REQUIRED; shared M2 errors apply.
* **DB:** `journals`, `documents`; period locks/current-period late corrections; eligible assets classified; as-of reports read-only. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-FIN-07` — Closed period cannot receive unauthorized backdated posting; PACK-MONEY, PACK-FINANCE; REQ-SC-05, REQ-SC-07, REQ-SC-08, REQ-SC-09, REQ-SC-10, REQ-SC-11, REQ-SC-19, REQ-SC-20 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `customer_asset_shortfall` plus M2 trace/audit; alert/runbook owned by Financial-systems engineer.
* **Rollback:** RB-MONEY. **Evidence:** EV(T-FIN-07) with `TEST-FIN-07` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-FIN-08 — Refund/dispute overlap recovery

* **Objective:** deliver `KITA-FIN-08` end to end: No second automatic customer credit for same entitlement. **Role / estimate:** Financial-systems engineer + Controller (Qoder GPU; Sol review); 5 person-days.
* **Deps:** T-TX-06, T-FIN-02; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/ledger/resolve-credit-overlap.ts; tests/features/test-fin-08.spec.ts; apps/workers/src/ledger/resolve-credit-overlap.worker.ts. **Change:** packages/contracts/src/ledger.ts; apps/api/src/admin/ledger.controller.ts; apps/admin-web/app/disputes/page.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `resolveCreditOverlap(ctx: WorkerContext, input: Fin08Input): Promise<Result<Fin08Output>>`. **Wire / UI:** `POST /admin/v1/disputes/{id}/responses` (`createDisputeResponse`); `admin/disputes`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Fin08Input` = refund allocations, provisional/final dispute credits, remedy evidence; output `Fin08Output` = single entitlement decision or overlap case/recovery. Additional errors: PROVIDER_OUTCOME_UNKNOWN; shared M2 errors apply.
* **DB:** `disputes`, `refund_allocations`; serialize all known/unknown credits; actual duplicate credit becomes receivable/loss not negative wallet. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-FIN-08` — No second automatic customer credit for same entitlement; PACK-MONEY, PACK-FINANCE; REQ-SC-05, REQ-SC-07, REQ-SC-08, REQ-SC-09, REQ-SC-10, REQ-SC-11, REQ-SC-19, REQ-SC-20 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `credit_overlap_exposure` plus M2 trace/audit; alert/runbook owned by Financial-systems engineer.
* **Rollback:** RB-MONEY. **Evidence:** EV(T-FIN-08) with `TEST-FIN-08` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-PLAT-01 — Monorepo versions/contract freeze

* **Objective:** deliver `KITA-PLAT-01` end to end: Exact patched locks and no server secrets in client bundle. **Role / estimate:** Platform/SRE engineer (Qoder GPU; Sol review); 4 person-days.
* **Deps:** T-CONTRACT-01; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/platform/validate-build-baseline.ts; tests/features/test-plat-01.spec.ts; apps/workers/src/platform/validate-build-baseline.worker.ts; package.json; pnpm-workspace.yaml; pnpm-lock.yaml; packages/api-client/src/command-recovery.ts; packages/contracts/src/generated.ts; packages/eslint-config/index.js; packages/tsconfig/tsconfig.json. **Change:** packages/contracts/src/platform.ts; infra/terraform/main.tf; .github/workflows/ci.yml; docs/runbooks/platform.md. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `validateBuildBaseline(ctx: WorkerContext, input: Plat01Input): Promise<Result<Plat01Output>>`. **Wire / UI:** internal worker/tool; no customer HTTP mutation; `engineering`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Plat01Input` = reviewed manifests, exact patched versions, integrity/native peer evidence; output `Plat01Output` = reproducible monorepo lock, build and generated contract clients. Additional errors: unresolved version; compatibility/security failure; shared M2 errors apply.
* **DB:** `none`; no financial DB; separate web/native React peer sets; all pins verified before freeze accepted. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-PLAT-01` — Exact patched locks and no server secrets in client bundle; PACK-OPS, PACK-SECURITY, PACK-API; REQ-SC-01, REQ-SC-02, REQ-SC-03, REQ-SC-14, REQ-SC-15, REQ-SC-16, REQ-SC-19, REQ-SC-20, REQ-SC-21 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `build_dependency_drift` plus M2 trace/audit; alert/runbook owned by Platform/SRE engineer.
* **Rollback:** RB-PLATFORM. **Evidence:** EV(T-PLAT-01) with `TEST-PLAT-01` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-PLAT-02 — PostgreSQL migration from MySQL sandbox

* **Objective:** deliver `KITA-PLAT-02` end to end: Fresh install works and sandbox balances never become live cash. **Role / estimate:** Platform/SRE engineer (Qoder GPU; Sol review); 5 person-days.
* **Deps:** T-CORE-01; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/platform/migrate-core.ts; tests/features/test-plat-02.spec.ts; apps/workers/src/platform/migrate-core.worker.ts; packages/database/migrations/001_core.sql; packages/database/migrate.ts. **Change:** packages/contracts/src/platform.ts; infra/terraform/main.tf; .github/workflows/ci.yml; docs/runbooks/platform.md. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `migrateCore(ctx: WorkerContext, input: Plat02Input): Promise<Result<Plat02Output>>`. **Wire / UI:** internal worker/tool; no customer HTTP mutation; `engineering`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Plat02Input` = reviewed core DDL, checksum, target database and runtime roles; output `Plat02Output` = fresh/upgrade migration proof with no sandbox money import. Additional errors: migration checksum/permission/invariant failure; shared M2 errors apply.
* **DB:** `all core tables`; new PostgreSQL schema plus read-only source inventory; least-privilege grants and rollback-safe expand sequence. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-PLAT-02` — Fresh install works and sandbox balances never become live cash; PACK-OPS, PACK-SECURITY, PACK-API; REQ-SC-01, REQ-SC-02, REQ-SC-03, REQ-SC-14, REQ-SC-15, REQ-SC-16, REQ-SC-19, REQ-SC-20, REQ-SC-21 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `migration_failure_count` plus M2 trace/audit; alert/runbook owned by Platform/SRE engineer.
* **Rollback:** RB-PLATFORM. **Evidence:** EV(T-PLAT-02) with `TEST-PLAT-02` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-PLAT-03 — Outbox/inbox idempotent durable workers

* **Objective:** deliver `KITA-PLAT-03` end to end: Crash at every commit/send/ack boundary preserves one economic effect. **Role / estimate:** Platform/SRE engineer (Qoder GPU; Sol review); 5 person-days.
* **Deps:** T-CORE-02; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/platform/apply-event.ts; tests/features/test-plat-03.spec.ts; apps/workers/src/platform/apply-event.worker.ts. **Change:** packages/contracts/src/platform.ts; infra/terraform/main.tf; .github/workflows/ci.yml; docs/runbooks/platform.md. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `applyEvent(ctx: WorkerContext, input: Plat03Input): Promise<Result<Plat03Output>>`. **Wire / UI:** internal worker/tool; no customer HTTP mutation; `operations`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Plat03Input` = durable event/consumer identity and raw inbox/outbox envelope; output `Plat03Output` = atomic consume/apply and recoverable publication. Additional errors: IDEMPOTENCY_MISMATCH; shared M2 errors apply.
* **DB:** `outbox`, `inbox`, `consumer_inbox`; dedup business+delivery IDs, transactionally apply before ack; stable IDs survive DLQ/restart. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-PLAT-03` — Crash at every commit/send/ack boundary preserves one economic effect; PACK-OPS, PACK-SECURITY, PACK-API; REQ-SC-01, REQ-SC-02, REQ-SC-03, REQ-SC-14, REQ-SC-15, REQ-SC-16, REQ-SC-19, REQ-SC-20, REQ-SC-21 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `outbox_oldest_age` plus M2 trace/audit; alert/runbook owned by Platform/SRE engineer.
* **Rollback:** RB-PLATFORM. **Evidence:** EV(T-PLAT-03) with `TEST-PLAT-03` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-PLAT-04 — Provider webhook authentication/replay

* **Objective:** deliver `KITA-PLAT-04` end to end: Same ID changed body quarantined; invalid signature cannot post. **Role / estimate:** Platform/SRE engineer (Qoder GPU; Sol review); 4 person-days.
* **Deps:** T-ADAPTER-01, T-PLAT-03; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/platform/receive-webhook.ts; tests/features/test-plat-04.spec.ts; apps/workers/src/platform/receive-webhook.worker.ts. **Change:** packages/contracts/src/platform.ts; apps/api/src/webhooks/platform.controller.ts; infra/terraform/main.tf; .github/workflows/ci.yml; docs/runbooks/platform.md. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `receiveWebhook(ctx: WorkerContext, input: Plat04Input): Promise<Result<Plat04Output>>`. **Wire / UI:** `POST /webhooks/v1/{provider}/{accountId}` (`receiveWebhook`); `provider ingress`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Plat04Input` = exact raw callback bytes/headers, provider account and event ID; output `Plat04Output` = durable authenticated inbox acknowledgment or quarantine. Additional errors: invalid signature; conflicting event hash; shared M2 errors apply.
* **DB:** `inbox`, `evidence`; 2xx only after evidence/inbox durability; unsigned callbacks only inquiry hints. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-PLAT-04` — Same ID changed body quarantined; invalid signature cannot post; PACK-OPS, PACK-SECURITY, PACK-API; REQ-SC-01, REQ-SC-02, REQ-SC-03, REQ-SC-14, REQ-SC-15, REQ-SC-16, REQ-SC-19, REQ-SC-20, REQ-SC-21 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `webhook_auth_failure` plus M2 trace/audit; alert/runbook owned by Platform/SRE engineer.
* **Rollback:** RB-PLATFORM. **Evidence:** EV(T-PLAT-04) with `TEST-PLAT-04` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-PLAT-05 — Timers/DLQ/manual replay

* **Objective:** deliver `KITA-PLAT-05` end to end: Restart preserves deadlines and replay preserves original key. **Role / estimate:** Platform/SRE engineer (Qoder GPU; Sol review); 4 person-days.
* **Deps:** T-PLAT-03; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/platform/replay-task.ts; tests/features/test-plat-05.spec.ts; apps/workers/src/platform/replay-task.worker.ts. **Change:** packages/contracts/src/platform.ts; apps/api/src/admin/platform.controller.ts; infra/terraform/main.tf; .github/workflows/ci.yml; docs/runbooks/platform.md. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `replayTask(ctx: WorkerContext, input: Plat05Input): Promise<Result<Plat05Output>>`. **Wire / UI:** `POST /admin/v1/dead-letters/{id}/replays` (`replayDeadLetter`); `admin/exceptions`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Plat05Input` = timer identity/generation/dueAt or authorized DLQ replay; output `Plat05Output` = idempotent deadline work/inquiry under current state. Additional errors: VERSION_CONFLICT; shared M2 errors apply.
* **DB:** `timers`, `outbox`; DB timers survive restart; replay preserves original work/payload identity; age never proves failure. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-PLAT-05` — Restart preserves deadlines and replay preserves original key; PACK-OPS, PACK-SECURITY, PACK-API; REQ-SC-01, REQ-SC-02, REQ-SC-03, REQ-SC-14, REQ-SC-15, REQ-SC-16, REQ-SC-19, REQ-SC-20, REQ-SC-21 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `timer_overdue_age` plus M2 trace/audit; alert/runbook owned by Platform/SRE engineer.
* **Rollback:** RB-PLATFORM. **Evidence:** EV(T-PLAT-05) with `TEST-PLAT-05` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-PLAT-06 — Monitoring SLOs tracing/redaction

* **Objective:** deliver `KITA-PLAT-06` end to end: Alerts reach named on-call without PII leaks. **Role / estimate:** Platform/SRE engineer (Qoder GPU; Sol review); 4 person-days.
* **Deps:** T-PLAT-03; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/platform/observe-financial-health.ts; tests/features/test-plat-06.spec.ts; apps/workers/src/platform/observe-financial-health.worker.ts. **Change:** packages/contracts/src/platform.ts; infra/terraform/main.tf; .github/workflows/ci.yml; docs/runbooks/platform.md. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `observeFinancialHealth(ctx: WorkerContext, input: Plat06Input): Promise<Result<Plat06Output>>`. **Wire / UI:** internal worker/tool; no customer HTTP mutation; `operations`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Plat06Input` = redacted trace/metric events and financial health invariants; output `Plat06Output` = correlated dashboards, bounded SLOs and delivered on-call alerts. Additional errors: telemetry export failure; shared M2 errors apply.
* **DB:** `audit_events`; audit pointers only; health projection never financial authority; PII allowlist. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-PLAT-06` — Alerts reach named on-call without PII leaks; PACK-OPS, PACK-SECURITY, PACK-API; REQ-SC-01, REQ-SC-02, REQ-SC-03, REQ-SC-14, REQ-SC-15, REQ-SC-16, REQ-SC-19, REQ-SC-20, REQ-SC-21 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `financial_health_alert_delivery` plus M2 trace/audit; alert/runbook owned by Platform/SRE engineer.
* **Rollback:** RB-PLATFORM. **Evidence:** EV(T-PLAT-06) with `TEST-PLAT-06` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-PLAT-07 — Infrastructure/IaC/secrets/isolation

* **Objective:** deliver `KITA-PLAT-07` end to end: Production fails startup on sandbox capability or fixture adapter. **Role / estimate:** Platform/SRE engineer (Qoder GPU; Sol review); 7 person-days.
* **Deps:** T-PLAT-01, T-PLAT-02; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/platform/validate-environment.ts; tests/features/test-plat-07.spec.ts; apps/workers/src/platform/validate-environment.worker.ts; infra/terraform/environments/production/main.tf; infra/terraform/environments/sandbox/main.tf; infra/terraform/modules/security-archive/main.tf. **Change:** packages/contracts/src/platform.ts; infra/terraform/main.tf; .github/workflows/ci.yml; docs/runbooks/platform.md. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `validateEnvironment(ctx: WorkerContext, input: Plat07Input): Promise<Result<Plat07Output>>`. **Wire / UI:** internal worker/tool; no customer HTTP mutation; `engineering`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Plat07Input` = IaC plan, account/network/IAM/secret bindings and artifact digest; output `Plat07Output` = isolated deployment and fail-closed runtime environment. Additional errors: CAPABILITY_UNAVAILABLE; shared M2 errors apply.
* **DB:** `books`, `provider_accounts`; separate DB/queues/KMS/storage/provider keys and immutable archive; no shared production fixtures. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-PLAT-07` — Production fails startup on sandbox capability or fixture adapter; PACK-OPS, PACK-SECURITY, PACK-API; REQ-SC-01, REQ-SC-02, REQ-SC-03, REQ-SC-14, REQ-SC-15, REQ-SC-16, REQ-SC-19, REQ-SC-20, REQ-SC-21 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `environment_binding_failure` plus M2 trace/audit; alert/runbook owned by Platform/SRE engineer.
* **Rollback:** RB-PLATFORM. **Evidence:** EV(T-PLAT-07) with `TEST-PLAT-07` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-PLAT-08 — Backup/DR/fencing/reconciliation

* **Objective:** deliver `KITA-PLAT-08` end to end: Old writer fenced and uncertain external payments reconciled before reopen. **Role / estimate:** Platform/SRE engineer (Qoder GPU; Sol review); 7 person-days.
* **Deps:** T-PLAT-07, T-FIN-03, T-ADM-11; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/platform/recover-financial-authority.ts; tests/features/test-plat-08.spec.ts; apps/workers/src/platform/recover-financial-authority.worker.ts; docs/runbooks/financial-recovery.md; tests/recovery/external-instruction.spec.ts. **Change:** packages/contracts/src/platform.ts; infra/terraform/main.tf; .github/workflows/ci.yml; docs/runbooks/platform.md. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `recoverFinancialAuthority(ctx: WorkerContext, input: Plat08Input): Promise<Result<Plat08Output>>`. **Wire / UI:** internal worker/tool; no customer HTTP mutation; `operations`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Plat08Input` = backup/WAL plus independent external history and old-writer fencing; output `Plat08Output` = reconciled recovered authority or continued submission stop. Additional errors: PROVIDER_OUTCOME_UNKNOWN; shared M2 errors apply.
* **DB:** `all financial tables`; rebuild uncertainty window; never equate absent local attempt with no payment; no financial rewind. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-PLAT-08` — Old writer fenced and uncertain external payments reconciled before reopen; PACK-OPS, PACK-SECURITY, PACK-API; REQ-SC-01, REQ-SC-02, REQ-SC-03, REQ-SC-14, REQ-SC-15, REQ-SC-16, REQ-SC-19, REQ-SC-20, REQ-SC-21 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `recovery_unresolved_exposure` plus M2 trace/audit; alert/runbook owned by Platform/SRE engineer.
* **Rollback:** RB-PLATFORM. **Evidence:** EV(T-PLAT-08) with `TEST-PLAT-08` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-PLAT-09 — Privacy retention/legal holds

* **Objective:** deliver `KITA-PLAT-09` end to end: Legal hold preserves required records; deletable PII removed. **Role / estimate:** Platform/SRE engineer (Qoder GPU; Sol review); 5 person-days.
* **Deps:** T-IDENTITY-01, T-KYC-03; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/platform/apply-retention.ts; tests/features/test-plat-09.spec.ts; apps/workers/src/platform/apply-retention.worker.ts. **Change:** packages/contracts/src/platform.ts; apps/api/src/customer/platform.controller.ts; infra/terraform/main.tf; .github/workflows/ci.yml; docs/runbooks/platform.md. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `applyRetention(ctx: WorkerContext, input: Plat09Input): Promise<Result<Plat09Output>>`. **Wire / UI:** `POST /v1/me/privacy-requests` (`requestPrivacyAction`); `/profile/privacy`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Plat09Input` = privacy request, data-class schedule, subject and legal holds; output `Plat09Output` = eligible deletion/export or reasoned retention case. Additional errors: POLICY_UNAVAILABLE; shared M2 errors apply.
* **DB:** `documents`, `cases`; PII key lifecycle, backups/provider requests and hold enforcement; no PII in immutable journals. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-PLAT-09` — Legal hold preserves required records; deletable PII removed; PACK-OPS, PACK-SECURITY, PACK-API; REQ-SC-01, REQ-SC-02, REQ-SC-03, REQ-SC-14, REQ-SC-15, REQ-SC-16, REQ-SC-19, REQ-SC-20, REQ-SC-21 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `retention_overdue_items` plus M2 trace/audit; alert/runbook owned by Platform/SRE engineer.
* **Rollback:** RB-PLATFORM. **Evidence:** EV(T-PLAT-09) with `TEST-PLAT-09` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-PLAT-10 — Security/load/accessibility release gates

* **Objective:** deliver `KITA-PLAT-10` end to end: No critical gap or unexplained financial break at launch. **Role / estimate:** Platform/SRE engineer (Qoder GPU; Sol review); 6 person-days.
* **Deps:** T-PLAT-06, T-PLAT-07; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/platform/evaluate-release-gates.ts; tests/features/test-plat-10.spec.ts; apps/workers/src/platform/evaluate-release-gates.worker.ts. **Change:** packages/contracts/src/platform.ts; infra/terraform/main.tf; .github/workflows/ci.yml; docs/runbooks/platform.md. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `evaluateReleaseGates(ctx: WorkerContext, input: Plat10Input): Promise<Result<Plat10Output>>`. **Wire / UI:** internal worker/tool; no customer HTTP mutation; `engineering`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Plat10Input` = exact artifact, scope and required test/evidence manifests; output `Plat10Output` = blocking security/load/a11y/financial gate report. Additional errors: missing or failing evidence; shared M2 errors apply.
* **DB:** `none`; read-only gate facts; no approval from test-only data; DEP-15 execution required. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-PLAT-10` — No critical gap or unexplained financial break at launch; PACK-OPS, PACK-SECURITY, PACK-API; REQ-SC-01, REQ-SC-02, REQ-SC-03, REQ-SC-14, REQ-SC-15, REQ-SC-16, REQ-SC-19, REQ-SC-20, REQ-SC-21 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `release_gate_failure` plus M2 trace/audit; alert/runbook owned by Platform/SRE engineer.
* **Rollback:** RB-PLATFORM. **Evidence:** EV(T-PLAT-10) with `TEST-PLAT-10` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-EXT-01 — US CA UK EU/EEA JP SG AU country policy

* **Objective:** deliver `KITA-EXT-01` end to end: Unapproved country/state/product remains disabled. **Role / estimate:** Extended payments engineer + product owner (Qoder GPU; Sol review); 4 person-days.
* **Deps:** T-CORE-02, T-DEPEND-01; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/extensions/evaluate-market-permission.ts; tests/features/test-ext-01.spec.ts; apps/workers/src/extensions/evaluate-market-permission.worker.ts. **Change:** packages/contracts/src/extensions.ts; apps/api/src/customer/extensions.controller.ts; apps/customer-web/app/locations/page.tsx; apps/mobile/src/features/extensions.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `evaluateMarketPermission(ctx: WorkerContext, input: Ext01Input): Promise<Result<Ext01Output>>`. **Wire / UI:** `GET /v1/corridors` (`listCorridors`); `/locations`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Ext01Input` = entity, ISO country/state, product/currency/method and legal evidence; output `Ext01Output` = versioned market decision; only approved US→PH scope initially. Additional errors: CAPABILITY_UNAVAILABLE; shared M2 errors apply.
* **DB:** `capabilities`, `policies`; GB code, individual EU/EEA countries; CA/JP/SG/AU disabled until separate permission. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-EXT-01` — Unapproved country/state/product remains disabled; PACK-AUTOMATION, PACK-PROVIDER, PACK-API; REQ-SC-02, REQ-SC-03, REQ-SC-04, REQ-SC-05, REQ-SC-15, REQ-SC-16, REQ-SC-20, REQ-SC-21 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `market_permission_denial` plus M2 trace/audit; alert/runbook owned by Extended payments engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-EXT-01) with `TEST-EXT-01` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-EXT-02 — Institutional stablecoin treasury

* **Objective:** deliver `KITA-EXT-02` end to end: Wrong network/depeg/reorg cannot produce available PHP cash. **Role / estimate:** Extended payments engineer + product owner (Qoder GPU; Sol review); 8 person-days.
* **Deps:** T-FIN-06, T-ADM-05; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/treasury/settle-custody-leg.ts; tests/features/test-ext-02.spec.ts; apps/workers/src/treasury/settle-custody-leg.worker.ts; packages/providers/custody/adapter.ts. **Change:** packages/contracts/src/treasury.ts; apps/api/src/admin/treasury.controller.ts; apps/admin-web/app/treasury/page.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `settleCustodyLeg(ctx: WorkerContext, input: Ext02Input): Promise<Result<Ext02Output>>`. **Wire / UI:** `POST /admin/v1/treasury-movement-requests` (`requestTreasuryMovement`); `admin/treasury`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Ext02Input` = institutional custody asset/network/decimals, allowlist, trade and chain evidence; output `Ext02Output` = separate custody/chain/off-ramp/fiat settlement states. Additional errors: CAPABILITY_UNAVAILABLE; PROVIDER_OUTCOME_UNKNOWN; shared M2 errors apply.
* **DB:** `treasury_movements`, `journals`; asset registry/atomic units; finality/reorg/depeg freezes; no pending chain balance as PHP cash. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-EXT-02` — Wrong network/depeg/reorg cannot produce available PHP cash; PACK-AUTOMATION, PACK-PROVIDER, PACK-API; REQ-SC-02, REQ-SC-03, REQ-SC-04, REQ-SC-05, REQ-SC-15, REQ-SC-16, REQ-SC-20, REQ-SC-21 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `custody_unsettled_exposure` plus M2 trace/audit; alert/runbook owned by Extended payments engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-EXT-02) with `TEST-EXT-02` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-EXT-03 — Business KYB and signatories

* **Objective:** deliver `KITA-EXT-03` end to end: Individual KYC alone cannot authorize business payout. **Role / estimate:** Extended payments engineer + product owner (Qoder GPU; Sol review); 6 person-days.
* **Deps:** T-KYC-04, T-ADM-05; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/business/verify-business.ts; tests/features/test-ext-03.spec.ts; apps/workers/src/business/verify-business.worker.ts. **Change:** packages/contracts/src/business.ts; apps/api/src/customer/business.controller.ts; apps/customer-web/app/business/page.tsx; apps/mobile/src/features/business.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `verifyBusiness(ctx: WorkerContext, input: Ext03Input): Promise<Result<Ext03Output>>`. **Wire / UI:** `POST /v1/business-profiles` (`createBusinessProfile`); `/business`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Ext03Input` = business registration, owners/signatories, KYB evidence and entity policy; output `Ext03Output` = verified business profile/authority or restricted case. Additional errors: APPROVAL_REQUIRED; shared M2 errors apply.
* **DB:** `business_profiles`, `cases`; business legal-party ownership/signatory matrix; personal KYC cannot substitute; encrypted documents. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-EXT-03` — Individual KYC alone cannot authorize business payout; PACK-AUTOMATION, PACK-PROVIDER, PACK-API; REQ-SC-02, REQ-SC-03, REQ-SC-04, REQ-SC-05, REQ-SC-15, REQ-SC-16, REQ-SC-20, REQ-SC-21 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `kyb_review_age` plus M2 trace/audit; alert/runbook owned by Extended payments engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-EXT-03) with `TEST-EXT-03` results, connected UI/API/worker proof and applicable gate/dependency manifest.

### T-EXT-04 — Item-level batch payout approvals

* **Objective:** deliver `KITA-EXT-04` end to end: Partial batch preserves paid items and no retry duplicates them. **Role / estimate:** Extended payments engineer + product owner (Qoder GPU; Sol review); 6 person-days.
* **Deps:** T-EXT-03, T-TX-01, T-ADM-05; all financial feature commands require T-CORE-02/T-LEDGER-02, and external activation requires T-DEPEND-01 plus applicable N approvals. Read/UI-only work uses frozen contracts; feature cannot close before connected flow passes.
* **Files — create:** packages/domain/business/execute-batch.ts; tests/features/test-ext-04.spec.ts; apps/workers/src/business/execute-batch.worker.ts. **Change:** packages/contracts/src/business.ts; apps/api/src/customer/business.controller.ts; apps/customer-web/app/business/batches/page.tsx; apps/mobile/src/features/business.tsx. **Remove:** none; target prototype exclusions are T-MIG-01.
* **Function signatures:** `executeBatch(ctx: WorkerContext, input: Ext04Input): Promise<Result<Ext04Output>>`. **Wire / UI:** `POST /v1/batches` (`createBatch`); also owns `getBatch`; `/business/batches`. Worker reducers are internal; GET controllers only read their projection and never invoke a financial reducer.
* **I/O/errors:** input `Ext04Input` = encrypted validated CSV rows, item quotes/hashes and aggregate approval; output `Ext04Output` = per-item operations/status and partial batch result. Additional errors: APPROVAL_STALE; LIMIT_EXCEEDED; shared M2 errors apply.
* **DB:** `batches`, `batch_items`, `transfers`; approval binds ordered items/currency totals; paid items immutable; retry only proven unsubmitted. Supplemental storage uses architect-owned numbered migrations, not unconstrained JSON-only state; CP addenda below identify required schema gaps.
* **Tests:** `TEST-EXT-04` — Partial batch preserves paid items and no retry duplicates them; PACK-AUTOMATION, PACK-PROVIDER, PACK-API; REQ-SC-02, REQ-SC-03, REQ-SC-04, REQ-SC-05, REQ-SC-15, REQ-SC-16, REQ-SC-20, REQ-SC-21 where applicable, including explicit no-op financial assertions for reads.
* **Observability:** `batch_unresolved_items` plus M2 trace/audit; alert/runbook owned by Extended payments engineer.
* **Rollback:** RB-CONTROL. **Evidence:** EV(T-EXT-04) with `TEST-EXT-04` results, connected UI/API/worker proof and applicable gate/dependency manifest.

## M5. Supplemental API ownership and route completion

These36 existing operations complement the primary feature operation in B. They are included in the named task's estimate, controller/client binding, permissions, schema tests, UI flow and evidence. T-INTEGRATE-01 checks **all114** OpenAPI operations. A worker handler behind a read view never makes the GET mutate money. Any missing business action discovered during contract freeze receives an explicit contract addendum and task before coding.

| Operation | Wire endpoint | Owner task / connected flow |
|---|---|---|
| `getProfile` | `GET /v1/me` | `T-AUTH-06` |
| `revokeSession` | `POST /v1/auth/sessions/{id}/revocations` | `T-AUTH-05` |
| `completeDocumentUpload` | `POST /v1/documents/{id}/completion` | `T-KYC-03` |
| `listRecipients` | `GET /v1/recipients` | `T-REC-01` |
| `getDraft` | `GET /v1/drafts/{id}` | `T-QUOTE-08` |
| `getQuote` | `GET /v1/quotes/{id}` | `T-QUOTE-05` |
| `getTransferTimeline` | `GET /v1/transfers/{id}/timeline` | `T-TX-02` |
| `getCommandResult` | `GET /v1/commands/{key}` | `T-TX-01` |
| `createSupportCase` | `POST /v1/support/cases` | `T-TX-08` |
| `getCase` | `GET /v1/support/cases/{id}` | `T-TX-08` |
| `listRateAlerts` | `GET /v1/rate-alerts` | `T-GROW-05` |
| `pauseRateAlert` | `POST /v1/rate-alerts/{id}/pause` | `T-GROW-05` |
| `listSchedules` | `GET /v1/schedules` | `T-TX-10` |
| `revokeSchedule` | `POST /v1/schedules/{id}/revocations` | `T-TX-10` |
| `getBatch` | `GET /v1/batches/{id}` | `T-EXT-04` |
| `getAdminTransfer` | `GET /admin/v1/transfers/{id}` | `T-ADM-02` |
| `resolveHold` | `POST /admin/v1/holds/{id}/resolutions` | `T-ADM-03` |
| `adminRequestCancellation` | `POST /admin/v1/transfers/{id}/cancellation-requests` | `T-TX-05` |
| `adminRequestRefund` | `POST /admin/v1/transfers/{id}/refund-requests` | `T-TX-06` |
| `listAdminCases` | `GET /admin/v1/cases` | `T-ADM-04` |
| `listApprovals` | `GET /admin/v1/approvals` | `T-ADM-05` |
| `listConfigVersions` | `GET /admin/v1/configuration-versions` | `T-ADM-08` |
| `requestRouteReenable` | `POST /admin/v1/routes/{id}/reenablement-requests` | `T-ADM-12` |
| `listBreaks` | `GET /admin/v1/reconciliation-breaks` | `T-FIN-04` |
| `startAuthorization` | `POST /v1/auth/authorization-requests` | `T-AUTH-02` |
| `completeAuthorization` | `POST /v1/auth/callbacks` | `T-AUTH-02` |
| `confirmContact` | `POST /v1/auth/contact-confirmations` | `T-AUTH-01` |
| `confirmFundingInstrument` | `POST /v1/funding-instruments` | `T-FUND-01` |
| `listFundingInstruments` | `GET /v1/funding-instruments` | `T-FUND-01` |
| `revokeFundingInstrument` | `POST /v1/funding-instruments/{id}/revocations` | `T-FUND-01` |
| `createWalletQuote` | `POST /v1/wallet-quotes` | `T-WAL-04` |
| `executeApproval` | `POST /admin/v1/approvals/{id}/executions` | `T-ADM-05` |
| `assignCase` | `POST /admin/v1/cases/{id}/assignments` | `T-ADM-02` |
| `listBillers` | `GET /v1/billers` | `T-PAY-06` |
| `validateBillAccount` | `POST /v1/billers/{id}/validations` | `T-PAY-06` |
| `simulatePricing` | `POST /admin/v1/pricing/simulations` | `T-ADM-08` |

## M6. Scope, estimates and batch acceptance

This backlog contains **120 tasks: 16 shared/release tasks and104 feature tasks**, estimated at **524 engineering person-days** before procurement and pilot observation. This is a scope inventory, not a promised calendar duration; validate estimates after freeze. Required dependency waits, independent review and legal/provider decisions cannot be shortened by adding coding agents.

Deliver foundational contracts first; then the core US→PH vertical slice (identity→recipient→quote→accept→settled ACH→FX→bank/GCash delivery→receipt→refund/reconciliation) and its negative paths; then extended wallet/growth/cash/bills/business/treasury features against the same controls. Public/mobile/admin UI work may run alongside domain implementation after shared contracts freeze. Internal test doubles support engineering only and are excluded from production artifacts.

Every batch handoff includes source/contract hashes, declared created/changed/removed files, migration ordering, immutable evidence refs, known gaps and rollback classification. Sol reviews quality, completeness, bugs, optimization and all money invariants on the downloaded exact bundle; the architect integrates and re-runs impacted gates. T-INTEGRATE-01 covers the full target; a pilot slice may execute its applicable checks earlier with an explicit manifest of excluded disabled features, but cannot mark the full task complete. Coordinator handles GitHub only after that review under the standing operator workflow; this planning task makes no commits, PRs or deployments.

Claims of completed product wiring require executable implementation evidence. The present COMPLETENESS-PASS confirms planning links and identifies contract/storage/verification gaps; it does not close these backlog tasks.

<a id="m5-mandatory-supplemental-schema-and-integration-dependencies"></a>
<a id="m2-required-foundational-work-and-sql-follow-ons"></a>

## M7. Mandatory supplemental schema and integration dependencies

This anchor retains the incoming link from F. Latest E13/core SQL supersedes the older statement in F's final persistence subsection that sessions/instruments/wallet operations are absent. They are present as schema; operational command correctness is still unproved. Use existing tables before adding a new one. Freeze and test the following scope through T-CONTRACT-01, without changing the protected planning artifacts in this session:

| Area | Existing foundation / remaining implementation | Owner and exit proof |
|---|---|---|
| Sessions/instruments/mandates | Existing auth_sessions/contact_verifications/funding_instruments/mandates/revocations; finish refresh reuse, device lifecycle, hosted confirmation and ownership/effective-policy checks. | T-IDENTITY-01, T-AUTH-01–07, T-FUND-01; PACK-IDENTITY/SECURITY. |
| Wallet and treasury authority | Existing money_operations, operation-linked attempts/refunds/reservations and wallet_quotes; complete non-transfer parent binding, immutable intent, response recovery, ambiguity and safe one-authority rules. | T-CORE-02, T-WAL-01–06, T-FIN-05/06; REQ-SC-02/03/05/17/20. |
| Subject holds, limits and rates | Existing transfer holds and limit_buckets/reservations/rate_snapshots; complete customer/route/global hold scope, shared dispatch locks, approved calendars and current authority checks. | T-CORE-02, T-ADM-03/12, T-KYC-05/06, T-QUOTE-04, T-PAY-02; REQ-SC-04/05/06. |
| Evidence and posting | Immutable evidence/attempt/journal core plus accounting_periods/open-period guard; constrain verified movement meaning, active policy, book/subject linkage, nonoverlap/close, full/partial allocations and independent reconstruction. | T-CORE-02, T-LEDGER-02, T-FIN-01–08; E4–E11 and REQ-SC-07–12/19. |
| Servicing, delivery and reports | Existing case_messages, notification_attempts/preferences, fx_trades/allocations; implement secure attachment/assignment/filing, report jobs/download grants, statutory calendars and notices, gross-net/FX allocation caps. | T-TX-07–09, T-GROW-07/08, T-ADM-02/09, T-FIN-03/06/07; PACK-API/FINANCE. |
| Points and automation | Point events/lots, campaigns/reservations, schedules/runs are starting storage; constrained paired posting and FIFO, durable mandate bounds/revocation, timers and entitlement/provision accounting still required. | T-REWARD-01, T-GROW-01–09, T-TX-10; REQ-SC-18/PACK-AUTOMATION. |
| Bills/business/custody | Core bill_payments/business_profiles/batches/items/treasury_movements exist; complete biller schema/proof, legal-party/signatory binding and ordered batch approvals, custody asset registry/finality/reorg/off-ramp contracts. | T-PAY-06, T-EXT-02–04; PACK-PROVIDER/AUTOMATION and separate activation evidence. |

Every added or strengthened relation must carry book/customer ownership checks, immutable evidence identity, least-privilege grants and fresh/upgrade/concurrency verification. An existing table is not a finished domain command. G1–G6 in L9 are the release stages for this revision; retained G00–G10 technical checks and M01–M104/SC-01–SC-56 catalogs remain normative; the six stages combine their evidence. Preserve task identity T-BASE-01/T-RELEASE-01 as above; all feature TEST-* identities remain unchanged.
