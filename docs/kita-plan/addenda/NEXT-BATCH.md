BATCH-OK

Authorize only T-PUB-01: a pure publishContent checker. Implementation follows the GPU Qoder Efficient swarm workflow, with Sol max review.

Landed: T-AUTH-07 returns 403 for expiredKeyOrHostileDeepLink; otherwise CAPABILITY_UNAVAILABLE 503. TEST-AUTH-07: 2 passed.

Holds remain: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04.

Files authorized for this batch only:
- packages/domain/catalog/publish-content.ts
- tests/features/test-pub-01.spec.ts
- packages/contracts/src/catalog.ts — additive Pub01 types only.

Exact checker behavior:
- Never return ok:true. Never publish unapproved license or partner claims.
- If unapprovedLicenseOrPartnerClaim === true, return POLICY_UNAVAILABLE with HTTP 409 and the message: "Unapproved license or partner claim is absent."
- Otherwise return HTTP 503 with dependency_unavailable because the approved content store is not implemented.
- Reuse Auth01CommandContext, or use a Pick of WorkerContext named Pub01CommandContext.
- Pure checker only: no DB, no money, no executeCommand, and no public claims published.

TEST-PUB-01 must verify both failure branches and that the checker never returns ok:true. No additional feature implementation is authorized.
