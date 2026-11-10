BATCH-OK

Authorize only T-QUOTE-06: `reserveFxExposure` as a PURE checker.

Allowed files only:
- `packages/domain/quotes/reserve-fx-exposure.ts`
- `tests/features/test-quote-06.spec.ts`
- `packages/contracts/src/quotes.ts` — additive Quote06 types only.

Required behavior:
- Never return `ok: true`; never change the customer promise when wholesale deteriorates.
- `wholesaleDeteriorationWouldChangeCustomerPromise === true` returns `POLICY_UNAVAILABLE`, HTTP 409. Wholesale deterioration changes corporate cost, not the customer promise.
- Otherwise return HTTP 503, `dependency_unavailable`, because the liquidity/quotes store is not implemented. T-QUOTE-01 remains HOLD. T-FIN-05 is not listed as HOLD.
- Reuse `Quote03CommandContext`, or use a `WorkerContext` pick named `Quote06CommandContext`.
- No DB, no money operations, no `executeCommand`.
- Tests must cover both failure branches, no successful result, and preservation of the customer promise.

Recorded landed baseline:
- T-QUOTE-03: `missingTaxWouldDefaultZeroOrInexactTierTotals` returns `POLICY_UNAVAILABLE`, HTTP 409; otherwise 503.
- TEST-QUOTE-03: 2 passed.

HOLD remains unchanged for: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-05, T-TX-06, T-TX-10, T-FUND-02, T-FUND-03, T-LEDGER-02.

No other implementation is authorized by this batch.
