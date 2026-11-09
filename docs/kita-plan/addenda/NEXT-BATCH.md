BATCH-OK

Authorize only T-REC-03: `archiveRecipient` as a pure checker.

T-REC-02 landed: `wrongNetwork` returns `CAPABILITY_UNAVAILABLE` 409; expired returns `RECIPIENT_VERSION_CHANGED` 409; otherwise 503. TEST-REC-02: 3 passed.

Holds remain: T-CORE-02, T-PLAT-08, T-EXT-02, T-EXT-04. T-QUOTE-01 remains HOLD (money / T-CORE-02).

Authorized implementation files only:
- `packages/domain/recipients/archive-recipient.ts`
- `tests/features/test-rec-03.spec.ts`
- `packages/contracts/src/recipients.ts` — additive Rec03 types only.

Required behavior:
- Reuse `Rec01CommandContext`.
- No DB, no money, no `executeCommand`.
- Never return `ok: true` and never mutate an old transfer snapshot.
- If `expectedVersionMismatch === true`, return `VERSION_CONFLICT`, HTTP 409, `retryable: false`.
- Otherwise return HTTP 503, `dependency_unavailable`, because the `recipient_versions` store is not implemented.
- Never claim archive completed.

TEST-REC-03 must cover the version-conflict path, the dependency-unavailable fallback, and preservation of the old transfer snapshot. No archive persistence or additional behavior is authorized.
