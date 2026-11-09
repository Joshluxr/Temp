BATCH-OK

Authorize only T-AUTH-04: implement `recoverAccount` as a PURE checker, with its tests and additive Auth04 contract types.

T-AUTH-03 landed: `newDestinationWithoutFreshAssurance` returns `APPROVAL_REQUIRED`, HTTP 409; otherwise HTTP 503. TEST-AUTH-03: 2 passed.

Allowed files only:
- `packages/domain/identity/recover-account.ts`
- `tests/features/test-auth-04.spec.ts`
- `packages/contracts/src/identity.ts` — additive Auth04 types only.

Reuse `Auth01CommandContext` without changing it. No DB access, money operations, or `executeCommand`. Never return `ok: true`, issue a recovered session, or lift a new-destination hold.

Required behavior:
- If `bypassNewDestinationHold === true`, return `COMPLIANCE_HOLD`, HTTP 409. Recovery cannot bypass new-destination hold.
- Otherwise return `dependency_unavailable`, HTTP 503, because the recovery/hold store is not implemented.

Tests must verify both branches and that neither yields success, issues a recovered session, or lifts a new-destination hold. Do not implement the recovery/hold store or expand this scope. If these constraints cannot be met, HOLD.

Holds remain: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04.
