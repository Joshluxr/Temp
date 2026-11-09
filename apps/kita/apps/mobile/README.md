# @kita/mobile — T-PLAT-01 placeholder

Minimal Expo scaffold for the Kita mobile slice. Placeholder only.

- No provider SDKs (Bridge, ZeroKey, Velo, Circle, etc.) are present or wired.
- No wallet, balance, transfer, or KYC code in batch 1.
- Dependencies are intentionally NOT installed at the repo root; this package
  exists as source-of-record scaffolding under the `apps/kita` npm workspace
  (`apps/kita/package.json` globs `apps/*`). Run `npm install` inside
  `apps/kita/` only when a later Sol-approved batch requires it.
- Single screen (`App.tsx`) rendered via `registerRootComponent`; no
  navigation library.

## Scripts (require deps installed)

- `npm start` — `expo start`
- `npm run android` / `npm run ios`
- `npm run typecheck` — `tsc --noEmit`

## tsconfig note

Extends `../../tsconfig.base.json` but overrides `moduleResolution` to
`"node"`: the workspace base uses `"bundler"`, which Expo/Metro tooling does
not support for bare React Native package resolution.
