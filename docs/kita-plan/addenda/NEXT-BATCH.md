BATCH-OK

Authorize only T-PAY-02: `resolveBankRoute` as a PURE checker within the scope below.

Allowed files only:
- `packages/domain/payouts/resolve-bank-route.ts`
- `tests/features/test-pay-02.spec.ts`
- `packages/contracts/src/payouts.ts` — additive Pay02 types only; reuse `Pay06CommandContext`.

Required behavior:
- Never return `ok: true`.
- If `splitBypassesCutoffHolidayOrAmount === true`, return `LIMIT_EXCEEDED` with HTTP 409. Splitting cannot bypass cutoff, holiday, or amount restrictions; this rejection takes precedence over the unavailable-dependency response.
- Otherwise return HTTP 503 with `CAPABILITY_UNAVAILABLE` or `dependency_unavailable`, because the calendar/capability store is not implemented.
- No DB access, money movement, `executeCommand`, payout execution, or InstaPay/PESONet dispatch.
- Keep the checker pure. Do not implement the missing calendar/capability store or expand payout functionality.

TEST-PAY-02 must cover the split-bypass 409, the otherwise-unavailable 503, and the absence of any successful result or dispatch. Authorization covers this checker only; it does not declare full T-PAY-02 payout routing complete.

T-PAY-05 landed: `returnExceedsCapOrErasesDeliveredTimestamp` returns `PROVIDER_OUTCOME_UNKNOWN` with HTTP 409; otherwise HTTP 503 with no refund. TEST-PAY-05: 2 passed.

Holds remain: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-05, T-TX-06, T-TX-10, T-FUND-02, T-FUND-03.
