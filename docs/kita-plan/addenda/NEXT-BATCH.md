BATCH-OK

Authorize only T-GROW-05: evaluateAlerts as a pure checker.

Allowed files only:
- packages/domain/rate-alerts/evaluate-alerts.ts
- tests/features/test-grow-05.spec.ts
- packages/contracts/src/rate-alerts.ts — additive Grow05 types only.

Required behavior:
- Never return ok:true under any input.
- oscillatingOrStaleRate === true: return RATE_STALE with HTTP 409 and message "Oscillating or stale rate does not spam or execute money."
- Otherwise: return dependency_unavailable with HTTP 503 because the rate-alert store is not implemented; T-QUOTE-04 remains HOLD.
- No DB access, money movement, executeCommand, spend authority, or external side effects, including alert delivery. Oscillating or stale rates must never cause spam or execute money.
- Use a context named Grow05CommandContext, reusing Grow07CommandContext or a minimal WorkerContext pick.
- TEST-GROW-05 must cover both branches and verify neither returns ok:true.

This authorization covers exactly this checker and these three files. Any broader implementation or required scope expansion is HOLD.

Landed:
- T-GROW-08: marketingCampaignDespiteOptOut returns CAPABILITY_UNAVAILABLE with HTTP 409; otherwise HTTP 503.
- TEST-GROW-08: 2 passed.

Holds remain:
T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06.
