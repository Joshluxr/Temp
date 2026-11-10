BATCH-OK

Authorize T-FIN-08 only: resolveCreditOverlap as a pure checker.

Status supplied by operator: T-FIN-07 landed. unauthorizedBackdatedPostingIntoClosedPeriod returns POLICY_UNAVAILABLE / HTTP 409; otherwise HTTP 503. TEST-FIN-07: 2 passed. PR #74 pending.

Allowed files only:
- packages/domain/ledger/resolve-credit-overlap.ts
- tests/features/test-fin-08.spec.ts
- packages/contracts/src/ledger.ts — additive Fin08 types only

Required behavior:
- Never return ok:true.
- Never issue a second automatic customer credit for the same entitlement.
- secondAutomaticCreditSameEntitlement === true returns POLICY_UNAVAILABLE / HTTP 409. No second automatic customer credit for the same entitlement.
- Otherwise return dependency_unavailable / HTTP 503 because the refund/dispute store is not implemented; T-TX-06 remains HOLD.
- Reuse Fin07CommandContext, or use a WorkerContext Pick named Fin08CommandContext.

Scope and acceptance:
- Pure checker only: no DB access, money movement, side effects, or executeCommand.
- Cover the exact-true 409 branch and the otherwise-503 branch in tests/features/test-fin-08.spec.ts; neither branch may succeed or issue a credit.
- Do not implement the refund/dispute store, expand any held task, or change files beyond the three allowed paths. HOLD if this exact scope cannot be maintained.
- Follow the existing GPU gpu-fqaf / Qoder Efficient implementation flow and Sol max review gates; GitHub work remains with the coordinator.

Holds remain: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-05, T-TX-06, T-TX-10, T-FUND-02, T-FUND-03, T-LEDGER-02.
