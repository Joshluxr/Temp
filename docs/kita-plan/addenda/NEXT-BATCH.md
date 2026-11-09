BATCH-OK

Authorize T-PUB-03 only: implement the listCapabilities PURE checker through the established GPU Qoder coding workflow. Reuse Pub01CommandContext.

Allowed files only:
- packages/domain/catalog/list-capabilities.ts
- tests/features/test-pub-03.spec.ts
- packages/contracts/src/catalog.ts — additive Pub03 types only

Required behavior:
- Never return ok:true.
- disabledUsStateOrOrigin === true => CAPABILITY_UNAVAILABLE, HTTP 403. Disabled US states or origins cannot accept money.
- Otherwise => dependency_unavailable, HTTP 503, because the capabilities catalog store is not implemented.
- No DB access, money handling, executeCommand, or country-wide default allow.

TEST-PUB-03 must cover the disabled-state/origin 403 rejection and the otherwise 503 dependency_unavailable response, with no ok:true outcome.

Landed:
- T-PUB-02: staleIndicativeFeed => RATE_STALE, HTTP 409; otherwise HTTP 503 with no quoteId.
- TEST-PUB-02: 2 passed.

Holds remain: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04.

Authorization is limited to this exact checker and these three files. HOLD if implementation requires broader scope.
