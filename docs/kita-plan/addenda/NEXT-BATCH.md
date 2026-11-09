BATCH-OK

Authorize only the limited T-ADM-11 archiveAudit PURE checker described below. This is implementation authorization for that exact scope only.

T-ADM-10 landed: self-grant returns 403; revoked approval returns APPROVAL_STALE 409; otherwise 503. TEST-ADM-10: 3 passed.

Allowed files only:
- packages/domain/admin/archive-audit.ts
- tests/features/test-adm-11.spec.ts
- packages/contracts/src/admin.ts — additive Adm11 types only

Required behavior:
- Pure checker: no DB, no money operations, no executeCommand.
- Never return ok:true and never claim concurrent hash anchors were verified.
- If archiveUnavailable === true OR chainMismatch === true, return SECURITY_FAILURE, HTTP 409, retryable false. This takes precedence over the fallback.
- Otherwise return HTTP 503, dependency_unavailable, because the independent WORM archive / T-PLAT-03 is not implemented.
- Tests must cover both security-failure triggers, their precedence, the 503 fallback, and the prohibition on success or concurrent-anchor verification claims.
- Any expansion beyond these files, additive types, or checker behavior is HOLD.

Holds remain: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04.
T-FIN-01: HOLD (ledger).
T-ADM-12: HOLD if it would persist route pauses that affect money.
