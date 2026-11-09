BATCH-OK

Authorize only T-AUTH-05: implement `listSessions` as a PURE checker, with its tests and additive Auth05 contract types.

T-AUTH-04 landed: `bypassNewDestinationHold === true` returns `COMPLIANCE_HOLD`, HTTP 409; otherwise HTTP 503. TEST-AUTH-04: 2 passed.

Allowed files only:
- `packages/domain/identity/list-sessions.ts`
- `tests/features/test-auth-05.spec.ts`
- `packages/contracts/src/identity.ts` — additive Auth05 types only.

Reuse `Auth01CommandContext` without changing it. No DB access, money operations, or `executeCommand`. Never return `ok: true`, refresh a token, or keep SSE alive.

Required behavior:
- If `deviceRevoked === true`, return `unauthorized`, HTTP 403. A revoked device cannot refresh a token.
- Otherwise return `dependency_unavailable`, HTTP 503, because the session inventory store is not implemented.

Tests must verify both branches and that neither yields success, refreshes a token, or keeps SSE alive. Do not implement the session inventory store or expand this scope. If these constraints cannot be met, HOLD.

Holds remain: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04.
