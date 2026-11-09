BATCH-OK

T-ADM-12 landed: `reenableWithoutApproval` → `APPROVAL_REQUIRED` (409); otherwise 503; never persist pause. TEST-ADM-12: 2 passed.

Holds remain: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04.

Authorize only T-AUTH-01 `verifyContact` as a PURE checker.

Files only:
- `packages/domain/identity/verify-contact.ts`
- `tests/features/test-auth-01.spec.ts`
- `packages/contracts/src/identity.ts` — new additive Auth01 types only.

Required behavior:
- Never return `ok: true`. Never treat a contact as financial authorization.
- `contactVerified === false` → `unauthorized` (403): “Unverified contact cannot authorize transfer.”
- Otherwise → `dependency_unavailable` (503), because identity store/T-IDENTITY-01 live verification is not implemented.
- No DB access, no money operations, no `executeCommand`, and no side effects.

Tests must verify both branches and that no input produces success. No other task or file is authorized.
