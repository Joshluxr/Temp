BATCH-OK

Authorize T-PAY-01 only as a PURE routePayout routing-safety checker.

Allowed implementation files only:
- packages/domain/payouts/route-payout.ts
- tests/features/test-pay-01.spec.ts
- packages/contracts/src/payouts.ts — additive Pay01 types only

Reuse Pay06CommandContext.

Required behavior:
- Never return ok:true.
- unknownFirstProviderWouldDispatchSecond === true returns PROVIDER_OUTCOME_UNKNOWN, HTTP 409. An unknown first-provider outcome blocks a second payout.
- Otherwise return HTTP 503, dependency_unavailable, because the routing/liquidity store is not implemented.
- No DB access, money movement, executeCommand, or payout dispatch. Never dispatch a second payout while the first provider outcome is unknown.
- TEST-PAY-01 must cover both response branches and verify the checker never reports success.

T-PAY-06 landed: aggregatorAcceptedMarksBillPaid returns CAPABILITY_UNAVAILABLE 409; otherwise 503 with no payout. TEST-PAY-06: 2 passed. This authorization does not reopen T-PAY-06 or authorize payout execution.

Remain on HOLD:
T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-05, T-TX-06, T-TX-10, T-FUND-02, T-FUND-03.
