BATCH-OK

Authorize only the T-QUOTE-01 buildQuote PURE boolean-input fail-closed checker specified below. Full T-QUOTE-01 delivery remains HOLD. T-CORE-02, T-FIN-01, T-LEDGER-02 and T-REWARD-01 remain HOLD. Money path closed. Never authorize ok: true, persistence, executeCommand, posting or financial execution.

Reviewed baseline: f50af3dffb4ca213de53f228ca4485e7e88873a7 on cursor/kita-ext04-execute-batch-05a3, with T-EXT-04 landed. Inspected its additive contracts, direct result-helper imports and refusal branches: unauthorized / 403; APPROVAL_STALE, LIMIT_EXCEEDED, stale_or_conflicting_command and PROVIDER_OUTCOME_UNKNOWN / 409; otherwise dependency_unavailable / 503. Ext04Output is never; no callback, persistence, payout or success path exists. Rechecked TEST-EXT-04: 32 passed. Together with existing TEST-QUOTE-02 through TEST-QUOTE-08, 46 tests passed across eight files (exit 0). These are refusal-checker tests; they do not establish paid-item preservation, crash-safe retries, executable pricing or any financial integration gate.

Review basis: [13-backlog.md](../13-backlog.md) T-QUOTE-01 explicitly names LIMIT_EXCEEDED and POLICY_UNAVAILABLE, and M2 supplies unauthorized / 403. [07-algorithms.md](../07-algorithms.md) G1 requires authorization, corridor/customer/rail limits and approved fee/tax policies; an unsupported tax rule cannot default to zero. Full buildQuote also requires executable provider terms, exact rational arithmetic, expiry checks and immutable quote persistence. A pure checker can refuse supplied authorization, limit and policy blockers without performing any of those operations. This is an internal checker contract; it changes no frozen HTTP schema, API error mapping or production command signature.

Remaining-task disposition:

| Task | Disposition after this review | Work still requiring stores or financial authority |
|---|---|---|
| T-QUOTE-01 | BATCH-OK for the checker below only; full task HOLD | Exact principal/receive/fee/tax/total arithmetic, authoritative policies/rates, immutable quotes/terms and connected createQuote flow. No executable or indicative price is authorized here. |
| T-CORE-02 | HOLD; no checker, scaffold or implementation authorized | Durable money_operations/command identities, ownership, holds/limits, atomic state/event/outbox/audit and fenced dispatch authority; CP-02/03/05 proofs. The existing T-CORE-02-BATCH.md HOLD remains in force. |
| T-FIN-01 | HOLD; outside this batch | Verified economic-event posting, immutable journals/lines, same-key replay and mismatch detection, per-currency balances, real-role denial and independent reconstruction. Boolean flags cannot establish these durable invariants. |
| T-LEDGER-02 | HOLD; outside this batch | Controller-approved posting templates, evidence/policy authority, real period locks/nonoverlap/close, cumulative allocations and posting functions; CP-04 closure. |
| T-REWARD-01 | HOLD; outside this batch | Paired point events, lot reservations/expiry/reversal limits, source-key uniqueness and the approved financial provision bridge; T-LEDGER-02 and CP-07 remain prerequisites. |

Only T-QUOTE-01 is selected for the next limited checker. No other new checker is authorized by this document. All prior full-feature holds, CP gaps, dependency/activation gates and release gates remain open, including full T-EXT-04 and DEP-12. No production approval is granted. This replaces the prior EXT-04 next-checker authorization and does not expand any landed checker.

Allowed files for implementation only (paths relative to apps/kita/):

- packages/domain/quotes/build-quote.ts — create the inert buildQuote checker only.
- tests/features/test-quote-01.spec.ts — create focused TEST-QUOTE-01 refusal tests only.
- packages/contracts/src/quotes.ts — additive Quote01Input, Quote01Output and Quote01CommandContext types only. Reuse its existing type-only WorkerContext import; preserve all existing imports and Quote02 through Quote08 contracts unchanged.

Exact required Quote01Input flag names and types (all required; no other data fields):

```ts
readonly unauthorizedQuoteCreation: boolean;
readonly limitExceeded: boolean;
readonly pricingPolicyUnavailable: boolean;
```

These flags are internal supplied blockers, not HTTP fields, authenticated evidence or pricing attestations:

- unauthorizedQuoteCreation denotes supplied absent or invalid current, scope-bound authorization to create the attempted quote.
- limitExceeded denotes a supplied corridor, customer or rail limit breach. It carries no amount, currency, threshold or policy payload.
- pricingPolicyUnavailable denotes a supplied missing, invalid, inactive or unsupported applicable fee, surcharge or tax policy. Missing tax never authorizes a zero-tax fallback.

The checker must not derive the flags, authenticate an actor, evaluate an amount or policy, inspect a rate, read a clock, load state or consult another checker. False flags never prove authorization, limits compliance, policy availability, valid arithmetic or quote eligibility. No combination grants authority.

Define Quote01Output = never. Define Quote01CommandContext as Pick<WorkerContext, 'workId' | 'attemptGeneration'>. The internal checker signature is buildQuote(ctx: Quote01CommandContext, input: Quote01Input): Promise<Result<Quote01Output, Problem>>. Both context fields are unused identity metadata and establish no actor, book or command authority. Do not accept CommandContext, a transaction runner, trace/capability/execution callbacks or additional context fields in this lane.

Use type-only imports for Quote01 types from ../../contracts/src/quotes.ts and Problem/Result from ../../contracts/src/result.ts; import only the existing err/problem runtime helpers from ../../contracts/src/result.ts. Do not import the contracts runtime barrel, ok helper, money utilities, existing quote checkers, platform, providers or stores. Add no dependency, package/barrel export or runtime schema. Test imports may use vitest, the new checker and direct contract type paths; avoid the contracts barrel.

Required behavior, evaluated in this exact order:

| Condition | Exact error code | HTTP status | retryable |
|---|---|---|---|
| unauthorizedQuoteCreation === true, regardless of other flags | unauthorized | 403 | false |
| Otherwise limitExceeded === true, including when pricingPolicyUnavailable is true | LIMIT_EXCEEDED | 409 | false |
| Otherwise pricingPolicyUnavailable === true | POLICY_UNAVAILABLE | 409 | false |
| Otherwise | dependency_unavailable | 503 | true |

Return only ok: false failures with exactly { ok: false, error: { code, status, retryable, detail } }. Use these fixed, bounded, non-PII detail strings in table order:

- T-QUOTE-01 quote creation is not authorized
- T-QUOTE-01 supplied corridor, customer or rail limit breach blocks quote creation
- T-QUOTE-01 required pricing policy is unavailable; no fee or tax fallback is authorized
- T-QUOTE-01 buildQuote cannot price or persist a quote or grant financial authority: quote/policy stores, T-CORE-02 and T-LEDGER-02 remain HOLD (fail closed)

The 403/409 results describe supplied blockers only; they do not authenticate or enforce live authorization, limits or policies. All flags false must still return the 503 refusal. retryable: true permits no automatic execution, scheduling, provider request or financial retry. Add no other code/branch, extra result field, value, operationId, fieldErrors, quote ID, computed or fixture price, terms, balance, receipt, permit or authority payload. Never claim that a quote was built, persisted, accepted, executable, eligible or policy-validated.

No persistence or database/store access, including in-memory substitute stores. No principal/receive/fee/tax/total arithmetic, decimal/rational parsing, rounding, rate lookup, cached/fixed-rate fallback, policy resolution, quote creation/acceptance, transfer/operation creation, status transition, ledger/journal work, balance mutation, reservation/release, points/promo application, executeCommand, holds/approval work, provider/adapter call, credential operation or queue/outbox/timer work. Accept no money, currency/exponent, rate, policy/version, recipient/instrument/book/quote/operation ID, evidence, approval, command key/hash or financial payload. The two permitted context identity fields are the only identities accepted. Never return ok: true or any financial/acceptance/dispatch authority.

Do not change API/controller/worker/UI wiring, generated clients, existing checkers, providers, runbooks, Terraform, CI, frozen OpenAPI, migrations, SQL grants, package configuration or dependencies. T-CORE-02 remains HOLD. This checker cannot be wired into createQuote, a quote read route or a money workflow.

TEST-QUOTE-01 must cover all eight boolean combinations using an explicit expected-results table, including both limit/policy precedence cases and every unauthorized combination. Assert exact code/status/retryable/detail and the entire error-only result shape for every case. Object.freeze every input and context, verify they remain unchanged, repeat each call and require the identical refusal. Assert no value or extra success/authority/quote fields. Use no mock store, simulated quote workflow, pricing fixture or provider implementation. These tests establish only the internal refusal contract; they do not satisfy full TEST-QUOTE-01, the 500 USD -> 28710 PHP / 503.99 USD fixture, M01/M03, PACK-MONEY/API/UX, REQ-SC-01/05/06/18 or CP-03/04/05 closure.

Validation required on the returned implementation head (commands run from apps/kita/):

```sh
./node_modules/.bin/vitest run tests/features/test-quote-01.spec.ts tests/features/test-quote-02.spec.ts tests/features/test-quote-03.spec.ts tests/features/test-quote-04.spec.ts tests/features/test-quote-05.spec.ts tests/features/test-quote-06.spec.ts tests/features/test-quote-07.spec.ts tests/features/test-quote-08.spec.ts tests/features/test-ext-04.spec.ts
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --noUncheckedIndexedAccess --exactOptionalPropertyTypes packages/contracts/src/quotes.ts
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --noUncheckedIndexedAccess --exactOptionalPropertyTypes packages/domain/quotes/build-quote.ts
./node_modules/.bin/tsc --noEmit --project packages/contracts/tsconfig.json
./node_modules/.bin/tsc --noEmit --project packages/contracts/tsconfig.json --allowImportingTsExtensions
```

Type-check baseline rechecked at the reviewed SHA: strict quotes.ts passes (exit 0). The unmodified contracts package check fails (exit 2) with 15 diagnostics: ten TS5097 import-extension diagnostics in auth.ts, freeze-contracts.ts and index.ts, plus five registry diagnostics. With explicit --allowImportingTsExtensions it fails (exit 2) with those five existing diagnostics: commands.ts 108 TS2502 and 345 TS2456; events.ts 78 TS2502, 125 TS2456 and 129 TS7006. No source was changed for these checks.

The new Quote01 types, checker and TEST-QUOTE-01 do not yet exist and have not been tested. All checker tests and both strict isolated checks must pass on the returned head without diagnostics. Rerun and report both full package checks separately, with actual exit statuses and diagnostics. Existing package failures remain failing gates; this authorization does not mark them passed or close them. Do not suppress diagnostics, change configuration, waive a gate or fix unrelated files. Any new diagnostic, failed checker test, changed baseline failure, need for a store or scope expansion returns to Sol as BATCH-HOLD.

Inspect final imports and the complete diff for side effects, forbidden success/authority paths and edits outside the three allowed implementation files. Return the exact implementation head, changed-file list and complete test/type-check outcomes for Codex Sol max review. Passing refusal tests does not close T-QUOTE-01 or authorize money movement. No GitHub merge, publication or deployment is authorized.

Implementation follows the established roles: Qoder CLI Efficient Agent Teams/subagents on gpu-fqaf implement the authorized checker; coordinator handles sync/bundles/GitHub; Codex Sol max reviews the returned batch. This document authorizes the next limited checker only and does not start implementation or a swarm. If it cannot fit these constraints, stop the batch and report BATCH-HOLD with the reason. T-CORE-02 remains HOLD. Money path closed.
