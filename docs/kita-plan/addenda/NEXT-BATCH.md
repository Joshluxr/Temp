BATCH-OK

Authorize only T-AUTH-07: implement `exchangeMobileCode` as a PURE checker, with its tests and additive Auth07 contract types.

T-AUTH-06 landed: `outstandingRefundOrObligation === true` returns `FUNDING_PENDING`, HTTP 409; otherwise HTTP 503. TEST-AUTH-06: 2 passed.

Allowed files only:
- `packages/domain/identity/exchange-mobile-code.ts`
- `tests/features/test-auth-07.spec.ts`
- `packages/contracts/src/identity.ts` — additive Auth07 types only.

Reuse `Auth01CommandContext` without changing it. No DB access, money operations, or `executeCommand`. Never return `ok: true`, issue a mobile session, or treat biometric unlock as KYC evidence.

Required behavior:
- If `expiredKeyOrHostileDeepLink === true`, return `unauthorized`, HTTP 403. Expired key or hostile deep link requires safe reauthentication.
- Otherwise return `CAPABILITY_UNAVAILABLE` or `dependency_unavailable`, HTTP 503, because the mobile session store is not implemented.

Tests must verify both branches and that neither yields success, issues a mobile session, or treats biometric unlock as KYC evidence. Do not implement the mobile session store or expand this scope. If these constraints cannot be met, HOLD.

Holds remain: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04.
