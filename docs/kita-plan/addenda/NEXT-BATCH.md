BATCH-OK

Authorize T-ADM-09 only: a pure `revealPii` checker.

Files only:
- `packages/domain/admin/reveal-pii.ts`
- `tests/features/test-adm-09.spec.ts`
- `packages/contracts/src/admin.ts` — additive Adm09 types only.

Required behavior:
- Never return `ok: true`, unmasked PII, or a live export URL.
- If `missingStepUp === true` OR `missingReason === true` OR `expired === true`, return `unauthorized` (403) or `APPROVAL_REQUIRED` (409), with `retryable: false`.
- Otherwise return 503 `dependency_unavailable` because the timed grant store is not implemented.
- Enforce step-up, reason, audit, and expiry. Never emit PII in traces.
- No DB access, money operations, or `executeCommand`. Do not implement the timed grant store or expand this batch.

Landed: T-ADM-07 — missing evidence/reviewer returns `APPROVAL_REQUIRED` 409; otherwise 503, never paid. TEST-ADM-07: 4 passed.

Holds remain: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04.
