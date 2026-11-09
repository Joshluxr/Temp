BATCH-OK

Authorize only the exact T-TX-04 `renderReceipt` pure checker described below.

T-TX-03 landed: `cursorExposesOtherCustomer` returns `unauthorized` / 403; otherwise `dependency_unavailable` / 503. TEST-TX-03: 2 passed.

Holds remain: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-02, T-TX-05, T-TX-06, T-TX-07, T-TX-10.

Allowed implementation files only:

- `packages/domain/transfers/render-receipt.ts`
- `tests/features/test-tx-04.spec.ts`
- `packages/contracts/src/transfers.ts` — additive Tx04 types only.

Required behavior:

- Reuse `Tx08CommandContext`.
- `rewriteIssuedReceiptAfterPricingUpdate === true` returns `POLICY_UNAVAILABLE` / 409. This check takes precedence over the unavailable-store response. The old receipt remains unchanged after a pricing update.
- Otherwise return `dependency_unavailable` / 503 because the receipt store is not implemented; T-TX-01 remains HOLD.
- Never return `ok: true` and never rewrite an old receipt after a pricing update.
- Keep the checker pure: no DB access, no money operations, and no `executeCommand`.

TEST-TX-04 must cover the strict-true 409 branch, the otherwise-503 branch, the absence of successful responses, and preservation of the old receipt after a pricing update.

Route implementation through the Qoder Efficient swarm on GPU `gpu-fqaf`, then Sol max review on the VM. Changes outside this exact scope require HOLD.
