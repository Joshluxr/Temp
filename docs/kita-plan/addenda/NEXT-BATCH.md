BATCH-OK

Authorize only the exact T-QUOTE-02 solveReceive PURE checker specified below.

T-QUOTE-07 landed: displayRoundingWouldChangeExecutionArithmetic returns POLICY_UNAVAILABLE 409; otherwise 503. TEST-QUOTE-07: 2 passed.

Holds: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-05, T-TX-06, T-TX-10, T-FUND-02, T-FUND-03, T-LEDGER-02.

Next batch: T-QUOTE-02 solveReceive PURE checker only. No DB, no money, no executeCommand, no JS Number.

Files only:

- packages/domain/quotes/solve-receive.ts
- tests/features/test-quote-02.spec.ts
- packages/contracts/src/quotes.ts — additive Quote02 types only

Required behavior:

- Never return ok:true and never deliver a payout that is not the requested minor amount.
- inverseWouldMissRequestedMinorAmount === true => CAPABILITY_UNAVAILABLE 409. JPY and USD inversion must deliver the requested minor amount exactly.
- Otherwise return 503 dependency_unavailable because the quotes store is not implemented (T-QUOTE-01 HOLD).
- Reuse Quote07CommandContext or a WorkerContext pick named Quote02CommandContext.

All work outside this exact checker and file scope remains unauthorized. If this scope cannot be preserved, HOLD.
