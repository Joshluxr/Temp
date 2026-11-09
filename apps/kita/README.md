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
