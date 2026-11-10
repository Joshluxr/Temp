BATCH-OK

Authorize exactly T-PAY-03: applyWalletPayout as a PURE checker. Reuse Pay06CommandContext.

Allowed files only:
- packages/domain/payouts/apply-wallet-payout.ts
- tests/features/test-pay-03.spec.ts
- packages/contracts/src/payouts.ts — additive Pay03 types only.

Required behavior:
- Never return ok:true.
- Never treat aggregator/provider acceptance as recipient credited.
- Never dispatch GCash/Maya credit.
- acceptedRequestMarksRecipientCredited === true => PROVIDER_OUTCOME_UNKNOWN, HTTP 409. Accepted request is not recipient credited.
- Otherwise => HTTP 503, dependency_unavailable, because the wallet-payout proof store is not implemented.
- No DB, no money movement, no executeCommand, no credit.
- TEST-PAY-03 must verify both required outcomes and that no path returns ok:true.

T-PAY-02 landed:
- splitBypassesCutoffHolidayOrAmount => LIMIT_EXCEEDED, HTTP 409.
- Otherwise => CAPABILITY_UNAVAILABLE, HTTP 503, no rail.
- TEST-PAY-02: 2 passed.

Holds remain:
T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-05, T-TX-06, T-TX-10, T-FUND-02, T-FUND-03.

This authorization is limited to the exact checker, focused tests, and additive Pay03 types above. Any broader scope is HOLD.
