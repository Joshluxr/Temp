BATCH-OK

Authorize only the exact T-FIN-04 break-owner resolution PURE checker described below. No other task is authorized by this batch. Any required scope expansion is HOLD.

T-FIN-03 landed in PR #71: threeWayMismatchWouldForceBalance returns VERSION_CONFLICT (409); otherwise 503. TEST-FIN-03: 2 passed.

HOLD: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-05, T-TX-06, T-TX-10, T-FUND-02, T-FUND-03, T-LEDGER-02.

Allowed implementation files only, relative to apps/kita/:
- packages/domain/reconciliation/resolve-break.ts
- tests/features/test-fin-04.spec.ts
- packages/contracts/src/reconciliation.ts — additive Fin04 types only

Required behavior:
- Never return ok:true and never force-match a break.
- forceMatchWithoutApprovedJournal === true returns POLICY_UNAVAILABLE with HTTP 409.
- Otherwise return HTTP 503 dependency_unavailable because the ledger/journals store is not implemented; T-FIN-01 remains HOLD.
- Force match is impossible. Any correction must link an approved journal; this checker does not perform corrections.
- Reuse Fin03CommandContext, or a WorkerContext pick named Fin04CommandContext.
- Pure checker only: no database access, money movement, executeCommand, persistence, or break-owner mutation.

Validation is confined to tests/features/test-fin-04.spec.ts: cover the true flag's 409 policy result, false/omitted flag's 503 dependency result, and the absence of success or force-match behavior.

Follow the established VM Codex / GPU Qoder roles: Qoder Efficient swarm implements on the GPU; Sol max reviews the returned changes. A failed review returns to Qoder as a fix batch within this exact scope.
