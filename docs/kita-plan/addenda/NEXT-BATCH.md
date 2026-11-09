BATCH-OK

Authorize only T-REC-04: a PURE repeatTransfer checker.

Heartbeat (operator supplied): Codex logged in, GPU disk 41%, astra gone. Plan A-N complete.
T-REC-03 landed: VERSION_CONFLICT -> 409; else -> 503. TEST-REC-03: 2 passed.

Holds remain: T-CORE-02, T-PLAT-08, T-EXT-02, T-EXT-04, T-QUOTE-01.

Allowed implementation files only:
- packages/domain/recipients/repeat-transfer.ts
- tests/features/test-rec-04.spec.ts
- packages/contracts/src/recipients.ts (additive Rec04 types only)

Required behavior:
- Reuse Rec01CommandContext; do not introduce a replacement context.
- Never return ok:true. Never replay an old payment or reuse its command, quote, or provider reference.
- reuseOldPayment === true: reject with CAPABILITY_UNAVAILABLE or RECIPIENT_VERSION_CHANGED, HTTP 409, retryable:false. Explain that repeat must obtain a new quote and never replay the old payment.
- reuseOldPayment === false: return HTTP 503 dependency_unavailable because T-QUOTE-08/draft store is not implemented. Do not create a live draft that can pay.
- Keep the checker pure: no DB, no money movement, no executeCommand, no quote acquisition, no draft persistence, and no payment/provider execution. Every path must fail closed.

Acceptance:
- TEST-REC-04 covers the true-path 409 non-retryable rejection and the false-path 503 dependency_unavailable rejection.
- Verify neither path returns ok:true, reuses an old payment reference, or creates a payable draft.
- Preserve existing contracts; only additive Rec04 types are allowed in recipients.ts.
- Re-run TEST-REC-03 and TEST-REC-04 plus applicable existing type checks; report actual results.
- Review the diff for the exact three-file scope and absence of side effects. Any required scope expansion is HOLD.

Routing: GPU gpu-fqaf Qoder CLI Efficient swarm implements; VM Codex gpt-6.1-sol max reviews. Failed review returns to Qoder as a fix batch within this scope. No other task is authorized by this batch.
