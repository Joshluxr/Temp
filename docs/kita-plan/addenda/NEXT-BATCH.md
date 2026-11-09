BATCH-OK

Authorize only T-KYC-02: implement applyIdentityEvidence as a PURE checker.

Heartbeat (reported): Codex logged in; GPU disk 41%; astra gone. Plan A-N complete with SOL-REVIEW CONDITIONAL-PASS.

T-KYC-01 landed: capture callback returns COMPLIANCE_HOLD 409; otherwise 503. TEST-KYC-01: 2 passed.

Holds remain: T-CORE-02, T-PLAT-08, T-EXT-02, T-EXT-04.

Allowed files only:
- packages/domain/compliance/apply-identity-evidence.ts
- tests/features/test-kyc-02.spec.ts
- packages/contracts/src/compliance.ts — additive Kyc02 types only

Required behavior:
- Never return ok:true and never authorize a new payout.
- laterAdverseDecision === true: COMPLIANCE_HOLD, HTTP 409, retryable false. A later adverse decision blocks a new payout.
- laterAdverseDecision === false: HTTP 503, dependency_unavailable, because the identity decision store and T-KYC-01 live provider are not implemented.
- No DB access, no money operations, no executeCommand, and no identity_decisions writes.
- TEST-KYC-02 must cover both branches and verify that neither returns ok:true or authorizes a new payout.

This authorizes only the exact checker and its scoped types/tests. Any scope expansion is HOLD. Use the established GPU Qoder Efficient coding and Sol max review flow.
