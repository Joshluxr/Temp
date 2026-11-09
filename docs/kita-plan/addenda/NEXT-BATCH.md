BATCH-OK

Authorize T-REC-02 only: `validateWalletRecipient`, a pure checker.

Current state:
- T-REC-01 landed: unowned => 403; client-claimed validation => 409; otherwise => 503.
- TEST-REC-01: 3 passed.
- Holds remain: T-CORE-02, T-PLAT-08, T-EXT-02, T-EXT-04.

Allowed implementation files only (relative to `apps/kita`):
- `packages/domain/recipients/validate-wallet-recipient.ts`
- `tests/features/test-rec-02.spec.ts`
- `packages/contracts/src/recipients.ts` — additive Rec02 types only.

Required behavior, in evaluation order:
1. `wrongNetwork === true` => `CAPABILITY_UNAVAILABLE`, HTTP 409, `retryable: false`.
2. Otherwise, `validationExpired === true` => `RECIPIENT_VERSION_CHANGED`, HTTP 409, `retryable: false`.
3. Otherwise => HTTP 503, `dependency_unavailable`, because the wallet catalog is not implemented.

Wrong network or expired validation blocks payout. If both flags are true, rule 1 takes precedence.
Every result must be `ok: false`. Never return `ok: true` or authorize payout.
Reuse the existing `Rec01CommandContext`; do not redefine or alter it.
No plaintext wallet identifiers in traces or trace fields.

Scope constraints:
- Pure checker only: no DB, persistence, network/catalog calls, money movement, or `executeCommand`.
- No new dependencies, payout integration, or changes to Rec01 behavior.
- No implementation outside the three allowed files; all held tasks remain held.

Acceptance gates:
- TEST-REC-02 covers wrong network, expired validation, both flags true, and the 503 fallback, including false/omitted flags.
- Assert 409 codes and non-retryable results; assert every path returns `ok: false` and no plaintext wallet identifier reaches a trace.
- Run TEST-REC-02, rerun TEST-REC-01, and run the applicable type check on the reviewed head.
- Use the established GPU Qoder Efficient implementation flow and Sol max review; failed review returns to Qoder as a fix batch.
