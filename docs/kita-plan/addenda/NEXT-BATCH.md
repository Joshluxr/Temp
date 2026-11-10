BATCH-OK

Authorize only the exact T-QUOTE-07 renderQuoteTerms pure checker specified below.

T-QUOTE-08 landed: staleDraftWouldOverwriteNewerRecipientOrAmount returns VERSION_CONFLICT 409; otherwise 503. TEST-QUOTE-08: 2 passed.

Holds: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-05, T-TX-06, T-TX-10, T-FUND-02, T-FUND-03, T-LEDGER-02.

Next batch: T-QUOTE-07 renderQuoteTerms PURE checker only. No DB, no money, no executeCommand.

Files only:
- packages/domain/quotes/render-quote-terms.ts
- tests/features/test-quote-07.spec.ts
- packages/contracts/src/quotes.ts — additive Quote07 types only

Required behavior:
- Never return ok:true. Never let display rounding change execution arithmetic.
- displayRoundingWouldChangeExecutionArithmetic === true => POLICY_UNAVAILABLE 409. Display rounding never changes execution arithmetic.
- Otherwise return 503 dependency_unavailable because the quotes store is not implemented (T-QUOTE-01 HOLD).
- Reuse Quote08CommandContext or a WorkerContext pick named Quote07CommandContext.

All work outside this exact checker and file scope remains unauthorized. If this scope cannot be preserved, HOLD.
