BATCH-OK

Authorize T-PAY-06 applyBillPosting PURE checker only.

T-FUND-05 landed: timeoutAfterDebitWouldRecharge returns PROVIDER_OUTCOME_UNKNOWN 409; otherwise 503, with no second charge. TEST-FUND-05: 2 passed.

Holds: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-05, T-TX-06, T-TX-10, T-FUND-02, T-FUND-03, T-PAY-01.

Implementation edits are limited to these files:
- packages/domain/payouts/apply-bill-posting.ts
- tests/features/test-pay-06.spec.ts
- packages/contracts/src/payouts.ts — additive Pay06 types only

Required behavior:
- Never return ok:true. Never mark a bill paid from aggregator acceptance. Never post a payout.
- aggregatorAcceptedMarksBillPaid === true returns CAPABILITY_UNAVAILABLE with status 409. Aggregator accepted does not mark bill paid.
- Otherwise return dependency_unavailable with status 503 because the bill_payments/posting-proof store is not implemented.
- Pure checker only: no DB access, no money movement, no executeCommand, no mark-paid, and no side effects.
- Reuse Fund01CommandContext, or use a WorkerContext pick named Pay06CommandContext.
- TEST-PAY-06 must cover both response branches and preserve the no-success, no-posting, no-mark-paid constraints.

No other task or implementation file is authorized by this batch. All listed holds remain in force.
