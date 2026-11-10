BATCH-OK

Authorize only the limited T-TX-01 `acceptTransfer` PURE checker described below. This is never delivery authorization.

T-QUOTE-06 landed in PR #89: `wholesaleDeteriorationWouldChangeCustomerPromise === true` returns `POLICY_UNAVAILABLE` with HTTP 409; otherwise HTTP 503. TEST-QUOTE-06: 2 passed.

Allowed files only:
- `packages/domain/transfers/accept-transfer.ts`
- `tests/features/test-tx-01.spec.ts`
- `packages/contracts/src/transfers.ts` — additive Tx01 types only.

Required checker behavior:
- Never return `ok: true`.
- `doubleTapOrDifferentKeysWouldCreateSecondTransfer === true` returns `IDEMPOTENCY_MISMATCH` with HTTP 409.
- Otherwise return HTTP 503 `dependency_unavailable`, because the `command_keys`/`transfers` store is not implemented (T-CORE-02 HOLD).
- Required invariant: double tap and different keys on one quote create one transfer, never two. This checker creates zero transfers; persistent one-transfer enforcement remains held with the store dependency.
- Reuse `Tx08CommandContext`, or use a `WorkerContext` pick named `Tx01CommandContext`.
- No DB, money movement, `executeCommand`, transfer creation, persistence, or delivery. No success path or substitute store.

TEST-TX-01 must cover the 409 mismatch branch and the otherwise-503 branch, including double-tap/different-key scenarios, with no `ok: true` or transfer creation.

Holds remain: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-05, T-TX-06, T-TX-10, T-FUND-02, T-FUND-03, T-LEDGER-02. The sole T-TX-01 exception is the exact pure checker above; delivery stays HOLD. Any broader scope is HOLD.
