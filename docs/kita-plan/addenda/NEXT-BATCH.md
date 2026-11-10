BATCH-OK

Authorize only T-GROW-02: reservePoints as a pure, fail-closed checker.

T-GROW-01 landed: duplicatePayoutCallbackAwardsTwice returns POLICY_UNAVAILABLE 409; otherwise 503. TEST-GROW-01: 2 passed.

Allowed implementation files only:
- packages/domain/rewards/reserve-points.ts
- tests/features/test-grow-02.spec.ts
- packages/contracts/src/rewards.ts — additive Grow02 types only

Exact checker behavior:
- concurrentRedemptionExpiryOverspend === true: return INSUFFICIENT_FUNDS, HTTP 409. Concurrent redemption/expiry cannot overspend a lot.
- Otherwise: return dependency_unavailable, HTTP 503, because the points store is not implemented (T-REWARD-01 remains HOLD).
- Never return ok:true. Never reserve, redeem, expire, or mutate points; concurrent redemption/expiry must never overspend a lot.
- Pure checker only: no DB access, no money operations, no executeCommand, and never convert units to fiat.
- Reuse Grow01CommandContext or Grow04CommandContext, or a WorkerContext pick named Grow02CommandContext. Do not expand shared context or contracts beyond additive Grow02 types.

TEST-GROW-02 must cover the exact true => 409 branch and the otherwise => 503 branch, with no successful result or side effects. This authorization does not implement the points store or authorize any held task.

HOLD: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-05, T-TX-06, T-TX-10, T-FUND-02, T-FUND-03, T-LEDGER-02.
