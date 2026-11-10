BATCH-OK

Authorize only the limited T-TX-05 `requestCancellation` pure checker described below.

Landed evidence: T-TX-01 returns IDEMPOTENCY_MISMATCH 409 when `doubleTapOrDifferentKeysWouldCreateSecondTransfer === true`; otherwise 503. TEST-TX-01: 2 passed. This does not release the T-TX-01 hold.

Allowed implementation files only:
- `packages/domain/transfers/request-cancellation.ts`
- `tests/features/test-tx-05.spec.ts`
- `packages/contracts/src/transfers.ts` — additive Tx05 types only.

Required behavior:
- Never return `ok: true`.
- Never use a rewritten receipt timestamp as the remedy clock. Receipt timestamp and actual delivery determine the eligible remedy.
- When `rewrittenReceiptTimestampWouldChangeEligibleRemedy === true`, return POLICY_UNAVAILABLE with HTTP 409.
- Otherwise return HTTP 503 with `dependency_unavailable`, because the cases/holds store is not implemented. T-TX-06 remains HOLD.
- No database access, money movement, or `executeCommand`.
- Reuse `Tx01CommandContext`, or use a `WorkerContext` pick named `Tx05CommandContext`.

Acceptance coverage in the allowed test file must verify the 409 policy branch, the 503 fallback, and that no result succeeds or treats a rewritten receipt timestamp as the remedy clock. No broader implementation is authorized; if the exact checker cannot stay within this scope, HOLD.

Holds remain: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-05, T-TX-06, T-TX-10, T-FUND-02, T-FUND-03, T-LEDGER-02. This authorization does not release any hold.
