BATCH-OK

Authorize only T-AUTH-06: implement `requestClosure` as a PURE checker, with its tests and additive Auth06 contract types.

T-AUTH-05 landed: `deviceRevoked === true` returns HTTP 403; otherwise HTTP 503, with no token refresh. TEST-AUTH-05: 2 passed.

Allowed files only:
- `packages/domain/identity/request-closure.ts`
- `tests/features/test-auth-06.spec.ts`
- `packages/contracts/src/identity.ts` — additive Auth06 types only.

Reuse `Auth01CommandContext` without changing it. No DB access, money operations, or `executeCommand`. Never return `ok: true`, close an account, or drop outstanding refund or lawful records.

Required behavior:
- If `outstandingRefundOrObligation === true`, return `FUNDING_PENDING`, HTTP 409. Closure preserves outstanding refund and lawful records.
- Otherwise return `dependency_unavailable`, HTTP 503, because the closure/liability store is not implemented.

Tests must verify both branches and that neither yields success, closes an account, or drops outstanding refund or lawful records. Do not implement the closure/liability store or expand this scope. If these constraints cannot be met, HOLD.

Holds remain: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04.
