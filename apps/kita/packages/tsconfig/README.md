# @kita/tsconfig

Shared strict TypeScript compiler options for the Kita monorepo
(T-PLAT-01 contract freeze, `docs/kita-plan/13-backlog.md` "Files — create").

Every flag here is byte-identical to `apps/kita/tsconfig.base.json`. Do not
weaken strictness (`strict`, `noUncheckedIndexedAccess`,
`exactOptionalPropertyTypes`, ...) without a SOL sign-off amendment.

## Files

- `base.json` — the canonical shared config consumers extend:

  ```json
  {
    "extends": "@kita/tsconfig/base.json",
    "compilerOptions": { "outDir": "dist" },
    "include": ["src"]
  }
  ```

- `tsconfig.json` — an identical copy of `base.json`. The backlog names the
  artifact path `packages/tsconfig/tsconfig.json`, but a package whose own
  `tsconfig.json` *extends* a config would be self-referential if that file
  were also the extends-target. So we ship both: `tsconfig.json` satisfies the
  frozen contract path (and acts as the package's own tsconfig when tools
  resolve it by directory), while `base.json` is the documented, non-circular
  extension target. They MUST stay in sync; treat any diff between them as a
  contract violation.

## Usage note

This package is JSON-only (no build, no deps). Workspace packages may add
`"@kita/tsconfig": "*"` to devDependencies and extend `base.json` instead of
duplicating compiler flags. Cross-lane recommendation: existing
`packages/*/tsconfig.json` files should migrate to this package in a later
batch (owned by their respective lanes — not modified here).
