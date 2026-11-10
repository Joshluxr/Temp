BATCH-OK

Authorize only the exact T-FIN-06 allocateFxTrade pure checker described below.

Landed: T-FIN-08, PR #75. secondAutomaticCreditSameEntitlement => POLICY_UNAVAILABLE, HTTP 409; otherwise HTTP 503. TEST-FIN-08: 2 passed.

Allowed files only:
- packages/domain/treasury/allocate-fx-trade.ts
- tests/features/test-fin-06.spec.ts
- packages/contracts/src/treasury.ts — additive Fin06 types only

Required behavior:
- Never return ok:true.
- customerTermsDriftFromTradeAllocation === true => POLICY_UNAVAILABLE, HTTP 409.
- Otherwise => dependency_unavailable, HTTP 503, because the FX/treasury store is not implemented and T-FIN-01 remains HOLD.
- Trade allocations must equal actual cost and must never drift customer terms. Customer terms remain unchanged.
- Pure checker only: no DB access, no money movement, no executeCommand, and no customer-term drift.
- Reuse Fin05CommandContext or define a WorkerContext pick named Fin06CommandContext.
- TEST-FIN-06 must cover the drift rejection and otherwise-unavailable outcomes, with no ok:true result.

HOLD: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-05, T-TX-06, T-TX-10, T-FUND-02, T-FUND-03, T-LEDGER-02.

Authorization is limited to this checker, its specified tests, and additive Fin06 contract types in the three allowed files. Any broader scope is HOLD.
