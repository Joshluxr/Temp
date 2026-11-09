BATCH-OK

Authorize only T-KYC-07: recordFiling PURE checker. Implementation follows the established Qoder Efficient GPU workflow; this authorization adds no other scope.

T-KYC-06 landed: over aggregate returns LIMIT_EXCEEDED 409; otherwise 503; concurrent requests fail closed. TEST-KYC-06: 3 passed (operator-reported).

Holds remain: T-CORE-02, T-PLAT-08, T-EXT-02, T-EXT-04.

Only permitted implementation files:
- packages/domain/compliance/record-filing.ts
- tests/features/test-kyc-07.spec.ts
- packages/contracts/src/compliance.ts — additive Kyc07 types only; preserve existing contracts.

Required behavior:
- recordFiling is a pure checker: no DB access, no money operations, no executeCommand, and no cases/documents writes.
- Never return ok: true. All paths fail closed.
- actorRole === 'support' returns unauthorized, HTTP 403, retryable: false. Support cannot read AML filings or confidential rationale. Do not include the filing body or confidential rationale in problem details or any response.
- actorRole === 'compliance' returns dependency_unavailable, HTTP 503, because the case ACL and filing store are not implemented. Return no filing contents or confidential rationale.
- No AML filing text or confidential rationale is returned to any actor. No PII or filing payload enters traces.

TEST-KYC-07 must verify the support 403 and compliance 503 outcomes, absence of successful results, and non-disclosure of supplied filing text/confidential rationale in responses, problem details, or any emitted traces. Confirm purity and the exact file allowlist during review.

Anything beyond this exact checker requires a new authorization; the listed holds remain in force.
