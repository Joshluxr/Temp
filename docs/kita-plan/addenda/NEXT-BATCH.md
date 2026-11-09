BATCH-OK

Authorize T-ADM-04 only: implement decideCase as a PURE checker within the exact scope below.

Landed:
- T-ADM-02: unauthorized => 403; otherwise => 503, with no invented rows.
- TEST-ADM-02: 2 passed.

HOLD:
- T-ADM-03: would mutate transfers.
- T-ADM-06: refunds.
- T-CORE-02, T-PLAT-08, T-EXT-02, T-EXT-04, T-QUOTE-01, T-REWARD-01.

T-ADM-04 permitted files only:
- packages/domain/admin/decide-case.ts
- tests/features/test-adm-04.spec.ts
- packages/contracts/src/admin.ts — additive Adm04 types only.

Constraints:
- PURE checker only. No DB access, money operations, executeCommand, or sanctions override.
- Never return ok: true. Never override a blocked-property restriction.

Required behavior, in precedence order:
1. unqualifiedRole === true => unauthorized, HTTP 403, retryable: false. An unqualified role cannot override a blocked-property restriction, including when both flags are true.
2. Otherwise, overrideBlockedProperty === true => APPROVAL_REQUIRED, HTTP 409, retryable: false. Deny the override; no sanctions override is authorized.
3. Otherwise => dependency_unavailable, HTTP 503, because the case decision store is not implemented. No invented decision rows.

Verification: tests/features/test-adm-04.spec.ts must cover each branch, both flags true, and the invariant that no result has ok: true. All listed HOLD items remain on HOLD.
