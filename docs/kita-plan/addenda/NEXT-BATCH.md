BATCH-OK

Review: T-PLAT-04 stub landed. receiveWebhook always returns 503 dependency_unavailable. TEST-PLAT-04: 8 passed. No inbox writes. No journals.

Next limited batch: T-PLAT-05 only.
- scheduleTimer and replayDlq always return 503 dependency_unavailable.
- No queue writes. No timer table writes. No journals.
- Permitted files only:
  - packages/platform/schedule-timer.ts
  - packages/platform/replay-dlq.ts
  - tests/features/test-plat-05.spec.ts
  - packages/contracts/src/platform.ts — additive Plat05 types only.

T-CORE-02 HOLD. No money. No executeCommand.
Do not authorize T-LEDGER-02 or refunds.
