BATCH-OK

Authorize only the limited T-FUND-07 attributeIncomingCash PURE checker described below.

T-PAY-03 landed: acceptedRequestMarksRecipientCredited => PROVIDER_OUTCOME_UNKNOWN 409; otherwise 503, no credit. TEST-PAY-03: 2 passed.

HOLD: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-05, T-TX-06, T-TX-10, T-FUND-02, T-FUND-03.

Files allowed in the next batch only:
- packages/domain/funding/attribute-incoming-cash.ts
- tests/features/test-fund-07.spec.ts
- packages/contracts/src/funding.ts — additive Fund07 types only

Reuse Fund01CommandContext.

Required behavior:
- Never return ok:true and never recognize unowned cash as revenue.
- unownedCashRecognizedAsRevenue === true => POLICY_UNAVAILABLE 409. Unowned cash remains suspense, not revenue.
- Otherwise return 503 dependency_unavailable because the reconciliation/journal store is not implemented; T-FIN-03 remains HOLD.

Pure checker only: no DB access, no money movement or mutation, no executeCommand, and no revenue recognition. Tests must cover both refusal branches and confirm there is no success result. Do not implement reconciliation or journal storage, expand the contracts beyond additive Fund07 types, or change any other file.

Only this exact checker, its additive types, and its tests are authorized. Any broader implementation is HOLD.
