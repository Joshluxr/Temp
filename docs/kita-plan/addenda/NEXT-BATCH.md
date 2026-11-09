BATCH-OK

Authorize only T-EXT-01: `evaluateMarketPermission` as a PURE, fail-closed policy checker.

Files allowed:
- `packages/domain/extensions/evaluate-market-permission.ts`
- `tests/features/test-ext-01.spec.ts`
- `packages/contracts/src/extensions.ts` — additive Ext01 types only; creating this file is allowed.

Required behavior:
- Never return `ok: true`. T-DEPEND-01 live activation is incomplete; do not claim a live US→PH corridor.
- Unapproved markets — CA, UK, every EU/EEA member, JP, SG, AU — and every product outside the intended US→PH corridor return `CAPABILITY_UNAVAILABLE`, `retryable: false`, status `409`.
- The intended initial US→PH corridor returns `dependency_unavailable`, status `503`, pending T-DEPEND-01. This batch must not add any success path or activate the corridor.
- No DB access, money movement, `executeCommand`, journals, provider calls, or T-CORE-02 work.

Verification must cover the denied markets and other non-US→PH products, the US→PH dependency failure, and the absence of any successful decision. Changes stay within the three allowed files.

Recorded status:
- T-PLAT-09 landed: legalHold with `POLICY_UNAVAILABLE` returns `409`; without a hold returns `503`; never delete. TEST-PLAT-09: 4 passed.
- T-CORE-02: HOLD.
- T-PLAT-08: HOLD.
- T-DEPEND-01 live activation: not done; outside this authorization.

Implementation follows the existing GPU Qoder Efficient swarm workflow, with Sol max review. This authorization covers only the checker and its additive types and tests.
