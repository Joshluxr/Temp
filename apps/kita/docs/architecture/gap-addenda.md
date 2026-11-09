# Gap addenda — T-CONTRACT-01

Concrete frozen answers for the COMPLETENESS-PASS CP gaps that block dependent
coding. Each entry names its gap, the freeze decision, and where it is encoded.
Protected planning artifacts under `docs/kita-plan/` were not modified; this
file supplements them (CP-10 instruction: reconcile stale prose here rather
than editing owned sources).

## CP-02 — Subject-scope holds (frozen contract; implementation = T-CORE-02)

Core `holds` require `transfer_id`. Frozen scope model:

- Supplemental range `002_*` (owned by T-CORE-02) adds a subject-scoped hold
  table keyed `(book_id, subject_customer_id, scope)` with scopes exactly
  `funding | fx | payout | refund | withdrawal | all` (§A4 vocabulary; matches
  the existing CHECK where present). A hold either binds a transfer or binds a
  customer subject, never an unscoped global.
- Shared dispatch lock order is frozen in `contract-freeze.md` §3; both
  interleavings (hold-before-dispatch blocks submission; hold-after-dispatch
  records `submission_in_flight`) are the required proof fixtures for
  TEST-CORE-02 / REQ-SC-04/05.
- Wallet/route/global controls use the same registry; no lane may invent a
  parallel hold table.

## CP-03 — money_operations command layer (frozen envelope; implementation = T-CORE-02)

- Command intake maps into the frozen `CommandEnvelope` (`commands.ts`);
  canonical hash = sha256 over `canonicalJson(payload)` plus operation id,
  stored as `command_keys.request_hash` semantics (§F1).
- Economic-movement identity is frozen as `(book_id, event_key)` uniqueness —
  already enforced by `post_journal`; adapters emit one `DomainEvent` per
  verified movement, consumers dedup `(consumer,event_id)`.
- Safe parent binding rule: a wallet/treasury-only parent must exist as a real
  aggregate row before children attach; no fabricated remittance parent
  (§F8). Enforcement functions land in `002_*` under T-CORE-02.

## CP-05 — Operation ownership, events, lock order, worker I/O

Closed by this freeze: 114 operations registered in `COMMAND_OPERATIONS`
(CI-enforced equality with the YAML regeneration), internal event envelope +
event-type registry in `events.ts`, shared lock order in
`contract-freeze.md` §3, provider ports typed in `packages/providers/ports.ts`
(§H2 six ports, outcome union fail-closed), worker task I/O carried by
`WorkerContext` (`context.ts`). Remaining runtime work (generated clients,
runtime validators, compiled web/native bundles) stays with
T-PLAT-01/T-INTEGRATE-01 per the compatibility matrix §8.

## CP-10 — Coherent snapshot hashes

Frozen source hashes are recorded in `contract-freeze.md` §1. The known
prose-vs-schema staleness ("sessions/instruments/wallet operations absent") is
superseded by current E13/core SQL: those tables **exist**; operational
command correctness remains unproved and gated on T-CORE-02. No PASS older than
these hashes may be cited as evidence after any byte change.

## Known translation divergence (flagged, not silently fixed)

`apps/kita/sql/001_core.sql` is a verbatim copy of the architect planning DDL
(`da4b3e0e…`), while `packages/database/migrations/001_core.sql`
(`4f5a0d66…`) is the T-PLAT-02 *translated* install DDL. Both create the same
75 tables; the migration adds header provenance, least-privilege NOLOGIN group
roles and expand-safe ordering. Consequence for CI: the planning-copy hash
check applies only to `apps/kita/sql/*`; the migrations tree is checked against
its own recorded digest above. Consolidating to a single generated source is a
BATCH1 §5/§2 follow-up for Sol re-review, not a contract change.

## Refund FX rounding (Sol blocking item)

Already frozen independently at
`docs/kita-plan/addenda/R1-refund-allocation.md`: cumulative cost allocation
with exactly one half-up rounding; spread is the signed residual; independent
rounding of cost or spread is prohibited. `contract-freeze.md` §2 adopts it.
Implementation belongs to T-LEDGER-02.
