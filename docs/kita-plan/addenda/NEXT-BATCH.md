BATCH-OK

Authorize only T-KYC-04: a pure evaluateScreening checker with the fail-closed behavior below.

Reported handoff: T-DEPEND-01 landed; evaluateActivation never enabled. TEST-DEPEND-01: 7 passed. These results are carried forward, not newly verified here.

Holds remain: T-CORE-02, T-PLAT-08, T-EXT-02, T-EXT-04. Do not claim or infer US→PH approval.

Allowed implementation files only:
- packages/domain/compliance/evaluate-screening.ts
- tests/features/test-kyc-04.spec.ts
- packages/contracts/src/compliance.ts — additive Kyc04 types only; creating this file is allowed.

Required behavior:
- Never return ok:true or a "clear" pass that would allow payout.
- If listUnavailable or listStale is true, return COMPLIANCE_HOLD, retryable:false, status:409. This includes either flag alone and both together. An unavailable or stale list must never silently pass.
- A fresh list still returns status:503 with dependency_unavailable because the live screening adapter/T-KYC-02 is not implemented.
- Keep the checker pure: no database access, no money operations, no executeCommand, no provider screening calls, and no screenings table writes.
- Keep evaluateActivation disabled. Do not enable payouts or expand this batch into adapter implementation or any held task.

TEST-KYC-04 must cover unavailable, stale, both flags, and fresh-list outcomes, including the absence of ok:true or a payout-enabling "clear" result. Do not report these tests as passed until they have run.

Execution follows the session roles: sync to gpu-fqaf; Qoder CLI Efficient Agent Teams implements this exact scope there; return the bundle to the VM for Codex gpt-6.1-sol at max review. Failed review returns to Qoder as a fix batch. This authorization covers only the checker above.
