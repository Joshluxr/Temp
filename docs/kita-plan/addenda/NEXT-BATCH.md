BATCH-OK

Authorize only the T-TX-10 executeOccurrence PURE checker described below. This is not authorization to implement schedule execution or release any HOLD.

Landed evidence: T-TX-06 maps concurrentPartialRefundsWouldExceedEntitlement to LIMIT_EXCEEDED, HTTP 409; otherwise HTTP 503. TEST-TX-06: 2 passed.

Allowed files only:
- packages/domain/schedules/execute-occurrence.ts
- tests/features/test-tx-10.spec.ts
- packages/contracts/src/schedules.ts — additive Tx10 types only

Required behavior:
- Never return ok: true.
- Never produce two authorized occurrences from a DST retry. DST retry invariant: one authorized occurrence; this checker does not authorize execution.
- dstRetryWouldCreateSecondOccurrence === true returns LIMIT_EXCEEDED, HTTP 409.
- Otherwise return HTTP 503, dependency_unavailable, because the schedules store is not implemented and T-CORE-02 remains HOLD.
- Pure checker only: no DB access, no money movement, no executeCommand.
- Reuse Tx06CommandContext, or use a WorkerContext pick named Tx10CommandContext.

TEST-TX-10 must cover the 409 guard and the otherwise-503 result, enforce that no result has ok: true, and verify the DST retry invariant without executing or authorizing occurrences.

HOLD remains: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-05, T-TX-06, T-TX-10, T-FUND-02, T-FUND-03, T-LEDGER-02.

No other implementation is authorized by this batch. If the exact checker cannot be implemented within these limits, HOLD.
