BATCH-OK

Authorize only T-WAL-03: reserveWallet as a pure checker.

Recorded landing: T-WAL-02 — creditWithoutSettlementOrApprovedEvidence returns FUNDING_PENDING 409; otherwise 503. TEST-WAL-02: 2 passed.

Allowed implementation files, relative to apps/kita/:
- packages/domain/wallets/reserve-wallet.ts
- tests/features/test-wal-03.spec.ts
- packages/contracts/src/wallets.ts — additive Wal03 types only; preserve existing contracts.

Required behavior:
- Never return ok: true.
- If twoSimultaneousSpendsWouldOverdraw === true, return INSUFFICIENT_FUNDS with status 409. Two simultaneous spends cannot overdraw.
- Otherwise return dependency_unavailable with status 503 because the journals store is not implemented (T-CORE-02 remains HOLD).
- Reuse Wal02CommandContext, or define a WorkerContext pick named Wal03CommandContext.
- Pure checking only: no database access, money movement, executeCommand, persistence, reservations, or side effects.

TEST-WAL-03 must cover the overdraw rejection and the otherwise-503 path, and assert neither returns ok: true. Do not claim implemented journal storage or successful reservations.

HOLD remains unchanged for: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-05, T-TX-06, T-TX-10, T-FUND-02, T-FUND-03, T-LEDGER-02.

This authorization covers exactly the checker above in the three allowed files. Any broader work is HOLD.
