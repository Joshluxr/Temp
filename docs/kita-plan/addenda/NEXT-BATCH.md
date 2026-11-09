BATCH-OK

Authorize only T-PUB-06: applyKitaTokens as a PURE checker.

Landed: T-PUB-05 — rewriteIssuedReceiptLocale maps POLICY_UNAVAILABLE to HTTP 409; otherwise HTTP 503. TEST-PUB-05: 2 passed.

Allowed files only:
- packages/domain/catalog/apply-kita-tokens.ts
- tests/features/test-pub-06.spec.ts
- packages/contracts/src/catalog.ts — additive Pub06 types only

Reuse Pub01CommandContext.

Required behavior, in order:
1. inaccessibleContrastOrKeyboardContract === true returns POLICY_UNAVAILABLE, HTTP 409.
2. Otherwise return dependency_unavailable, HTTP 503, because the design-token store is not implemented.

Never return ok:true. Never return or ship inaccessible tokens. Keyboard and screen reader flow must pass at required widths.

Tests must cover both failure branches and verify that neither returns ok:true or ships tokens.

No DB, money operations, executeCommand, side effects, or design-token store implementation. No CSS/UI files. Do not authorize kita.css, primitives, or icons. No files beyond the three listed above.

HOLD: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04.
