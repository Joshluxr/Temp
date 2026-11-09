BATCH-OK

Authorize only T-FUND-05: `recoverFunding`, a PURE checker reusing `Fund01CommandContext`.

Allowed implementation files only:
- `packages/domain/funding/recover-funding.ts`
- `tests/features/test-fund-05.spec.ts`
- `packages/contracts/src/funding.ts` — additive Fund05 types only.

Required behavior:
- Never return `ok: true`.
- `timeoutAfterDebitWouldRecharge === true` => `PROVIDER_OUTCOME_UNKNOWN`, HTTP 409.
- Otherwise => `dependency_unavailable`, HTTP 503, because the `provider_attempts`/inquiry store is not implemented.
- No DB access, money movement, provider calls, or `executeCommand`.
- Never create a second charge after timeout or unknown debit. Timeout after debit never creates a second charge.
- Tests must cover the 409 guard and the 503 fallback; no execution path may succeed or charge.

Landed: T-FUND-01 — `rawPanOrCvvPresent` => `CAPABILITY_UNAVAILABLE` 409; otherwise 503, no funds. TEST-FUND-01: 2 passed.

HOLD: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-05, T-TX-06, T-TX-10, T-FUND-02, T-FUND-03.

No other implementation scope is authorized.
