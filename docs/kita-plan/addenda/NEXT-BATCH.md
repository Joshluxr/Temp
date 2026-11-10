BATCH-OK

Authorize only T-GROW-09 reportRewardLiability as a PURE checker. No DB, no money, no executeCommand, and no fiat implication. Never return ok:true or imply a fiat balance.

Files only:
- packages/domain/rewards/report-reward-liability.ts
- tests/features/test-grow-09.spec.ts
- packages/contracts/src/rewards.ts — additive Grow09 types only

Required behavior:
- issuedVestedRedeemedExpiredDisagreeProvision === true => VERSION_CONFLICT, HTTP 409. Issued/vested/redeemed/expired totals must reconcile to provision.
- Otherwise => HTTP 503 dependency_unavailable because the journals/points store is not implemented. T-REWARD-01 remains HOLD.

Reuse Grow03CommandContext or a WorkerContext pick named Grow09CommandContext.

Landed: T-GROW-03 lastBudgetUnitReservedTwice => LIMIT_EXCEEDED, HTTP 409; otherwise HTTP 503. TEST-GROW-03: 2 passed.

HOLD: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-05, T-TX-06, T-TX-10, T-FUND-02, T-FUND-03, T-LEDGER-02.

Authorization is limited to this exact checker and these files. All listed holds remain in force.
