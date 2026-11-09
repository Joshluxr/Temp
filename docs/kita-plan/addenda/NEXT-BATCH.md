BATCH-OK

Authorize only T-EXT-03: verifyBusiness as a pure checker. This does not authorize business payout or live KYB.

Recorded status:
- T-EXT-01 landed: unapproved markets return 409; US→PH remittance returns 503; never ok:true.
- TEST-EXT-01: 15 passed.
- T-CORE-02 HOLD.
- T-PLAT-08 HOLD.
- T-EXT-02 HOLD (custody/PHP cash).
- T-EXT-04 HOLD (batch payouts).

Authorized files only:
- packages/domain/business/verify-business.ts
- tests/features/test-ext-03.spec.ts
- packages/contracts/src/business.ts — additive Ext03 types only; preserve existing contracts.

Required behavior:
- Never return ok:true or claim a verified business that can pay out.
- If individualKycOnly === true, return HTTP 409 with APPROVAL_REQUIRED and retryable:false. Individual KYC alone cannot authorize business payout; this branch takes precedence regardless of other flags.
- For every other input, including kybPresent/signatoriesPresent, return HTTP 503 with dependency_unavailable. T-KYC-04/T-ADM-05 live KYB is not implemented. Missing or false individualKycOnly never authorizes payout.
- Pure checking only: no DB access, business_profiles writes, journals, money movement, executeCommand, provider KYB calls, or other external side effects.

Validation in tests/features/test-ext-03.spec.ts:
- Assert 409, APPROVAL_REQUIRED, retryable:false for individual-only input, including when KYB/signatory flags are supplied.
- Assert 503 dependency_unavailable for complete, partial, or absent KYB/signatory flags when individualKycOnly is false or omitted.
- Assert every result fails closed and never returns ok:true.
- Run the targeted TEST-EXT-03 suite and applicable contract/type checks; report actual results.

Execution follows the established GPU Qoder Efficient coding workflow, followed by VM Sol max review. Do not expand this batch, implement live KYB, enable payouts, or modify any other files. If the exact checker cannot be implemented within these constraints, HOLD and report the blocker.
