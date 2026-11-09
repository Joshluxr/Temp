BATCH-OK

Authorize only T-ADM-02: queryOpsQueue as a PURE checker.

Files permitted for this batch:
- packages/domain/admin/query-ops-queue.ts
- tests/features/test-adm-02.spec.ts
- packages/contracts/src/admin.ts — additive Adm02 types only.

Required behavior:
- No DB access, money operations, or executeCommand.
- Never return ok: true and never attach mutation rights to a projection.
- staffAuthorized === false => unauthorized, HTTP 403.
- Otherwise => dependency_unavailable, HTTP 503, because the live ops queue/T-TX-02 is not implemented.
- Do not invent transfer rows.

Landed: T-ADM-01 returns 403 for customer/unrelated; otherwise 503. TEST-ADM-01: 4 passed.

HOLD: T-CORE-02, T-PLAT-08, T-EXT-02, T-EXT-04, T-QUOTE-01, T-REWARD-01.
T-ADM-03: HOLD if it would mutate transfers/money.

Only the exact checker above is authorized. Any work outside this scope is HOLD.
