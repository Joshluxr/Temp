BATCH-OK

Authorize only T-FIN-03 three-way statement reconciliation as a PURE, fail-closed checker. No DB, no money, no executeCommand, and no journal posting. Never return ok:true and never post a reconciling journal.

Files only:
- packages/domain/reconciliation/reconcile-statements.ts
- tests/features/test-fin-03.spec.ts
- packages/contracts/src/reconciliation.ts — additive Fin03 types only

Required behavior:
- threeWayMismatchWouldForceBalance === true => VERSION_CONFLICT, HTTP 409. Three-way mismatch cannot force a balanced book.
- Otherwise => HTTP 503 dependency_unavailable because the ledger/journals store is not implemented. T-FIN-01 remains HOLD.

Reuse a WorkerContext pick named Fin03CommandContext.

TEST-FIN-03 must cover both the 409 mismatch branch and the otherwise-503 branch, with no successful reconciliation or journal posting.

T-FIN-01 blocks ledger-backed reconciliation; it does not block this exact pure checker, which always fails closed and performs no storage or posting operations.

Landed: T-GROW-09 issuedVestedRedeemedExpiredDisagreeProvision === true => VERSION_CONFLICT, HTTP 409; otherwise HTTP 503. TEST-GROW-09: 2 passed. PR #70.

HOLD: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-05, T-TX-06, T-TX-10, T-FUND-02, T-FUND-03, T-LEDGER-02.

Authorization is limited to this exact checker and these files. All listed holds remain in force.
