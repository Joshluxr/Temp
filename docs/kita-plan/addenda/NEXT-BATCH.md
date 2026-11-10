BATCH-OK

Authorize exactly T-GROW-01: vestPoints PURE checker.

Allowed implementation files only:
- packages/domain/rewards/vest-points.ts
- tests/features/test-grow-01.spec.ts
- packages/contracts/src/rewards.ts — additive Grow01 types only.

Required behavior:
- Never return ok:true and never award points on a duplicate payout callback.
- duplicatePayoutCallbackAwardsTwice === true => POLICY_UNAVAILABLE, HTTP 409. Policy: "Duplicate payout callback awards once."
- Otherwise => dependency_unavailable, HTTP 503, because the points store is not implemented (T-REWARD-01 HOLD).
- Reuse Grow04CommandContext or a WorkerContext pick named Grow01CommandContext.
- Pure checker only: no DB access, no money operations, no executeCommand, and no points issuance. The checker does not award points in either branch.

Validation in tests/features/test-grow-01.spec.ts must cover duplicatePayoutCallbackAwardsTwice === true returning POLICY_UNAVAILABLE 409, the otherwise branch returning dependency_unavailable 503, and absence of ok:true or points awards in either branch. No additional implementation files or scope are authorized. Any implementation requiring broader scope is HOLD.

Landed status supplied by operator:
T-WAL-01: projectionLedgerDisagree => CAPABILITY_UNAVAILABLE, HTTP 409; otherwise HTTP 503. TEST-WAL-01: 2 passed. PR #66.

Holds remain unchanged:
T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-05, T-TX-06, T-TX-10, T-FUND-02, T-FUND-03, T-LEDGER-02.
