BATCH-OK

Authorize only the exact T-QUOTE-03 priceFees PURE checker specified below.

T-QUOTE-02 landed in PR #87: inverseWouldMissRequestedMinorAmount returns CAPABILITY_UNAVAILABLE 409; otherwise 503. TEST-QUOTE-02: 2 passed.

Holds: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-05, T-TX-06, T-TX-10, T-FUND-02, T-FUND-03, T-LEDGER-02.

Next batch: T-QUOTE-03 priceFees PURE checker only. No DB, no money, no executeCommand.

Files only:

- packages/domain/quotes/price-fees.ts
- tests/features/test-quote-03.spec.ts
- packages/contracts/src/quotes.ts — additive Quote03 types only

Required behavior:

- Never return ok:true and never default missing tax to zero.
- missingTaxWouldDefaultZeroOrInexactTierTotals === true => POLICY_UNAVAILABLE 409. Tier boundary discount and tax totals must be exact; no missing-tax default zero.
- Otherwise return 503 dependency_unavailable because the policies/quotes store is not implemented (T-QUOTE-01 HOLD).
- Reuse Quote02CommandContext or a WorkerContext pick named Quote03CommandContext.

All work outside this exact checker and file scope remains unauthorized. If this scope cannot be preserved, HOLD.
