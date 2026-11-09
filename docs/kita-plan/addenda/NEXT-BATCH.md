BATCH-OK

Authorize only T-AUTH-02: a pure revokeSession checker. This authorization does not permit financial authentication or a live session.

Accepted handoff: T-AUTH-01 landed; unverified returns 403; verified returns 503 and is not financial authentication. TEST-AUTH-01: 2 passed.

Holds remain: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04.

Allowed files only:
- packages/domain/identity/revoke-session.ts
- tests/features/test-auth-02.spec.ts
- packages/contracts/src/identity.ts — additive Auth02 types only.

Required behavior:
- Reuse Auth01CommandContext.
- Never return ok:true.
- tokenRevoked === true returns unauthorized, status 403. A revoked token must never continue a financial command.
- Otherwise return dependency_unavailable, status 503, because the session store/OIDC is not implemented.
- Do not issue a live session or authorize any financial command.
- Pure checker only: no DB access, no money operations, no executeCommand calls, and no session mutation or external I/O.

TEST-AUTH-02 must cover the revoked 403 branch, the otherwise 503 branch, and rejection of financial continuation in both branches; no result may be ok:true.

Any work beyond this exact checker and the three allowed files is HOLD.
