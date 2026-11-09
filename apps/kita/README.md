# Kita slice (apps/kita)

Independent npm workspace holding the Kita app: Next.js customer/admin web apps, an Expo
mobile app, and shared packages (`packages/domain`, `packages/database`, `packages/contracts`).
It is scaffolded under Sol CONDITIONAL-PASS batch 1 (**T-PLAT-01** monorepo scaffold,
**T-PLAT-02** Postgres schema applied in an isolated test database only).

## Isolation from the root build

`apps/kita` is **not** part of the t3mp3st root build. The root `package.json` does not declare
it as a workspace, the root `tsconfig.json` does not include it, and the root lint/test/build
scripts never traverse into this directory. Nothing here imports from or writes to the security
product at the repository root. Treat it as a separate project that happens to live in a
subdirectory.

## Install and run

```bash
cd apps/kita
npm install
npm run dev        # also: build, test, lint, typecheck
```

All commands run from `apps/kita`. Workspace scripts fan out with
`npm run --workspaces --if-present <script>`, so sub-packages that do not define a script are
skipped without failing the run. Extend the `workspaces` globs (`apps/*`, `packages/*`) by adding
child packages with their own `package.json`; each child should `extends`
`../../tsconfig.base.json`.

## Scope guardrails (batch 1)

No live providers, no money paths, no fake KYC. Specifically forbidden in any production target:
`addSandboxFunds`, `simulatePartnerCompletion`, admin `complete`/`fail`, and any other endpoint
that manufactures an outcome. See [WORKSPACE.md](../../WORKSPACE.md) — *Kita slice* — for the
isolated test database (`kita_core_test`, port 54339; never production) and the forbidden-endpoint
list.

## Batch-1 coordination record and platform artifacts (T-PLAT-01 / T-PLAT-02)

* Master batch record with per-lane append sections: [docs/kita-plan/BATCH1.md](docs/kita-plan/BATCH1.md).
* Prohibited-call register (CI-scanned): [docs/FORBIDDEN.md](docs/FORBIDDEN.md).
* Platform CI gates TEST-PLAT-01/02: [.github/workflows/ci.yml](.github/workflows/ci.yml) —
  exact-lock verification, server-secret-in-client-bundle scan, fresh Postgres install of
  `sql/001_core.sql`, and a no-sandbox-balance-import assertion.
* RB-PLATFORM rollback, `migration_failure_count` / `build_dependency_drift` observability, and
  least-privilege DB roles: [docs/runbooks/platform.md](docs/runbooks/platform.md); role DDL seed
  at [sql/roles.sql](sql/roles.sql) (isolated test DB only).

### Tree status (exists vs pending)

```
apps/kita
├── apps/customer   @kita/customer  Next.js          (exists)
├── apps/admin      @kita/admin     Next.js          (exists; lane coder-21 in progress)
├── apps/mobile     @kita/mobile    Expo             (exists; lane coder-22 in progress)
├── packages/ui     @kita/ui        tokens/components(exists)
├── packages/domain @kita/domain    enums/money      (exists; stubs via lane coder-24)
├── packages/database @kita/database  migrate/invariant (landing — lane coder-23)
├── packages/platform               validate-build-baseline (landing — lane coder-24)
├── packages/contracts, api-client  platform/context/result + command-recovery (landing)
├── sql/            001_core.sql, 002_core_smoke.sql, CHECKSUMS.txt,
│                   roles.sql (least-privilege role contract)
└── tests/features/ test-plat-01/02.spec.ts           (pending — lane coder-24)
```

The root `workspaces` list is now explicit (no globs) so new packages join deliberately; see
BATCH1.md for the lane/path ownership map. Standing prohibitions above remain absolute: batch 1
carries no real money, no fake KYC, no outcome-manufacturing calls, and sandbox balances never
become live cash.
