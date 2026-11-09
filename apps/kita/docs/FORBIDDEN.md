# FORBIDDEN.md — prohibited calls and endpoints (apps/kita, all lanes)

Single source of truth scanned by `.github/workflows/ci.yml` (secret/outcome scan) and read by
every batch lane. A match in any production-reachable path fails the build. Source: Sol
CONDITIONAL-PASS batch-1 constraints (`docs/kita-plan/SOL-REVIEW.md`) and parent `WORKSPACE.md`.

## Outcome-manufacturing calls — never in a production-reachable path

| Identifier | Why forbidden |
|---|---|
| `addSandboxFunds` | mints balance with no economic evidence; fake money |
| `simulatePartnerCompletion` | fabricates provider completion; bypasses authenticated evidence |
| admin `complete` / `fail` (manual transfer outcome endpoints) | manufactures transfer outcomes; real outcomes come only from verified provider evidence + approved journals |
| any endpoint that force-matches, auto-approves KYC, or posts a journal without `evidence` + approved posting template | same class; add concrete names here as discovered |

## Standing prohibitions

* **Real money:** no live provider credentials, accounts, or endpoints in batch 1.
* **Fake KYC:** no synthetic/sample KYC approvals presented as verification.
* **Sandbox import:** sandbox balances, IDs, provider refs, or KYC approvals never become live cash
  (TEST-PLAT-02; T-MIG-01 disposition).
* **DB rewind** after an external instruction is forbidden; recovery follows RB-PLATFORM/K4 fencing
  and reconciliation (`docs/runbooks/platform.md`).
* No invented money APIs — bind only to frozen contracts (`docs/kita-plan/06-api-contracts.md`).

## Allowed isolated use

Simulators/fixtures may exist ONLY inside isolated test scope (`sql/002_core_smoke.sql` fixture
rolled back; `kita_core_test` on port 54339) and must be unreachable from production builds
(REQ-SC-21, TEST-PLAT-07). Production startup must fail closed on their import.
