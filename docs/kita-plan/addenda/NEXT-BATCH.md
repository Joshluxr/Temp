BATCH-OK

Authorize only T-QUOTE-04: a `validateRate` PURE checker.

Allowed files only:
- `packages/domain/quotes/validate-rate.ts`
- `tests/features/test-quote-04.spec.ts`
- `packages/contracts/src/quotes.ts` — additive Quote04 types only.

Required behavior:
- Never return `ok: true` and never execute from a stale cached rate.
- `staleQuoteWouldExecuteFromCache === true` returns `RATE_STALE`, HTTP 409. Stale quote unavailable; no cached execution fallback.
- Otherwise return HTTP 503 with `dependency_unavailable`: the executable FX store is not implemented, and T-QUOTE-01 remains HOLD.
- No DB access, money movement, `executeCommand`, or cached execution; no side effects or dependency implementation.
- Reuse a `WorkerContext` pick named `Quote04CommandContext`.

Tests must cover the exact true condition returning 409 and the fallback returning 503, with no successful result.

Landed: T-WAL-06 — `unscreenedPartyOrCrossBookWithoutSettlementPolicy === true` returns `CAPABILITY_UNAVAILABLE` 409; otherwise 503. TEST-WAL-06: 2 passed. PR #82.

Holds remain: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-05, T-TX-06, T-TX-10, T-FUND-02, T-FUND-03, T-LEDGER-02.

Authorization covers this exact checker only. HOLD any scope expansion.
