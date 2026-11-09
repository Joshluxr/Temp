BATCH-OK

Authorize only the T-ADM-07 ingestManualEvidence pure checker described below.

Landed: T-ADM-05 returns APPROVAL_STALE 409 for samePersonSecondLogin; otherwise 503. TEST-ADM-05: 2 passed.

Holds remain: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04.

Allowed implementation files only:

- packages/domain/admin/ingest-manual-evidence.ts
- tests/features/test-adm-07.spec.ts
- packages/contracts/src/admin.ts — additive Adm07 types only

Required behavior:

- Pure checker only: no DB, no money operations, no executeCommand, and never set paid.
- Never return ok:true and never produce a manual paid result.
- If missingVerifiedEvidence === true OR missingReviewer === true, return APPROVAL_REQUIRED, HTTP 409, retryable false. No manual paid without verified evidence and reviewer.
- Otherwise return HTTP 503, dependency_unavailable, because evidence mapping and T-PLAT-04 live ingest are not implemented. Do not mark paid.

Regression coverage must verify both missing-input cases, both flags together, and the otherwise-503 path; every outcome must preserve the no-success/no-paid constraints.

Authorization is limited to this checker, its tests, and additive Adm07 contract types in the three listed files. All listed holds remain in effect.
