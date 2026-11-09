BATCH-OK

Authorize only T-PUB-05: resolveLocale pure checker.

Landed: T-PUB-04 returns POLICY_UNAVAILABLE 409 for feeOrDeadlineMismatch; otherwise 503. TEST-PUB-04: 2 passed.

Holds remain: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04.

Allowed files only:
- packages/domain/catalog/resolve-locale.ts
- tests/features/test-pub-05.spec.ts
- packages/contracts/src/catalog.ts — additive Pub05 types only; reuse Pub01CommandContext.

Required behavior:
- Never return ok:true.
- Never rewrite an issued receipt or consent language; both retain their chosen language.
- rewriteIssuedReceiptLocale === true returns POLICY_UNAVAILABLE, HTTP 409.
- Otherwise return HTTP 503 with dependency_unavailable because the locale/receipt store is not implemented.

Constraints: pure checker only; no DB, no money, no executeCommand, no rewriting old receipts. Locale JSON files are not authorized in this batch.

TEST-PUB-05 must cover the strict-true 409 branch, the otherwise-503 branch, chosen-language preservation for receipts and consent, and the absence of ok:true results.
