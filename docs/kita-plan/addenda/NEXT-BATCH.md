BATCH-OK

Authorize only T-PAY-05: implement applyPayoutReturn as a PURE checker through the GPU Qoder Efficient coding swarm and existing review flow.

Files allowed:
- packages/domain/payouts/apply-payout-return.ts
- tests/features/test-pay-05.spec.ts
- packages/contracts/src/payouts.ts — additive Pay05 types only

Reuse Pay06CommandContext. No DB, money movement, executeCommand, refund, or other side effects. Never return ok:true and never grant a refund. Never exceed the returned-amount cap or erase the original delivered timestamp.

Required behavior:
- returnExceedsCapOrErasesDeliveredTimestamp === true: PROVIDER_OUTCOME_UNKNOWN, HTTP 409. Cap the returned amount and preserve the original delivered timestamp.
- Otherwise: dependency_unavailable, HTTP 503, because the payout-return store is not implemented. T-TX-06 remains HOLD.

TEST-PAY-05 must cover both branches and the cap, original delivered timestamp, no-success, and no-refund invariants within the allowed test file. No persistence or execution path is authorized.

Landed: T-PAY-04 — expiryAloneFabricatesReturn yields PROVIDER_OUTCOME_UNKNOWN 409; otherwise 503. TEST-PAY-04: 2 passed.

HOLD: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-05, T-TX-06, T-TX-10, T-FUND-02, T-FUND-03.

Any work beyond this exact checker and these files is HOLD.
