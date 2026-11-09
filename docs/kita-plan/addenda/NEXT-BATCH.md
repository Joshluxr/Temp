BATCH-OK

Authorize only the limited T-PLAT-10 fail-closed implementation described below.

Heartbeat (operator supplied): Codex logged in; GPU disk 41%; astra gone; Qoder thin. Plan A-N is already on disk with SOL-REVIEW CONDITIONAL-PASS. That review does not release existing holds.

T-PLAT-07 checker landed: production+sandbox/fixture/addSandboxFunds returns CAPABILITY_UNAVAILABLE 409; otherwise 503; never ok:true. TEST-PLAT-07: 10 passed (reported).

T-CORE-02 remains HOLD. T-PLAT-08 recoverFinancialAuthority remains HOLD because it involves money/fencing.

Authorized T-PLAT-10 behavior:
- evaluateReleaseGates always fails closed. Never return ok:true or claim that there is no financial break.
- Missing or failing evidence returns a blocking problem using the established contract.
- Present/passing evidence still returns HTTP 503 with dependency_unavailable, because DEP-15 live gates are not implemented.
- No DB access, money operations, or executeCommand calls. Do not implement DEP-15 live gates.

Implementation changes are limited to:
- packages/platform/evaluate-release-gates.ts
- tests/features/test-plat-10.spec.ts
- packages/contracts/src/platform.ts: additive Plat10 types only.

Qoder Efficient implements on GPU gpu-fqaf via the established sync/bundle workflow. Sol max reviews the returned batch for scope, completeness, and correctness. This authorization does not dispatch implementation from this session.

Acceptance: TEST-PLAT-10 covers missing evidence, failing evidence, and present/passing evidence; every path blocks, no path returns ok:true or claims financial safety, and present/passing evidence remains 503 dependency_unavailable. Run applicable checks and review the exact returned head. Any required expansion beyond the three files or into DB, money, fencing, executeCommand, or live gates is HOLD.
