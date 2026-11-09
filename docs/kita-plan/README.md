# Kita production implementation plan

Planning baseline: **2026-11-09**. Role: planner only. This package contains an implementation specification, executable core schema, and API contract; it does not implement or authorize deployment of the application.

**Source-completeness limitation:** `/home/ubuntu/.coordinator/kita-user-spec.md` was absent when this plan was prepared. The coordinator prompt repeats the request but does not contain its referenced sections 1–13 or original feature IDs. The available research documents have different numbering. Accordingly, `KITA-*` IDs in this package are explicitly plan-assigned requirements, not claimed original IDs. Exact conformance to the missing specification and coverage of its scenarios remain blocked by **DEP-00**. Do not interpret COMPLETENESS-PASS as certification of unseen requirements. The rest of this package is executable planning work against the supplied prompt, brief, archive, and research.

All regulatory and provider eligibility/capability claims are **unverified for Kita, pending accountable owner and counsel confirmation as of 2026-11-09**, including claims supported by public documentation. Numerical business policies identified as planning defaults are concrete proposed behavior, not current market prices or legal thresholds. Production enablement requires approved policy versions; absent approval the relevant capability stays disabled with an explicit unavailable result.

## A–N index

| Section | Deliverable |
|---|---|
| A | [Architecture](01-architecture.md) |
| B | [Traceability matrix](02-traceability-matrix.md), including [per-feature sources, providers and activation](02-traceability-matrix.md#per-feature-source-provider-and-activation-annex) |
| C | [Every-file migration map](03-migration-map.md) |
| D | [UX and Kita design](04-ux-design.md) |
| E | [Data model and worked ledger journals](05-data-ledger.md) |
| F | [API and event contracts](06-api-contracts.md) |
| G | [Money-critical algorithms](07-algorithms.md) |
| H | [Provider integration specifications](08-providers.md) |
| I | [Administration, compliance, security](09-admin-security.md) |
| J | [Finance and operating procedures](10-finance-ops.md) |
| K | [Infrastructure and recovery](11-infrastructure.md) |
| L | [Tests and release gates](12-tests-gates.md) |
| M | [Dependency-ordered implementation backlog](13-backlog.md) |
| N | [External dependencies and evidence owners](14-external-deps.md) |

Machine-readable artifacts: [OpenAPI 3.1](openapi/kita-v1.yaml), [operation index](evidence/operations.json), [core PostgreSQL DDL](sql/001_core.sql), [104-feature register](evidence/features.json), [retained scenario register](evidence/scenarios.json), [source inventory](evidence/source-inventory.json). Final assessment: [COMPLETENESS-PASS and validation limits](COMPLETENESS-PASS.md). Target paths in the plan describe future engineering work; only files under this directory are created in the planning phase.

Completion index: [F — API semantics](06-api-contracts.md) and [OpenAPI](openapi/kita-v1.yaml) define114 operations; [L — tests/gates](12-tests-gates.md) maps104 detailed scenarios and all56 retained scenario checks; [M — backlog](13-backlog.md) assigns113 tasks with files, functions, dependencies and evidence; [N — dependencies](14-external-deps.md) names external owners and activation gates. [The completeness assessment](COMPLETENESS-PASS.md) confirms available-source planning coverage and records validation limits. DEP-00 still blocks exact original-spec certification; application/provider tests and production approval are separate gates.

## Source precedence and disagreements

1. Current user instruction and coordinator brief govern architecture, Kita identity, scope, and roles.
2. Archive source establishes actual behavior, not production fitness. Research is input, not an approved accounting policy.
3. `kita_blueprint.txt` supplies the Kita visual baseline and sandbox inventory. `remit_blueprint.txt` supplies stronger independent-state, cancellation-race, and unknown-outcome controls.
4. The long 1,288-line research supplies breadth; the 228-line sibling is partial. The 4-line enterprise file is truncated and cannot establish omitted requirements.
5. Source PDFs dated 2026-11-10 are future-dated relative to this plan. Their dates do not prove currency or verification. The nested Kita PDF is inventoried and hash-compared, not assumed identical.
6. Reject navy/teal and Inter redesign proposals; preserve ink/warm/lime, Newsreader/Hanken Grotesk. Reject automatic failover on timeouts, fabricated liquidity, pre-settlement ACH finality, unauthenticated KYC success, and claims that SSR alone prevents PII exposure. Do not copy claimed licensing amounts, provider prices, competitor stacks, or performance percentages into production.

## Decisions log

| ID | Decision | Rationale / consequence |
|---|---|---|
| ADR-01 | Next.js customer and separate Next.js admin; Expo mobile | Public discovery, isolated workforce sessions, shared contracts and tokens; port useful React UI |
| ADR-02 | TypeScript NestJS modular API, independent workers | One domain language; financial control enforced in PostgreSQL, no browser financial authority |
| ADR-03 | PostgreSQL + in-house posting service | Strong cross-row invariants and atomic workflow/journal/outbox commits; replace MySQL persistence |
| ADR-04 | DB state machines + SQS and transactional outbox/inbox | Recoverable waits and submission authority without a second orchestration state store; no Temporal initially |
| ADR-05 | One legal-entity book per funds owner; USD functional currency for worked US book | No inter-entity netting; signed accountant mapping before production |
| ADR-06 | US→PH launch; other origin markets configured but disabled | Country display is not permission; state/residency and product gating apply |
| ADR-07 | ACH payout only after settlement evidence; no ACH advance at initial launch | Return exposure still exists after settlement; retain recovery and loss paths |
| ADR-08 | Debit Express only with approved remittance acquiring and funded exposure cap | Capture is a receivable, not settled cash; approved corporate liquidity funds advance |
| ADR-09 | Binding accepted recipient amount; Kita absorbs later wholesale change | No silent repricing; offer acceptance is limited by treasury exposure, not a long-lived vendor quote |
| ADR-10 | Earn fee and realized FX margin at confirmed recipient delivery | Defer until obligation performed; account for taxes and provider costs separately |
| ADR-11 | USD/PHP fiat first; wallet, bills, cash, stablecoin, auto-conversion designed behind activation gates | Complete workflows, no fake-success adapter; external dependency does not mean simulated production |
| ADR-12 | No direct admin complete/mark-paid/edit-balance endpoint | Evidence intake uses the same state reducer and ledger policy as verified provider events |
| ADR-13 | Provisional requirement IDs until original spec is supplied | Preserve honest traceability; DEP-00 blocks exact sections 1–13 sign-off |
| ADR-14 | No production import of sandbox cash, KYC approvals, points, or provider references | New production book starts from independently attested real opening balances |

## Execution responsibilities

Cursor Grok coordinates sync and GitHub only. Codex GPT-6 Astra/xhigh owns planning. Codex GPT-6.1 Sol/max directs and reviews. Qoder Efficient Agent Teams on GPU `gpu-fqaf` implement approved batches. One principal financial-systems architect owns integration. Freeze schema, command, event, and adapter contracts before coding streams diverge. The coordinator uses `~/.coordinator/run-batch.sh`, syncs to GPU, retrieves a hash-addressed bundle, obtains Sol review, and sends failed review as a fix batch. No planner application changes, production calls, credentials, or GitHub publication are part of this package.

## Reproducing planning checks

Run `python3 docs/kita-plan/tools/validate_plan.py` from `/workspace`; inspect [the validation report](evidence/validation-report.json) and [worked journal fixtures](evidence/worked-journals.json). [SQL smoke checks](sql/002_core_smoke.sql) require an isolated PostgreSQL18.6 database; runtime remains pending DEP-15. The report distinguishes planning consistency from future application/provider tests. The reviewed Markdown/YAML/SQL are canonical; retired construction scripts must not overwrite later refinements.
