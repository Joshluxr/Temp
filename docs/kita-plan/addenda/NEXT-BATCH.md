BATCH-OK

Authorize exactly T-WAL-01: getWalletBalances PURE checker.

Allowed implementation files only:
- packages/domain/wallets/get-wallet-balances.ts
- tests/features/test-wal-01.spec.ts
- packages/contracts/src/wallets.ts — additive Wal01 types only.

Required behavior:
- Never return ok:true or spendable balances.
- Projection and ledger must agree per currency; agreement in aggregate cannot mask a disagreement in any currency.
- projectionLedgerDisagree === true => CAPABILITY_UNAVAILABLE, HTTP 409.
- Otherwise => dependency_unavailable, HTTP 503, because the ledger_accounts store is not implemented (T-LEDGER-02 HOLD).
- Reuse Fund01CommandContext or a WorkerContext pick named Wal01CommandContext.
- Pure checker only: no DB access, no money operations, no executeCommand, and no replica authority.

Validation in tests/features/test-wal-01.spec.ts must cover per-currency disagreement returning 409, the otherwise branch returning 503, and absence of successful or spendable-balance responses. No additional implementation files or scope are authorized. Any implementation requiring broader scope is HOLD.

Landed status supplied by operator:
T-FUND-04: unapprovedMethod => CAPABILITY_UNAVAILABLE, HTTP 403; otherwise HTTP 503. TEST-FUND-04: 2 passed.

Holds remain unchanged:
T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-05, T-TX-06, T-TX-10, T-FUND-02, T-FUND-03, T-LEDGER-02.
