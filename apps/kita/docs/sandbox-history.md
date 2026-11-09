# Sandbox history — what the archived prototype was, and what never imports

Task: T-MIG-01 (`docs/kita-plan/13-backlog.md`). Companion to
[`migration/disposition-manifest.json`](migration/disposition-manifest.json) and the plan's
section C ([`docs/kita-plan/03-migration-map.md`](../../../docs/kita-plan/03-migration-map.md)).

## The rule

**Sandbox balances never import.** No balance, wallet funding amount, ledger row, transfer
status, provider reference, KYC approval or entity ID produced by the archived prototype's
sandbox ever becomes a production fact in Kita. The first production ledger opens only from
signed bank/provider opening evidence (`03-migration-map.md`, "Data and rollback"). This is
TEST-PLAT-02 and REQ-SC-21; `database/config/isolation.json → forbiddenSeedingSources` is the
machine-readable twin, and a fresh core install must leave zero rows in `books`, `journals`,
`journal_lines`, `account_balances`, `treasury_movements`.

## Where the fake money came from

Source: `docs/kita-sources/kimi-archive/app` (read-only historical evidence — see below).

| Archive location | What it did | Why it can never port |
|---|---|---|
| `api/remittance-router.ts:242` — `addSandboxFunds` mutation | Minted spendable wallet balance from an operator-side call: wrote an `adjustment` journal ("Sandbox wallet top-up", `$10–$5000`) with no provider event behind it. | Fabricates funds. Banned outright: register F-01 in `docs/FORBIDDEN-PATHS.md`; `scripts/check-migration-inventory.ts` fails if it is a production export. |
| `src/pages/Wallet.tsx:16` — `topUp` control | UI affordance that invoked `addSandboxFunds` and announced "…is now available in your sandbox wallet." | A funding button in a customer bundle is outcome manufacturing at the edge. Disposition `replace`: layout ports to `apps/customer-web/app/wallet/page.tsx`, the control does not. |
| `db/schema.ts:114,128,141` — MySQL ledger tables | `decimal(20,2)` float-shaped amounts with no book or legal-entity dimension. | Cannot map onto `kita.account_balances` without inventing provenance; the MySQL/Drizzle path is dispositioned `remove` (`drizzle.config.ts`, `db/migrations/meta/**`). |
| `db/seed.ts:25,63-68,97,101-104` — sandbox seeding | Fictional transfers, audit action `sandbox.seeded`, and an `adjustment:seed-wallet` "Sandbox wallet opening balance". | Fictional provenance. Refiled by manifest to `tests/fixtures/sandbox.ts` behind an environmental fail-closed guard; unreachable from production builds. |
| `api/services/core.ts` — simulated funding + synthetic completion | Unguarded balance arithmetic and partner-completion simulation. | Disposition `replace`; real outcomes derive only from authenticated provider evidence plus approved posting journals. |

## Dispositions, restated

* **`remove` (15 files)** — omitted from the target entirely (Kimi platform coupling, Vite
  wiring, MySQL metadata, scaffold notes). See the manifest for the exact list.
* **`port-ui-only` (60 files)** — visual intent ports (shadcn/Radix primitives under
  `src/components/ui/**`, Kita icons under `public/icons/**`, `use-mobile.ts`, `lib/utils.ts`).
  Presentation crosses; behavior, state and money semantics do not.
* **`replace` (67 files)** — rewritten against frozen contracts, including every file above
  that carried sandbox money paths.

Every one of the 142 archive files carries exactly one primary disposition; missing, duplicate
or extra paths fail the inventory check.

## No money posting

This batch posts nothing. There is no journal creation, no balance adjustment, no settlement,
and no live provider credential anywhere in scope — `packages/domain/src/providers/disabled.ts`
keeps every adapter behind the disabled gate, and `docs/FORBIDDEN.md` bars the
outcome-manufacturing calls (`addSandboxFunds`, `simulatePartnerCompletion`, admin
`complete`/`fail`/`mark_paid_out`).

## The archive is read-only evidence

`docs/kita-sources/**` — including `kimi-archive/` — is preserved historical evidence and
**must never be deleted**, including for rows dispositioned `remove`. "Remove" means "omit from
the target", per section C of the migration map. Rollback never deletes evidence either.
