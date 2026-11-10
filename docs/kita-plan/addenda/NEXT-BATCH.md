BATCH-OK

Authorize only T-WAL-04: convertWallet as a PURE checker.

T-WAL-03 landed: twoSimultaneousSpendsWouldOverdraw returns INSUFFICIENT_FUNDS 409; otherwise 503. TEST-WAL-03: 2 passed.

Allowed files only:
- packages/domain/wallets/convert-wallet.ts
- tests/features/test-wal-04.spec.ts
- packages/contracts/src/wallets.ts — additive Wal04 types only.

Required behavior:
- No DB access, money movement, or executeCommand.
- Never return ok:true. Never make the target available from an unconfirmed asset receipt.
- Four currency legs must balance, and the exact target obligation must be funded.
- fourCurrencyLegsUnbalancedOrUnconfirmedTarget === true returns INSUFFICIENT_FUNDS with HTTP 409.
- Otherwise return HTTP 503 with dependency_unavailable because the quotes/journals store is not implemented; T-QUOTE-01 remains HOLD. A false flag does not authorize conversion or establish confirmed funding.
- Reuse Wal03CommandContext, or use a WorkerContext pick named Wal04CommandContext.
- TEST-WAL-04 must cover both return branches and confirm neither returns ok:true.

HOLD: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-05, T-TX-06, T-TX-10, T-FUND-02, T-FUND-03, T-LEDGER-02.

No broader conversion implementation or HOLD work is authorized by this batch.
