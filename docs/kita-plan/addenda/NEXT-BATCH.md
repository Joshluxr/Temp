BATCH-OK

Authorized next batch: T-GROW-07 `sendNotification` PURE checker, limited to the contract below.

Landed: T-PUB-06 — `inaccessibleContrastOrKeyboardContract` returns `POLICY_UNAVAILABLE` / HTTP 409; otherwise HTTP 503. TEST-PUB-06: 2 passed.

Holds remain: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04.

## Allowed files only

- `packages/domain/notifications/send-notification.ts`
- `tests/features/test-grow-07.spec.ts`
- `packages/contracts/src/notifications.ts` — additive Grow07 types only.

## Exact authorized behavior

- Pure checker only: no DB, no money, no `executeCommand`, no vendor send, and no notification/outbox store implementation.
- Never return `ok: true`, report duplicate success, or send a live vendor message.
- When `duplicateEventPerChannel === true`, return `CAPABILITY_UNAVAILABLE` / HTTP 409. This branch takes precedence.
- Otherwise return `dependency_unavailable` / HTTP 503 because the notification/outbox store is not implemented.
- Delivery contract: a duplicate event has one intended message per channel; a second send is denied. This checker never sends or reports success, including on the first attempt.
- Reuse `Pub01CommandContext` or a `Pick` of `WorkerContext`, named `Grow07CommandContext`.

## Required verification

In `tests/features/test-grow-07.spec.ts`, cover the strict-true duplicate branch (409), the otherwise branch (503), and the absence of success and side effects. Keep every change within the three allowed files and the exact pure-checker scope above. Any broader work is HOLD.
