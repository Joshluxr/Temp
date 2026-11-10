BATCH-OK

Authorize only the T-ADM-06 requestAdjustment PURE fail-closed checker below. This limited authorization does not clear the full T-ADM-06 delivery hold or any financial dependency.

Reviewed baseline: 2b5bec4 on cursor/kita-adm03-set-hold-05a3. Landed T-ADM-03 setHold returns COMPLIANCE_HOLD / HTTP 409 when holdAfterDispatchWouldBeTreatedAsPreDispatchCancel === true; otherwise dependency_unavailable / HTTP 503. TEST-ADM-03: 2 passed; focused TEST-ADM-01/03/05 regression run: 8 passed.

Holds remain: T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-05, T-TX-06, T-TX-10, T-FUND-02, T-FUND-03, T-LEDGER-02.

Allowed implementation files only (paths relative to apps/kita/):

- packages/domain/admin/request-adjustment.ts — create the inert requestAdjustment checker only.
- tests/features/test-adm-06.spec.ts — create its focused TEST-ADM-06 denial tests only.
- packages/contracts/src/admin.ts — additive Adm06Input, Adm06Output, and Adm06CommandContext types only; preserve every existing contract.

Exact input flag names: readonly stalePayload: boolean and readonly unauthorizedAccounts: boolean. These are required internal checker inputs, not HTTP fields or proof of authorization. stalePayload denotes a stale bound approval payload/hash, not a customer's advisory refund/cancellation display version. Accept no arbitrary ledger accounts, journal lines, balances, execution callback, or transaction runner.

Define Adm06Output = never. Define Adm06CommandContext as Pick<WorkerContext, 'workId' | 'attemptGeneration' | 'trace'>, using the existing WorkerContext import. The checker signature is requestAdjustment(ctx: Adm06CommandContext, input: Adm06Input): Promise<Result<Adm06Output, Problem>>. Reuse existing err/problem helpers and ProblemCode values; add no runtime dependency or barrel export. Existing redacted ctx.trace may receive only these boolean flags and a fixed event name.

Required behavior, evaluated in this order:

| Condition | Exact error code | HTTP status | retryable |
|---|---|---|---|
| unauthorizedAccounts === true, including when both flags are true | unauthorized | 403 | false |
| Otherwise stalePayload === true | APPROVAL_STALE | 409 | false |
| Otherwise | dependency_unavailable | 503 | true |

Return only ok: false failures. The 503 detail must explain that adjustment/approval persistence and command authority are unavailable and T-CORE-02/T-LEDGER-02 remain HOLD. False flags never establish account permission, payload freshness, entitlement, or approval. Use fixed, bounded, non-PII error details.

No persistence, database/store access, ledger or journal posting, balance mutation, executeCommand, approval creation/consumption, holds store, provider/adapter calls, queue/outbox/timer work, dispatch, refund/reroute execution, or real cancellation execution. Never authorize or return ok: true, a reviewable approval, command authority, or a claim that a request was recorded or executed. Money path remains closed. Do not change API/controller/UI wiring, frozen OpenAPI schemas, migrations, permissions, existing checkers, package configuration, or dependencies.

TEST-ADM-06 must cover all four boolean combinations, the denial precedence, exact code/status/retryable triples, unchanged inputs, and absence of success/approval/execution claims. Run its focused feature test together with TEST-ADM-01/03/05 and applicable type checks covering both the additive contracts and the new checker itself; the domain tsconfig includes only src and alone does not check this new module. Inspect the final diff/imports for side effects and edits outside the three allowed files. Report results against the exact returned head for Sol review. Checker tests do not satisfy the full M32/M56/M86 integration, ledger, provider, or authorization gates.

Implementation follows the established roles: Qoder CLI Efficient Agent Teams/subagents on gpu-fqaf; return the batch to Codex Sol max for review. This document authorizes the next limited checker only. If it cannot fit these constraints, stop that batch and report BATCH-HOLD with the reason. T-CORE-02 remains HOLD.
