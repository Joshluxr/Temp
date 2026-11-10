BATCH-OK

Authorize only the T-ADM-08 releasePolicy PURE boolean-input fail-closed checker below. This limited authorization does not clear the full T-ADM-08 delivery hold or any financial dependency. Money path remains closed.

Reviewed baseline: decf0622ec485d310d625ad42b2182ba97f844ca on cursor/kita-adm06-request-adjustment-05a3. Landed T-ADM-06 requestAdjustment returns unauthorized / HTTP 403 before APPROVAL_STALE / HTTP 409, otherwise dependency_unavailable / HTTP 503. Rechecked TEST-ADM-06: 4 passed; combined TEST-ADM-01/03/05/06: 12 passed.

Basis: 13-backlog.md T-ADM-08 requires immutable versioned policies, no rewrite of accepted quotes, and approved effective releases. 09-admin-security.md I2/I3 requires config.publish scope and current approval bound to exact payload/version/evidence. 12-tests-gates.md M89 requires simulation/approval, unchanged accepted terms, forward rollback, and current permission checks at dispatch. A pure checker may identify supplied denial conditions; it cannot prove any release prerequisite or satisfy M89.

Holds remain: full T-ADM-06 and T-ADM-08 delivery, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-05, T-TX-06, T-TX-10, T-FUND-02, T-FUND-03, T-LEDGER-02. No other hold is cleared.

Allowed implementation files only (paths relative to apps/kita/):

- packages/domain/admin/release-policy.ts — create the inert releasePolicy checker only.
- tests/features/test-adm-08.spec.ts — create its focused TEST-ADM-08 denial tests only.
- packages/contracts/src/admin.ts — additive Adm08Input, Adm08Output, and Adm08CommandContext types only; preserve every existing contract.

Exact required Adm08Input flag names and types (no other data fields):

```ts
readonly unauthorizedRelease: boolean;
readonly staleApproval: boolean;
readonly wouldRewriteAcceptedQuote: boolean;
```

These are internal denial inputs, not HTTP fields or proof of authorization. unauthorizedRelease denotes a supplied denial of config.publish permission, legal-entity/value scope, or required assurance. staleApproval denotes an identified expired, revoked, or mismatched release approval bound to the exact payload/hash, target version, or evidence; it is not a customer's advisory display version. wouldRewriteAcceptedQuote denotes an attempt to alter accepted quote/disclosure terms through the release. Do not load or evaluate identities, approvals, policies, simulations, quotes, or evidence to derive these flags.

Define Adm08Output = never. Define Adm08CommandContext as Pick<WorkerContext, 'workId' | 'attemptGeneration' | 'trace'>, using the existing WorkerContext import. The checker signature is releasePolicy(ctx: Adm08CommandContext, input: Adm08Input): Promise<Result<Adm08Output, Problem>>. Reuse existing err/problem helpers and ProblemCode values; do not import the ok helper, add a runtime dependency, or add a barrel export. Accept no execution callback, transaction runner, policy payload, accounts, journal lines, or balances. The only permitted trace is the existing redacted ctx.trace with fixed event name release_policy_fail_closed and these three boolean flags.

Required behavior, evaluated in this order:

| Condition | Exact error code | HTTP status | retryable |
|---|---|---|---|
| unauthorizedRelease === true, regardless of other flags | unauthorized | 403 | false |
| Otherwise staleApproval === true, including when wouldRewriteAcceptedQuote is true | APPROVAL_STALE | 409 | false |
| Otherwise wouldRewriteAcceptedQuote === true | VERSION_CONFLICT | 409 | false |
| Otherwise | dependency_unavailable | 503 | true |

Return only ok: false failures. The 503 detail must explain that policy/approval persistence and command authority are unavailable and T-CORE-02/T-LEDGER-02 remain HOLD. False flags never establish permission, fresh independent approval, completed simulation, a valid effective date/version, unchanged quote terms, or release eligibility. Missing or unverified release prerequisites cannot produce success. Use fixed, bounded, non-PII error details. Do not add a POLICY_UNAVAILABLE branch or any new error code in this batch.

No persistence, database/store access (including in-memory substitute stores), ledger or journal posting, balance mutation, executeCommand, approval creation/consumption, holds store, provider/adapter calls, queue/outbox/timer work, dispatch, or financial execution. No policy publication/activation, policy selection, simulation execution, effective/rollback version generation, quote creation/rewrite/repricing, or runtime capability changes. Never authorize or return ok: true, a reviewable approval, command authority, or a claim that a release was recorded, approved, effective, or executed. Do not change API/controller/worker/UI wiring, frozen OpenAPI schemas, migrations, permissions, existing checkers, package configuration, or dependencies.

TEST-ADM-08 must cover all eight boolean combinations, both denial precedence rules, exact code/status/retryable triples, unchanged frozen inputs, and an error-only result with no success payload, release identifier, effective/rollback version, approval, command authority, or issued quote. Check the 503 hold detail and, if tracing is used, its fixed name and boolean-only fields. Use no mock store or simulated release implementation. Run its focused feature test with TEST-ADM-01/03/05/06 and applicable type checks covering both the additive contracts and the new checker itself; the domain tsconfig includes only src and alone does not check this new module. Inspect final imports/diff for side effects and edits outside the three allowed implementation files. Report the exact returned head and test/type-check outputs for Sol review. Checker tests do not satisfy the full TEST-ADM-08/M89 integration, approval, simulation, immutable-quote, rollback, or dispatch gates.

Type-check baseline: isolated packages/contracts/src/admin.ts passes strict checking. The contracts package check and ADM-06 checker-inclusive check both report five pre-existing diagnostics in unchanged packages/contracts/src/commands.ts (TS2502/TS2456) and events.ts (TS2502/TS2456/TS7006). Record these failures separately from any new diagnostics; do not claim those checks pass, waive a review gate, suppress errors, or fix unrelated files under this authorization. Any new diagnostic or need to expand scope returns to Sol as BATCH-HOLD.

Implementation follows the established roles: Qoder CLI Efficient Agent Teams/subagents on gpu-fqaf; return the batch to Codex Sol max for review. This document authorizes the next limited checker only. If it cannot fit these constraints, stop that batch and report BATCH-HOLD with the reason. T-CORE-02 remains HOLD.
