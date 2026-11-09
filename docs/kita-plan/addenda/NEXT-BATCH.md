BATCH-OK

TEST-PLAT-03: 23 passed, applyEvent 503 only.

Next limited batch: T-PLAT-04.

- receiveWebhook always returns 503 dependency_unavailable.
- No inbox writes.
- No journals.

Files:
- packages/platform/receive-webhook.ts
- tests/features/test-plat-04.spec.ts
- platform.ts: additive Plat04 types only.

T-CORE-02: HOLD.
No money.
