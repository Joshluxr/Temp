BATCH-OK

Authorize only the limited T-FUND-02 `applyAchSettlement` pure checker described below. This authorization does not release the broader holds.

Landed: T-TX-10, PR #93. `dstRetryWouldCreateSecondOccurrence === true` returns `LIMIT_EXCEEDED` with HTTP 409; otherwise HTTP 503. TEST-TX-10: 2 passed.

Holds: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-05, T-TX-06, T-TX-10, T-FUND-02, T-FUND-03, T-LEDGER-02.

Allowed files only:

- `packages/domain/funding/apply-ach-settlement.ts`
- `tests/features/test-fund-02.spec.ts`
- `packages/contracts/src/funding.ts` — additive Fund02 types only.

Implement `applyAchSettlement` as a pure checker:

- Never return `ok: true` and never authorize payout from initiation alone.
- If `initiationAloneWouldAuthorizePayout === true`, return `FUNDING_PENDING` with HTTP 409 and the message: "Initiation alone cannot authorize payout."
- Otherwise return `dependency_unavailable` with HTTP 503 because the ACH settlement store is not implemented. T-LEDGER-02 remains HOLD.
- No database access, money movement, `executeCommand`, or ACH advancement.
- Reuse `Fund01CommandContext`, or use a `WorkerContext` pick named `Fund02CommandContext`.

Regression coverage must verify the true branch returns HTTP 409 / `FUNDING_PENDING`, every other accepted input returns HTTP 503 / `dependency_unavailable`, and neither branch returns `ok: true` or authorizes payout.

Any implementation requiring additional files, settlement persistence, execution, or expansion beyond this exact checker is HOLD.
