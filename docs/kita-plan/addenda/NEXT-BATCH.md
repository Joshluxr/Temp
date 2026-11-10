BATCH-OK

Authorize only T-WAL-02: creditWalletFromEvidence as a PURE checker.

Allowed files only:
- packages/domain/wallets/credit-wallet-from-evidence.ts
- tests/features/test-wal-02.spec.ts
- packages/contracts/src/wallets.ts — additive Wal02 types only.

Required behavior:
- Never return ok:true. Never credit funds. No funds credited without real settlement/approved risk evidence.
- creditWithoutSettlementOrApprovedEvidence === true => FUNDING_PENDING, HTTP 409.
- Every other case => dependency_unavailable, HTTP 503, because the funding/journals store is not implemented (T-FUND-02 HOLD). Settlement or approved risk evidence does not enable a success path in this checker.
- No DB access, money movement, or executeCommand calls.
- Reuse Wal01CommandContext or a WorkerContext pick named Wal02CommandContext.
- TEST-WAL-02 must cover the exact true condition returning 409 and the otherwise branch returning 503; neither branch may return ok:true or credit funds.
- If implementation requires expanding these files, behavior, or dependencies, HOLD.

Recorded status:
- T-FIN-02 landed: cumulativePartialFeesDoNotSumOnFinalRefund => LIMIT_EXCEEDED, HTTP 409; otherwise HTTP 503.
- TEST-FIN-02: 2 passed.
- PR #77 pending.

Holds remain:
T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-05, T-TX-06, T-TX-10, T-FUND-02, T-FUND-03, T-LEDGER-02.
