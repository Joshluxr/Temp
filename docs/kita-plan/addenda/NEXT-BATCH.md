BATCH-OK

Authorize only the limited T-PAY-04 applyCashPickup PURE checker described below. This authorization is for the exact checker only.

T-PAY-01 landed: unknownFirstProviderWouldDispatchSecond returns PROVIDER_OUTCOME_UNKNOWN 409; otherwise 503 with no dispatch. TEST-PAY-01: 2 passed.

Holds: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-05, T-TX-06, T-TX-10, T-FUND-02, T-FUND-03.

T-PAY-04 scope:
- Implement applyCashPickup as a PURE checker. No DB, no money, no executeCommand, no fabricated return.
- Reuse Pay06CommandContext.
- Never return ok:true.
- Never fabricate a return from expiry alone, and never treat available as collected. Available and collected differ.
- expiryAloneFabricatesReturn === true => PROVIDER_OUTCOME_UNKNOWN 409.
- Otherwise return 503 dependency_unavailable because the pickup/collection store is not implemented.

Files only:
- packages/domain/payouts/apply-cash-pickup.ts
- tests/features/test-pay-04.spec.ts
- packages/contracts/src/payouts.ts — additive Pay04 types only.

Coding remains with the GPU gpu-fqaf Qoder CLI Efficient swarm; Sol max reviews the returned changes. No other work is authorized by this batch.
