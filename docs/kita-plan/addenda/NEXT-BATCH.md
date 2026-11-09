BATCH-OK

Authorize T-KYC-05 rescreenDelta as a pure checker within this exact scope.

T-KYC-03 landed: infected returns SECURITY_FAILURE 409; otherwise 503 with no URL. TEST-KYC-03: 2 passed.
Holds remain: T-CORE-02, T-PLAT-08, T-EXT-02, T-EXT-04.

Files only:
- packages/domain/compliance/rescreen-delta.ts
- tests/features/test-kyc-05.spec.ts
- packages/contracts/src/compliance.ts — additive Kyc05 types only.

Required behavior:
- Never return ok:true and never dispatch a queued payout.
- newListHit === true: COMPLIANCE_HOLD, HTTP 409, retryable false. A new list hit stops the queued payout before dispatch.
- newListHit === false: HTTP 503, dependency_unavailable, because the live delta cursor / T-PLAT-05 is not implemented.
- No DB access, screenings or holds writes, money operations, executeCommand, or payout dispatch.

Tests must verify both outcomes, absence of ok:true, and that queued payouts cannot be dispatched.
No other implementation scope is authorized. If the checker requires work outside these boundaries, HOLD.
