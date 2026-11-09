BATCH-OK

Authorized next batch: T-GROW-08 `applyCommunicationConsent` PURE checker, limited to the contract below.

Landed: T-GROW-07 — `duplicateEventPerChannel === true` returns `CAPABILITY_UNAVAILABLE` / HTTP 409; otherwise HTTP 503, with no vendor send. TEST-GROW-07: 2 passed.

Holds remain: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04.

## Allowed files only

- `packages/domain/notifications/apply-communication-consent.ts`
- `tests/features/test-grow-08.spec.ts`
- `packages/contracts/src/notifications.ts` — additive Grow08 types only.

## Exact authorized behavior

- Pure checker only: no DB, no money, no `executeCommand`, no campaign send, and no consent/notification store implementation.
- Never return `ok: true` or send a marketing campaign after opt-out. This checker never sends any campaign or claims delivery.
- When `marketingCampaignDespiteOptOut === true`, return `CAPABILITY_UNAVAILABLE` / HTTP 409. This branch takes precedence.
- Marketing opt-out suppresses campaigns; it must never suppress a necessary lawful service notice.
- Otherwise return `dependency_unavailable` / HTTP 503 because the consent/notification store is not implemented. Service notices are not claimed delivered.
- Reuse `Grow07CommandContext`.

## Required verification

In `tests/features/test-grow-08.spec.ts`, cover the strict-true conflict branch (409), the otherwise branch (503), marketing campaign suppression after opt-out, preservation of necessary lawful service notices, and the absence of success, delivery claims, and side effects. Keep every change within the three allowed files and the exact pure-checker scope above. Any broader work is HOLD.
