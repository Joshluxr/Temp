BATCH-OK

Authorize T-PUB-02 only: a pure estimateQuote checker reusing Pub01CommandContext.

T-PUB-01 landed: unapprovedLicenseOrPartnerClaim => POLICY_UNAVAILABLE 409; otherwise 503. TEST-PUB-01: 2 passed.

Allowed files only:
- packages/domain/catalog/estimate-quote.ts
- tests/features/test-pub-02.spec.ts
- packages/contracts/src/catalog.ts — additive Pub02 types only

Required behavior:
- Never return ok:true. Never yield an executable transfer or quoteId.
- staleIndicativeFeed === true => RATE_STALE 409. Label the stale feed as an estimate; it cannot yield an executable transfer.
- Otherwise return 503 dependency_unavailable because the indicative snapshot store is not implemented. T-QUOTE-01 remains HOLD.
- No DB access, money movement, or executeCommand. Keep the checker pure and reuse Pub01CommandContext.
- TEST-PUB-02 must cover both branches and assert that neither returns ok:true, an executable transfer, or a quoteId.

HOLD: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04.

No other work is authorized by this batch. If this exact scope cannot be maintained, HOLD.
