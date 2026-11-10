BATCH-OK

# Next batch: T-FUND-06 only

Authorize only the pure `applyFundingReturn` checker below. Implementation follows the established GPU Qoder Efficient swarm, then VM Sol max review workflow.

## Landed

T-FUND-07 landed: `unownedCashRecognizedAsRevenue === true` returns `POLICY_UNAVAILABLE` with HTTP 409; otherwise HTTP 503. TEST-FUND-07: 2 passed.

## Allowed files

Paths relative to `apps/kita`:

- `packages/domain/funding/apply-funding-return.ts`
- `tests/features/test-fund-06.spec.ts`
- `packages/contracts/src/funding.ts` — additive Fund06 types only; reuse `Fund01CommandContext`.

## Required behavior

- `erasePaidPhpOrSeizeUnrelatedWallet === true` returns `ok: false`, `POLICY_UNAVAILABLE`, HTTP 409.
- Every other case returns `ok: false`, `dependency_unavailable`, HTTP 503 because the dispute/journal store is unimplemented under T-FIN-08 HOLD.
- Never return `ok: true`.
- Never erase paid PHP history. Paid PHP persists; any loss/recovery requires separate accounting, which this checker must not implement or fabricate.
- Never seize an unrelated wallet.
- Pure checker only: no database access, money movement, `executeCommand`, wallet seizure, or state mutation. No dispute/journal store implementation.

TEST-FUND-06 must cover the exact-true policy branch and the otherwise dependency branch, including false and omitted flag values, with no successful outcome or side effects. Run the targeted tests and review the exact resulting head before accepting the batch.

## Holds

T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-05, T-TX-06, T-TX-10, T-FUND-02, T-FUND-03.

T-FIN-08 remains HOLD: dispute/journal store is not implemented. This authorization releases no holds and permits no work outside the exact checker and three files above.
