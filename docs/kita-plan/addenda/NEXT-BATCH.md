BATCH-OK

Authorize only T-GROW-03: reservePromotion as a pure checker.

T-GROW-02 landed: concurrentRedemptionExpiryOverspend maps to INSUFFICIENT_FUNDS, HTTP 409; otherwise HTTP 503. TEST-GROW-02: 2 passed.

Allowed implementation files only:
- packages/domain/rewards/reserve-promotion.ts
- tests/features/test-grow-03.spec.ts
- packages/contracts/src/rewards.ts — additive Grow03 types only.

Required behavior:
- Never return ok:true. Never reserve the last budget unit for two transfers; it may be reserved by one transfer only.
- lastBudgetUnitReservedTwice === true returns LIMIT_EXCEEDED, HTTP 409.
- Every other input returns dependency_unavailable, HTTP 503, because the campaign/points store is not implemented and T-REWARD-01 remains HOLD.
- Pure checking only: no DB access, money movement, reservations, side effects, or executeCommand.
- Reuse Grow02CommandContext or define Grow03CommandContext as a WorkerContext pick.

Tests must cover the duplicate last-budget-unit rejection, the unavailable fallback, and the absence of ok:true outcomes. No implementation beyond this checker is authorized.

HOLD: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-05, T-TX-06, T-TX-10, T-FUND-02, T-FUND-03, T-LEDGER-02.
