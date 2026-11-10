BATCH-OK

Authorize only T-TX-06: `authorizeRefund` as a pure checker.

T-TX-05 landed: `rewrittenReceiptTimestampWouldChangeEligibleRemedy === true` returns `POLICY_UNAVAILABLE` 409; otherwise 503. TEST-TX-05: 2 passed (reported).

Holds remain: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-05, T-TX-06, T-TX-10, T-FUND-02, T-FUND-03, T-LEDGER-02. This limited checker authorization does not clear those holds.

Implementation files only:

- `packages/domain/refunds/authorize-refund.ts`
- `tests/features/test-tx-06.spec.ts`
- `packages/contracts/src/refunds.ts` — additive Tx06 types only.

Exact behavior:

- Never return `ok: true` or authorize concurrent partial refunds beyond entitlement.
- If `concurrentPartialRefundsWouldExceedEntitlement === true`, return `LIMIT_EXCEEDED` with HTTP 409 and message: “Concurrent partial refunds cannot exceed entitlement.”
- Otherwise return HTTP 503 `dependency_unavailable`, because the refund store is not implemented and T-LEDGER-02 remains HOLD.
- Reuse `Tx05CommandContext`, or use a `WorkerContext` pick named `Tx06CommandContext`.
- Pure checker only: no DB, no money movement, and no `executeCommand`.

TEST-TX-06 must cover the 409 branch, the otherwise-503 branch, and the absence of any `ok: true` result. Hold any expansion beyond this exact checker.
