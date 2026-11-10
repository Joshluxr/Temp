BATCH-OK

Authorize only T-WAL-05: a PURE withdrawWallet checker. No DB access, no money movement, and no executeCommand. Never return ok:true. Failed refunds must retain the obligation, and closure must retain all remaining funds.

Allowed files only:
- packages/domain/wallets/withdraw-wallet.ts
- tests/features/test-wal-05.spec.ts
- packages/contracts/src/wallets.ts — additive Wal05 types only

Exact behavior:
- failedRefundDropsObligationOrClosureLosesFunds === true => COMPLIANCE_HOLD, HTTP 409. Failed refund retains obligation; closure cannot lose remaining funds.
- Otherwise => dependency_unavailable, HTTP 503, because the refund store is not implemented (T-TX-06 HOLD).
- No branch may return ok:true or drop remaining funds on a failed refund or closure.

Reuse Wal04CommandContext or define a WorkerContext pick named Wal05CommandContext.

TEST-WAL-05 must verify the exact 409/503 branches, never ok:true, and retention of obligations and remaining funds. Stay within the three allowed files and the pure checker scope.

Landed: T-WAL-04 — fourCurrencyLegsUnbalancedOrUnconfirmedTarget => INSUFFICIENT_FUNDS, HTTP 409; otherwise HTTP 503. TEST-WAL-04: 2 passed.

HOLD: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-05, T-TX-06, T-TX-10, T-FUND-02, T-FUND-03, T-LEDGER-02.
