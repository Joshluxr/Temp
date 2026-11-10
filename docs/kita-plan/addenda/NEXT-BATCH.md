BATCH-OK

Authorize only T-WAL-06: a `transferWallet` PURE checker.

Allowed files only:
- `packages/domain/wallets/transfer-wallet.ts`
- `tests/features/test-wal-06.spec.ts`
- `packages/contracts/src/wallets.ts` — additive Wal06 types only.

Required behavior:
- Never return `ok: true`. Never allow unscreened parties or unsupported cross-book P2P. Both parties must be screened; cross-book transfers are unsupported without a settlement policy.
- `unscreenedPartyOrCrossBookWithoutSettlementPolicy === true` returns `CAPABILITY_UNAVAILABLE`, HTTP 409.
- Otherwise return HTTP 503 with `dependency_unavailable`: journals/screening store is not implemented, and T-CORE-02 remains HOLD.
- No DB access, money movement, or `executeCommand`; no side effects or dependency implementation.
- Reuse `Wal05CommandContext`, or use a `WorkerContext` pick named `Wal06CommandContext`.

Tests must cover the exact true condition returning 409 and the fallback returning 503, with no successful result.

Landed: T-WAL-05 — `failedRefundDropsObligationOrClosureLosesFunds` true returns `COMPLIANCE_HOLD` 409; otherwise 503. TEST-WAL-05: 2 passed.

Holds remain: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-05, T-TX-06, T-TX-10, T-FUND-02, T-FUND-03, T-LEDGER-02.

Authorization covers this exact checker only. HOLD any scope expansion.
