BATCH-OK

Authorize only the exact T-FIN-05 reserveLiquidity PURE checker below. Any required scope expansion is HOLD.

T-FIN-04 landed in PR #72: forceMatchWithoutApprovedJournal === true returns POLICY_UNAVAILABLE (409); otherwise 503. TEST-FIN-04: 2 passed.

HOLD: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-05, T-TX-06, T-TX-10, T-FUND-02, T-FUND-03, T-LEDGER-02.

Allowed implementation files only, relative to apps/kita/:
- packages/domain/treasury/reserve-liquidity.ts
- tests/features/test-fin-05.spec.ts
- packages/contracts/src/treasury.ts — additive Fin05 types only

Required behavior:
- Never return ok:true and never spend the same last prefund twice.
- concurrentSpendSameLastPrefund === true returns LIQUIDITY_UNAVAILABLE with HTTP 409. Concurrent transfers cannot spend the same last prefund.
- Otherwise return HTTP 503 dependency_unavailable because the liquidity/ledger store is not implemented; T-LEDGER-02 remains HOLD.
- Reuse Fin04CommandContext or a WorkerContext pick named Fin05CommandContext.
- Pure checker only: no DB access, money movement, executeCommand, persistence, or reservation creation or mutation.

Validation is confined to tests/features/test-fin-05.spec.ts: cover the true flag's 409 liquidity result, false/omitted flag's 503 dependency result, and absence of success or reservation behavior.

Follow the established VM Codex / GPU Qoder roles: Qoder Efficient swarm implements on the GPU; Sol max reviews the returned changes. Failed review returns to Qoder as a fix batch within this exact scope.
