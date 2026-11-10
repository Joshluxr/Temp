BATCH-OK

Authorize only T-QUOTE-05: acceptQuote PURE checker.

T-QUOTE-04 landed: staleQuoteWouldExecuteFromCache => RATE_STALE 409; else 503.
TEST-QUOTE-04: 2 passed.

Files only:
- packages/domain/quotes/accept-quote.ts
- tests/features/test-quote-05.spec.ts
- packages/contracts/src/quotes.ts — additive Quote05 types only

Required behavior:
- Pure checker: no DB, no money, no executeCommand.
- Never ok:true; never accept an expired quote or changed recipient as a new transfer.
- expiryEqualityOrRecipientChange === true => QUOTE_EXPIRED 409. Expiry equality or recipient change produces conflict.
- Otherwise 503 dependency_unavailable because quotes/transfers store is not implemented (T-QUOTE-01 HOLD).
- Reuse Quote04CommandContext or a WorkerContext pick named Quote05CommandContext.
- Tests cover expiry equality conflict, recipient change conflict, fallback 503, and no success or transfer execution.

Holds remain:
T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-05, T-TX-06, T-TX-10, T-FUND-02, T-FUND-03, T-LEDGER-02.
