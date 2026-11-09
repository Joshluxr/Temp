BATCH-OK

Authorize only the limited T-KYC-01 startIdentity pure checker described below.

T-KYC-04 landed: stale/unavailable COMPLIANCE_HOLD returns 409; fresh returns 503; never clear. TEST-KYC-04: 4 passed.

Holds remain: T-CORE-02, T-PLAT-08, T-EXT-02, T-EXT-04.

Allowed files only:
- packages/domain/compliance/start-identity.ts
- tests/features/test-kyc-01.spec.ts
- packages/contracts/src/compliance.ts — existing file; additive Kyc01 types only.

Required behavior:
- Never return ok: true and never approve a customer.
- captureCallbackReceived === true: still not approved; return CAPABILITY_UNAVAILABLE or COMPLIANCE_HOLD, retryable: false, HTTP 409. A capture callback alone never approves a customer.
- captureCallbackReceived === false: return HTTP 503 with dependency_unavailable because the hosted identity session / T-ADAPTER-01 is not implemented.
- Pure checker only: no database access, no money operations, no executeCommand, and no identity provider calls.
- No identity_decisions writes.

Authorization covers this exact checker and its focused tests only. Any work outside these files, types, or behavior is HOLD.
