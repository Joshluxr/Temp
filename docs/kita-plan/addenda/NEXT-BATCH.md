BATCH-OK

Authorize only T-AUTH-03: implement `requireStepUp` as a PURE checker. This authorization covers the checker and its tests only; it does not authorize a financial action.

T-AUTH-02 landed: `tokenRevoked` returns 403; otherwise 503 with no live session. TEST-AUTH-02: 2 passed.

Allowed files only:
- `packages/domain/identity/require-step-up.ts`
- `tests/features/test-auth-03.spec.ts`
- `packages/contracts/src/identity.ts` — additive Auth03 types only.

Reuse `Auth01CommandContext` without changing it. No DB access, money operations, or `executeCommand`. Never return `ok: true`, bind a live step-up, or authorize a financial action.

Required behavior:
- If `newDestinationWithoutFreshAssurance === true`, return `APPROVAL_REQUIRED`, HTTP 409. New destination needs fresh assurance.
- Otherwise return `dependency_unavailable`, HTTP 503, because the passkey/step-up store is not implemented.

Tests must verify both branches and that neither yields success or live step-up authorization. Do not implement the passkey/step-up store or expand this scope. If these constraints cannot be met, HOLD.

Holds remain: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04.
