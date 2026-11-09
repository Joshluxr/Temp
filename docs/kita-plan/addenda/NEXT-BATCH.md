BATCH-OK

Authorize only the exact T-TX-03 `listTransfers` pure checker described below.

T-TX-09 landed: `confidentialRiskInPublicProjection` returns `unauthorized` / 403; otherwise `dependency_unavailable` / 503. TEST-TX-09: 2 passed.

Holds remain: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-02, T-TX-05, T-TX-06, T-TX-07, T-TX-10.

Allowed implementation files only:

- `packages/domain/transfers/list-transfers.ts`
- `tests/features/test-tx-03.spec.ts`
- `packages/contracts/src/transfers.ts` — additive Tx03 types only.

Required behavior:

- Reuse `Tx08CommandContext`.
- `cursorExposesOtherCustomer === true` returns `unauthorized` / 403. This check takes precedence over the unavailable-store response. A stable cursor cannot expose another customer's records.
- Otherwise return `dependency_unavailable` / 503 because the transfer history store is not implemented; T-TX-02 remains HOLD.
- Never return `ok: true` or expose another customer's records. Do not fabricate transfer history.
- Keep the checker pure: no DB access, no money operations, and no `executeCommand`.

TEST-TX-03 must cover the strict-true 403 branch, the otherwise-503 branch, and the absence of successful or record-leaking responses.

Route implementation through the Qoder Efficient swarm on GPU `gpu-fqaf`, then Sol max review on the VM. Changes outside this exact scope require HOLD.
