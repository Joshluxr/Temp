BATCH-OK

Authorize only T-KYC-03: a pure `quarantineUpload` checker.

Landed: T-KYC-02 returns 409 COMPLIANCE_HOLD for laterAdverse; otherwise 503. TEST-KYC-02: 2 passed.
HOLD: T-CORE-02, T-PLAT-08, T-EXT-02, T-EXT-04.

Allowed implementation files only (relative to apps/kita):
- packages/domain/compliance/quarantine-upload.ts
- tests/features/test-kyc-03.spec.ts
- packages/contracts/src/compliance.ts — additive Kyc03 types only

Required behavior:
- Never return ok:true or grant analyst viewer access.
- infectedOrMalicious === true: return invalid_request (400) or SECURITY_FAILURE (409), with retryable:false. Infected uploads never reach an analyst viewer.
- infectedOrMalicious === false: return 503 dependency_unavailable because the scan pipeline is not implemented.
- Never return an access URL, including a short-lived URL.
- No DB access, documents-table writes, money operations, executeCommand, object-store writes, or public ACLs. Never expose upload bytes to an analyst.

Acceptance: TEST-KYC-03 covers both scan flag branches and confirms failure responses with no analyst access or access URL. Review must verify purity, prohibited side effects, and the three-file scope.

Implementation follows the GPU gpu-fqaf Qoder Efficient swarm workflow; VM Codex gpt-6.1-sol max reviews the returned changes. Failed review returns to Qoder as a fix batch. Any broader implementation remains HOLD.
