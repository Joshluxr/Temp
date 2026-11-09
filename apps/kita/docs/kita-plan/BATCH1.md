# BATCH1.md — Sol CONDITIONAL-PASS batch 1 coordination record (apps/kita)

Master record for the parallel batch-1 lanes. **Append-only protocol:** each lane writes ONLY
under its own `## coder-NN …` heading and never edits another lane's section or this header.
One agent per heading; no cross-lane rewrites. If a lane needs a change in another lane's file,
record it under "Cross-lane requests" at the bottom of your own section.

Root of all work: `/home/administrator/src/t3mp3st/apps/kita`. Nothing outside this directory is
touched by this batch.

## Lane → exclusive path map

| Lane | Owns (create/change only these paths, relative to `apps/kita`) |
|---|---|
| coder-21 admin-next | `apps/admin/**` |
| coder-22 expo-app | `apps/mobile/**` |
| coder-23 sql-isolate | `sql/**`, `database/**`, `packages/database/**` |
| coder-24 domain-stub | `packages/domain/**`, `packages/contracts/**`, `packages/api-client/**`, `packages/platform/**`, `tests/features/**` |
| coder-25 workspace-docs | `package.json` (workspaces), `pnpm-workspace.yaml`, `docs/FORBIDDEN.md`, `docs/runbooks/platform.md`, `.github/workflows/ci.yml`, `README.md`, this file's structure |

Plan of record (read-only for all lanes): `docs/kita-plan/13-backlog.md` T-PLAT-01/T-PLAT-02,
`12-tests-gates.md` L4/L7, `11-infrastructure.md` K2/K4, `SOL-REVIEW.md`.

## Standing prohibitions (all lanes — violation fails the batch)

* **No real money.** No live provider credentials, endpoints, or production targets. Batch 1 has
  zero monetary effect.
* **No fake KYC.** No sample/synthetic approvals presented as verification evidence; no approval
  bypasses.
* **No outcome-manufacturing calls** in any production-reachable path: `addSandboxFunds`,
  `simulatePartnerCompletion`, admin `complete`/`fail`, and any other endpoint that fabricates a
  transfer/provider/journal result. Enforce via [FORBIDDEN.md](./FORBIDDEN.md) and the CI scan.
* **No sandbox balance import.** Sandbox balances/IDs/provider refs/KYC approvals are never
  imported as live cash (TEST-PLAT-02 assertion).
* **No DB rewind** after an external instruction; schema rollback-by-restore is forbidden while
  remote money may have moved (K2).
* **Do not invent money APIs.** Feature tasks must reference frozen contracts only.

## Isolation guarantee

Only `apps/kita` is written. The parent repo `/home/administrator/src/t3mp3st` is a production
security product: its root `package.json` declares no workspace covering `apps/kita`, its root
`tsconfig.json` excludes it, and root lint/test/build scripts never traverse here. No state-changing
git commands were run by this batch. Postgres work applies `sql/001_core.sql` (+ `002_core_smoke.sql`
verification fixture) only to the isolated test database `kita_core_test` on port **54339** — never
production, never a live cluster.

## coder-21 admin-next

_(pending — lane appends scope, created files, gate results under this heading)_

## coder-22 expo-app

_(pending — lane appends scope, created files, gate results under this heading)_

## coder-23 sql-isolate

_(pending — lane appends scope, created files, gate results under this heading)_

## coder-24 domain-stub

_(pending — lane appends scope, created files, gate results under this heading)_

## coder-25 workspace-docs

Scope delivered by this lane (T-PLAT-01 / T-PLAT-02 coordination + platform scaffolding):

* `docs/kita-plan/BATCH1.md` — this master batch record (skeleton + lane map + prohibitions).
* `.github/workflows/ci.yml` — TEST-PLAT-01 & TEST-PLAT-02 gate pipeline: exact-lock verification,
  no-server-secrets-in-client-bundle scan, fresh-Postgres install check against `sql/001_core.sql`,
  and an explicit no-sandbox-balance-import assertion. References the lanes' test paths
  (`tests/features/test-plat-0{1,2}.spec.ts`, `packages/platform/*`).
* `docs/runbooks/platform.md` — RB-PLATFORM rollback, `migration_failure_count` /
  `build_dependency_drift` observability, least-privilege DB roles.
* `README.md` — updated with the isolated kita tree, T-PLAT-01/02 status, standing prohibitions.
* `package.json` — `workspaces` converted from `apps/*`+`packages/*` globs to the explicit list
  (`customer`, `admin`, `mobile`, `packages/ui`, `packages/domain`, `packages/database`,
  `packages/platform`) so new packages join deliberately.
* `pnpm-workspace.yaml` — same explicit workspace set for the pnpm layout required by T-PLAT-01
  (exact patched lockfiles); note: no lockfile exists yet, so package-manager choice is recorded
  as an open item below.
* `docs/FORBIDDEN.md` — machine-scannable register of prohibited calls/endpoints (the CI scan and
  every lane read this file as the single source of truth).

Status facts (exists vs pending, as of this write):

* Exists: npm-workspace scaffold (`apps/customer`, `apps/admin`, `apps/mobile`, `packages/ui`,
  `packages/domain`), `tsconfig.base.json`, `.gitignore`, `sql/001_core.sql` + `002_core_smoke.sql`
  + `CHECKSUMS.txt` (verbatim copies of architect-owned `docs/kita-plan/sql/`, hashes recorded).
* Pending from other lanes: `packages/database`, `packages/platform`, `packages/contracts`,
  `packages/api-client`, `tests/features/test-plat-01.spec.ts`, `test-plat-02.spec.ts`,
  `pnpm-lock.yaml`. CI steps depending on absent paths fail closed until the lanes land them —
  this is intended, not a broken pipeline.

Open items recorded by this lane:

1. Package manager: root scaffold declares `npm@10` but T-PLAT-01 requires exact patched pnpm
   lockfiles (`pnpm-lock.yaml`). Decision needed from coder-24/coordinator before the freeze;
   `pnpm-workspace.yaml` is provided so either choice resolves without clobbering.
2. `WORKSPACE.md` (parent repo, read-only here) references `docs/FORBIDDEN-PRODUCTION-ENDPOINTS.md`
   which does not exist; `apps/kita/docs/FORBIDDEN.md` is filed as the in-slice register.
