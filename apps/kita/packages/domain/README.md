# @kita/domain

**STUB ONLY.** T-PLAT-01 scaffold for the Kita domain package. This package
currently contains **zero money-moving logic**, per the Sol CONDITIONAL-PASS:
no financial feature commands may ship until T-CORE-02 (core reducers) and
T-LEDGER-02 (ledger posting) land.

## What's here

- `src/money.ts` — pure value-object **types** (`MinorAmount`, `Money`) and
  validation/formatting helpers (`isPositiveMoney`, `formatMinorUnits`, ...).
  No arithmetic: fee splitting and **refund FX rounding** are known blocking
  issues deliberately deferred to post-freeze implementation, so no rounding
  rule can silently become authoritative here. No ledger postings.
- `src/enums.ts` — string-literal union types derived verbatim from the CHECK
  constraints in `docs/kita-plan/sql/001_core.sql` (book status, customer
  status, transfer compliance/lifecycle, money_operations kind/state, funding
  and payout method sets, and related states). Each type cites its source
  table/column.

## Status

- Contracts freeze (**T-CONTRACT-01**) is **pending**. Until it lands, treat
  every export as provisional; do not build features against internals beyond
  what backlog items explicitly require.
- Real reducers arrive with **T-CORE-02**. Ledger/journal posting helpers
  arrive with **T-LEDGER-02** (paired with the DB `post_journal()` security
  definer function).
- Do **not** add sandbox funding, simulated partner completion, admin
  complete/fail, or any fake-KYC/real-money paths here.

## Develop

```sh
npm run typecheck   # tsc --noEmit
```
