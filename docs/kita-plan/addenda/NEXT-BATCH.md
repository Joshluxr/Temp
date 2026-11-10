BATCH-OK

Authorize only T-QUOTE-08: the saveDraft PURE checker described below.

T-QUOTE-05 landed: expiryEqualityOrRecipientChange => QUOTE_EXPIRED 409; otherwise 503. TEST-QUOTE-05: 2 passed.

Allowed implementation files only:
- packages/domain/quotes/save-draft.ts
- tests/features/test-quote-08.spec.ts
- packages/contracts/src/quotes.ts — additive Quote08 types only

Required behavior:
- Never return ok: true and never overwrite a newer recipient/amount with a stale draft version.
- staleDraftWouldOverwriteNewerRecipientOrAmount === true => VERSION_CONFLICT 409. Stale draft version cannot overwrite newer recipient/amount. This check takes precedence over the dependency fallback.
- Otherwise return 503 dependency_unavailable because the drafts store is not implemented; T-CORE-02 remains HOLD.
- PURE checker only: no DB, no money, no executeCommand.
- Reuse Quote05CommandContext or a WorkerContext pick named Quote08CommandContext.

Regression coverage must verify the 409 conflict branch, the 503 fallback, and that no branch returns ok: true.

Holds remain: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-05, T-TX-06, T-TX-10, T-FUND-02, T-FUND-03, T-LEDGER-02.

No authorization beyond this exact checker and these three implementation files.
