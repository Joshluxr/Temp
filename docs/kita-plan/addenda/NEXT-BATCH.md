BATCH-OK

Authorize only T-TX-08 `appendSupportMessage` as a PURE checker with the exact scope below.

T-GROW-05 landed: `oscillatingOrStaleRate` returns `RATE_STALE` / 409; otherwise 503. No money operations. TEST-GROW-05: 2 passed.

Allowed files only:
- `packages/domain/transfers/append-support-message.ts`
- `tests/features/test-tx-08.spec.ts`
- `packages/contracts/src/transfers.ts` — additive Tx08 types only.

Required behavior:
- Never return `ok: true` and never attach evidence to the wrong account or case.
- When `wrongAccountOrCrossCaseAttachment === true`, return `unauthorized` / 403 as a scoped denial. A wrong account cannot read or attach case evidence. This denial takes precedence over dependency unavailability.
- Otherwise return `dependency_unavailable` / 503 because the case/document store is not implemented.
- Keep the checker pure: no DB access, no money operations, and no `executeCommand`.
- Reuse `Grow05CommandContext` or a `WorkerContext` pick named `Tx08CommandContext`.
- Tests must cover the 403 scoped denial, the 503 fallback, and the absence of any `ok: true` outcome.

Holds remain: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06.

T-TX-01 through T-TX-07 money slices are not authorized. No broader T-TX-08 implementation is authorized.
