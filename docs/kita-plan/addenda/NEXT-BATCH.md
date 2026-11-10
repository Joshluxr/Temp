BATCH-OK

Authorize only the T-FUND-03 applyCardEvidence pure checker described below. This batch does not clear any delivery hold.

Landed: T-FUND-02 returns FUNDING_PENDING / HTTP 409 when initiationAloneWouldAuthorizePayout === true; otherwise HTTP 503. TEST-FUND-02: 2 passed.

Holds remain: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-05, T-TX-06, T-TX-10, T-FUND-02, T-FUND-03, T-LEDGER-02.

Allowed implementation files only:
- packages/domain/funding/apply-card-evidence.ts
- tests/features/test-fund-03.spec.ts
- packages/contracts/src/funding.ts — additive Fund03 types only; preserve existing contracts.

Required behavior:
- Implement applyCardEvidence as a pure checker: no database access, money movement, journal posting, external effects, or executeCommand.
- Never return ok: true. Authorization posts no cash; capture remains receivable and must never be labeled bank cash.
- When authorizationWouldPostCashOrCaptureLabeledBankCash === true, return POLICY_UNAVAILABLE / HTTP 409.
- Otherwise return dependency_unavailable / HTTP 503 because the card/journals store is not implemented; T-LEDGER-02 remains HOLD.
- Reuse Fund02CommandContext or Fund01CommandContext, or define a WorkerContext pick named Fund03CommandContext. Do not add a new runtime dependency or broaden existing context contracts.

TEST-FUND-03 must verify both branches, exact error/status pairs, and absence of any ok: true result or side effects. Run the focused feature tests and applicable type checks; report the results for review. Do not implement card storage or settlement, change routing, or expand scope. If this exact checker cannot fit within these constraints, HOLD.

Implementation follows the established roles: Qoder Efficient swarm on gpu-fqaf; Codex Sol max reviews the returned batch. This document authorizes that limited checker only.
