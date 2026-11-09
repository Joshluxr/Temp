BATCH-OK

Authorize only T-KYC-06 evaluateRisk as a PURE checker within this exact scope.

T-KYC-05 landed: newListHit returns COMPLIANCE_HOLD 409; otherwise 503. TEST-KYC-05: 2 passed.
Holds remain: T-CORE-02, T-PLAT-08, T-EXT-02, T-EXT-04.

Files only:
- packages/domain/compliance/evaluate-risk.ts
- tests/features/test-kyc-06.spec.ts
- packages/contracts/src/compliance.ts — additive Kyc06 types only.

Required behavior:
- Never return ok:true and never reserve or authorize a transfer that would exceed the aggregate limit.
- wouldExceedAggregateLimit === true: LIMIT_EXCEEDED, HTTP 409, retryable false.
- wouldExceedAggregateLimit === false: HTTP 503, dependency_unavailable, because SERIALIZABLE limit buckets are not implemented.
- Concurrent transfers cannot exceed the aggregate limit: every checker invocation fails closed, including concurrent invocations; none may reserve or authorize a transfer. This checker does not implement SERIALIZABLE aggregate-limit enforcement.
- No DB access, money operations, executeCommand, or policies/cases writes.

Tests must verify both outcomes, absence of ok:true, and that concurrent invocations cannot reserve or authorize transfers.
No other implementation scope is authorized. If the checker requires work outside these boundaries, HOLD.
