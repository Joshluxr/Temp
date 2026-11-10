BATCH-OK

Authorize T-FIN-07 only: a PURE closePeriod checker, within the exact scope below.

Allowed files:
- packages/domain/ledger/close-period.ts
- tests/features/test-fin-07.spec.ts
- packages/contracts/src/ledger.ts — additive Fin07 types only

Required behavior:
- Never return ok:true.
- Never accept unauthorized backdated posting into a closed period.
- When unauthorizedBackdatedPostingIntoClosedPeriod === true, return POLICY_UNAVAILABLE with HTTP 409 and the message: Closed period cannot receive unauthorized backdated posting.
- Otherwise return HTTP 503 with dependency_unavailable because the ledger period store is not implemented (T-FIN-01 HOLD).
- Reuse Fin05CommandContext, or a WorkerContext pick named Fin07CommandContext.

No database access, money movement, executeCommand, or backdated posting. No additional files or behavior are authorized. Tests must cover both outcomes and assert neither returns ok:true. If this exact scope cannot be maintained, HOLD.

Implementation follows the existing GPU gpu-fqaf / Qoder Efficient swarm flow; VM Codex reviews the returned changes.

Landed:
- T-FIN-05: concurrentSpendSameLastPrefund yields LIQUIDITY_UNAVAILABLE / HTTP 409; otherwise HTTP 503.
- TEST-FIN-05: 2 passed.

Existing holds remain:
T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-05, T-TX-06, T-TX-10, T-FUND-02, T-FUND-03, T-LEDGER-02.
