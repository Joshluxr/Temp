BATCH-OK

Authorize only the exact T-TX-07 `openErrorClaim` pure clock checker described below.

T-TX-04 landed: `rewriteIssuedReceiptAfterPricingUpdate === true` returns `POLICY_UNAVAILABLE` / 409; otherwise `dependency_unavailable` / 503. TEST-TX-04: 2 passed.

Holds remain: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-02, T-TX-05, T-TX-06, T-TX-10.

Allowed implementation files only, relative to `/workspace/apps/kita`:

- `packages/domain/transfers/open-error-claim.ts`
- `tests/features/test-tx-07.spec.ts`
- `packages/contracts/src/transfers.ts` — additive Tx07 types only.

Required behavior:

- Reuse `Tx08CommandContext`.
- `supportHandoffResetsStatutoryClock === true` returns `POLICY_UNAVAILABLE` / 409. This check takes precedence over the unavailable-store response. Support handoff never resets the original statutory clock.
- Otherwise return `dependency_unavailable` / 503 because the case/calendar store is not implemented.
- Never return `ok: true`, reset the original statutory clock on support handoff, or grant a refund.
- Keep the checker pure: no DB access, no case/calendar writes, no money operations, no `executeCommand`, and no remedy or refund implementation. Do not implement the money slices from the previous T-TX-07 HOLD.

TEST-TX-07 must cover the strict-true 409 branch, the otherwise-503 branch, the absence of successful responses, preservation of the original statutory clock on support handoff, and no refund granted. Tests must exercise the pure checker without DB, money, `executeCommand`, or remedy dependencies.

Route implementation through the Qoder Efficient swarm on GPU `gpu-fqaf`, then Sol max review on the VM. Changes outside this exact scope require HOLD.
