# FORBIDDEN-PATHS — Kita-local register of forbidden code paths (apps/kita)

Scope: `apps/kita/**` only. Status: **register, not proposal** — every entry is already
ruled forbidden by higher authority and mirrored here so Kita lanes never have to leave
the workspace to check.

Authorities (read these first; this file cites, it does not re-decide):

- `docs/kita-plan/SOL-REVIEW.md` — CONDITIONAL-PASS. Batch 1 hard constraint: **NO real
  money, NO fake KYC, NO `addSandboxFunds` / `simulatePartnerCompletion` / admin
  complete / admin fail in the production target.** Second batch only after Sol
  re-review of the scaffold.
- `docs/FORBIDDEN-PRODUCTION-ENDPOINTS.md` (repo root) — **canonical** endpoint register
  with file:line evidence (rows F-01 … F-08). This file is the kita-local view of it.
- `WORKSPACE.md` "Kita slice" — apps/kita is an independent npm workspace; the security
  product at the repository root (`src/`) is the repo's ONLY production target; apps/kita
  must never be wired into a production deploy job.
- `docs/kita-plan/13-backlog.md` — T-PLAT-01 (CI/contract freeze), T-PLAT-02 (isolated
  test DB; sandbox balances never become live cash), T-MIG-01 (dispositions +
  `prohibited_runtime_reference_count`).
- `apps/kita/docs/FORBIDDEN.md` — companion scan-list of forbidden call identifiers.
- `apps/kita/database/config/isolation.json` — machine-readable twin
  (`forbiddenEndpoints[0..6]`, `forbiddenSeedingSources`, `promotionGate`).

## 1. Outcome-manufacturing paths — forbidden in any production-reachable code

| ID | Path | Fabricates | Kita disposition |
|---|---|---|---|
| F-01 | `remittance.addSandboxFunds` (tRPC mutation + ledger primitive) | Spendable wallet balance from nothing (`adjustment` journal, no provider event) | Never ported, imported, called, or defined. CI-blocked (§2). |
| F-02 | `remittance.simulatePartnerCompletion` (tRPC mutation) | Partner attestation of payout delivery + terminal `completed` status + FX/payout journals + loyalty points | Never ported. Terminal `completed` derives only from authenticated provider evidence + approved posting journal. |
| F-03 | admin `complete` (`admin.action` verb) | Final money outcome from the back office: status flip + `completeTransferLedger` journals | Never ported. |
| F-04 | admin `fail` (`admin.action` verb) | Forced `failed` state with no provider failure code or reversal journal | Never ported. Failure is an observed provider state. |
| F-05 | admin `mark_paid_out` / `markPaidOut` (`admin.action` verb) | Intermediate `paid_out` state on an operator's word (same class as F-03/F-04; named by SOL-REVIEW's complete/fail constraint) | Never ported. |
| F-05b | `applyTransferAction` shape (string verb → direct `UPDATE transfers.status` + compensating journals) | The mechanism behind F-03/04/05 | Not ported even partially — the whole shape is the defect. Production transitions go through frozen contract commands + `kita.post_journal` under the posting role. |

Legal occurrences of these names inside apps/kita are ban-naming only: comments, quoted
denylist/register declarations (`apps/admin/app/page.tsx`, `apps/admin/lib/secret-scan.ts`,
`database/tests/isolation-docs.test.mjs`), and denial rows asserting
`allowed: false` / `CAPABILITY_UNAVAILABLE` (`apps/admin/lib/projections.ts`). Anything
else fails CI (§2).

## 2. CI enforcement (this workspace)

- Workflow: `apps/kita/.github/workflows/kita-ci.yml` — triggers only on `apps/kita/**`
  changes; `permissions: contents: read`; no deploy job, no environment, no secrets, no
  OIDC. Implementing the T-MIG-01 metric `prohibited_runtime_reference_count`:
  - Guard step 1 runs `scripts/guard-no-outcome-manufacturing.mjs`: scans all kita source
    for F-01/F-02/F-05 identifiers; fails closed on any executable-position use
    (call, definition, import, unquoted token).
  - Guard step 2 blocks production database hosts/DSNs: cloud/managed DB hostnames may
    appear only as quoted denylist entries; any non-loopback-test postgres DSN (or
    concatenated DSN construction) in code, and ANY host/DSN in committed config
    (*.json/*.yml/*.sql), fails the build.
  - Guard step 3 asserts the root security-product workflow stays Kita-free and that this
    workflow never gains `environment` / `id-token: write` / `packages: write`.
- Companion scans owned by other lanes: `database/tests/no-money-in-scaffold.test.mjs`,
  `database/tests/guard.test.mjs`, `scripts/guard-production-isolation.mjs`.

## 3. Fake-KYC and identity-clearance paths — forbidden everywhere in apps/kita

| ID | Path | Why forbidden | Disposition |
|---|---|---|---|
| K-01 | Seeded/approved KYC cases (`status:"approved"`, `providerRef:"sim_*"`) | Fabricates the verification gate that money depends on | Test fixtures only inside the isolated cluster, always rolled back; never production seeding (`isolation.json` → `forbiddenSeedingSources`). |
| K-02 | Submission self-declaring `pending→approved` without provider contact | Same class as K-01 | `kita.identity_decisions` / `kita.screenings` require `evidence_id NOT NULL` with verified evidence (`docs/kita-plan/sql/001_core.sql:76-77`). |
| K-03 | Any auto-approve / force-match / default-approved KYC affordance | No fake KYC anywhere in batch 1 (SOL-REVIEW) | Forbidden identifier class per `apps/kita/docs/FORBIDDEN.md`; add concrete names there as discovered. |

## 4. Live-provider money paths — forbidden in batch 1

| ID | Path | Constraint |
|---|---|---|
| M-01 | Live provider credentials/accounts/endpoints (Stripe, Adyen, Nium, Thunes, Persona rails) | Batch 1 carries NO real money: no live credentials, no outbound instructions (`isolation.json` → `batchOneScope.liveProviderCalls: false`). External activation requires T-DEPEND-01 + N approvals. Provider adapters stay behind the disabled gate (`packages/domain/src/providers/disabled.ts`). |
| M-02 | Sandbox-labelled provider strings written as real rails (`"Stripe ACH sandbox"` etc.) | Register row F-08: records relationships that never existed; production attribution comes only from real provider account/attempt records. |
| M-03 | Sandbox balance/ID/provider-ref import into live books | T-PLAT-02: fresh install leaves zero money rows; promotion gate aborts on any `sandbox` book against a live target (`isolation.json` → `promotionGate`). |
| M-04 | Production database reachability from kita code or config | Only the isolated test topology exists here: loopback PostgreSQL on port **54339** (`kita_core_test`, `docker-compose.test.yml`) plus `kita_plan_test` on 55432 for schema tests. Enforced by kita-ci guard step 2. |

## 5. Adjacent-but-allowed (recorded to prevent over-blocking)

Per the root register: `cancelOwnTransfer`, `redeemPoints`, and human `reviewKyc` move
existing state or record human decisions without manufacturing funds/outcomes/clearances.
They are **not** batch-1 deliverables either — listed only so lanes do not mistake them
for register entries. Read-only projections that display `allowed: false` denial rows for
F-03/04/05 are ban-enforcement, not violation.

## 6. Change discipline

Anything newly discovered in these classes is appended to the root
`docs/FORBIDDEN-PRODUCTION-ENDPOINTS.md` **and** `apps/kita/docs/FORBIDDEN.md` **and**
`isolation.json → forbiddenEndpoints` in the same change, with a file:line citation from
a source actually read — then reflected here. This file never adds or relaxes a rule on
its own. Second-batch work starts only after Sol re-reviews the scaffold.
