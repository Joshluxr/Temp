BATCH-OK

Authorize only T-ADM-05: a pure decideApproval checker.

Files only:
- packages/domain/admin/decide-approval.ts
- tests/features/test-adm-05.spec.ts
- packages/contracts/src/admin.ts — additive Adm05 types only

Required behavior:
- Never return ok:true and never grant command authority.
- samePersonSecondLogin === true: return unauthorized or APPROVAL_STALE, HTTP 409 or 403, retryable:false. A second login of the same person cannot approve.
- Otherwise return HTTP 503 dependency_unavailable because the approvals store is not implemented.
- No DB, no money operations, no executeCommand.

Tests must verify these fail-closed outcomes. No other files or work are authorized.

Landed: T-ADM-04 — unqualified 403; overrideBlockedProperty APPROVAL_REQUIRED 409; otherwise 503. TEST-ADM-04: 3 passed.

HOLD: T-ADM-03, T-ADM-06, T-CORE-02, T-PLAT-08, T-EXT-02, T-EXT-04, T-QUOTE-01, T-REWARD-01.
