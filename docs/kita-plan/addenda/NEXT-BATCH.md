BATCH-OK

Authorize only T-FUND-04: validateFundingCapability, a pure checker.

Allowed files only:
- packages/domain/funding/validate-funding-capability.ts
- tests/features/test-fund-04.spec.ts
- packages/contracts/src/funding.ts — additive Fund04 types only

Reuse Fund01CommandContext.

Required behavior:
- Never return ok:true.
- Never enable an unapproved credit/Apple/Google Pay method and never collect funds.
- unapprovedMethod === true => CAPABILITY_UNAVAILABLE, HTTP 403. Unapproved methods fail closed.
- Otherwise => dependency_unavailable, HTTP 503, because the capabilities store is not implemented (T-FUND-03 HOLD).
- No DB access, money operations, or executeCommand. Keep the checker pure.

TEST-FUND-04 must cover the explicit true/403 branch, the otherwise/503 branch, and absence of any ok:true result.

Landed:
- T-FUND-06: erasePaidPhpOrSeizeUnrelatedWallet => POLICY_UNAVAILABLE 409; else 503.
- TEST-FUND-06: 2 passed.

HOLD: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-05, T-TX-06, T-TX-10, T-FUND-02, T-FUND-03.

Authorization is limited to this exact checker, its tests, and additive Fund04 contract types in the files above. All listed holds remain in effect.
