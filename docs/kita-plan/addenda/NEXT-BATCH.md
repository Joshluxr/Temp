BATCH-OK

Authorize only the exact T-FIN-02 allocateCorrection PURE checker described below.

Landed: T-FIN-06, PR #76. customerTermsDriftFromTradeAllocation === true => POLICY_UNAVAILABLE, HTTP 409; otherwise dependency_unavailable, HTTP 503. TEST-FIN-06: 2 passed.

Allowed files only:
- packages/domain/ledger/allocate-correction.ts
- tests/features/test-fin-02.spec.ts
- packages/contracts/src/ledger.ts — additive Fin02 types only

Required behavior:
- Never return ok:true.
- Never edit the original journal.
- cumulativePartialFeesDoNotSumOnFinalRefund === true => LIMIT_EXCEEDED, HTTP 409. Cumulative partial fees must sum exactly on final refund.
- Otherwise => dependency_unavailable, HTTP 503, because the journals store is not implemented and T-FIN-01 remains HOLD.
- PURE checker only: no DB access, no money movement, no executeCommand, and no original-journal edit.
- Reuse Fin08CommandContext or define a WorkerContext pick named Fin02CommandContext.
- TEST-FIN-02 must cover the final-refund cumulative-fee rejection and otherwise-unavailable outcomes, with no ok:true result and no original-journal edit.

HOLD: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-05, T-TX-06, T-TX-10, T-FUND-02, T-FUND-03, T-LEDGER-02.

Authorization is limited to this checker, its specified tests, and additive Fin02 contract types in the three allowed files. Any broader scope is HOLD.
