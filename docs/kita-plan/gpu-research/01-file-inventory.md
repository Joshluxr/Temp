# 01 — File inventory (kimi-archive/app)
Date: 2026-11-09 · Method: static read of the unpacked archive; no code executed; consolidated with prior passes coder-01/coder-16/coder-11 and disagreements noted. All paths relative to `docs/kita-sources/kimi-archive/app/`.

## Totals

Verified by `find . -type f -not -path "./node_modules/*" | wc -l` → **142 files** (coder-01's headline number holds exactly).

| area | files | LOC (by ext) | notes |
|---|---|---|---|
| root config/doc | 27 | ts 4 (135L), js 3 (112L), json 8 incl. lockfile, md 3 (119L), html 1 (16L), other dotfiles 8 | `.gitignore` 41L, `package.json` 112L, `vite.config.ts` 68L, `README.md` 68L |
| `api/` (top level) | 7 | .ts 852 L | routers + boot/middleware/context |
| `api/kimi/` | 4 | .ts 218 L | platform auth contract |
| `api/lib/` | 8 | .ts 588 L | server infra |
| `api/queries/` | 2 | .ts 54 L | db factory + user lookup |
| `api/services/` | 1 | .ts 342 L | `core.ts` domain engine |
| **api total** | **22** | **.ts 2,054 L** | |
| `src/` (top level) | 5 | .tsx/.ts 227 L + .css 125 L | App.css/App.tsx/const.ts/index.css/main.tsx |
| `src/pages/` | 13 | .tsx 1,077 L | |
| `src/components/` | 6 | .tsx 606 L | non-ui chrome + QuoteCalculator |
| `src/components/ui/` | 53 | .tsx 6,083 L | vendored shadcn kit = 45% of all TSX LOC |
| `src/hooks/` | 2 | .ts 77 L | |
| `src/lib/` | 3 | .ts 237 L | |
| `src/providers/` | 1 | .tsx 34 L | |
| **src total** | **83** | **.tsx 7,859 L · .ts 315 L · .css 167 L (8,341 L)** | |
| `db/` | 3 + 3 migration artifacts | .ts 373 L, .json 1,501 L, `.gitkeep` 0 L | schema 252 L, seed 120 L, relations 1 L |
| `contracts/` | 3 | .ts 31 L | |
| `public/icons/` | 5 | .png 48 "lines" (binary, 251–3,591 B) | list-only |
| **grand total** | **142** | ~14,177 L excl. lockfile | |

Extension census: `tsx 75 · ts 37 · json 10 · png 5 · md 3 · js 3 · css 2 · prettierrc/prettierignore/gitignore/gitkeep/example/dockerignore/html 1 each`.

**Exclusions:** `node_modules/` does **not exist** in the archive (`ls -d node_modules` → No such file), so nothing was excluded for that reason. `package-lock.json` (13,451 L / 485,654 B) is counted in the 142 but excluded from LOC prose. The 5 PNGs are listed but not content-inspected. `../Kita_Remittance_Technical_Blueprint.pdf` exists one directory **above** app/ (verified) and is outside this inventory.

## Inventory

### root / config
| path | LOC | kind | purpose | key exports/routes | maturity |
|---|---|---|---|---|---|
| `package.json` | 112 | manifest | deps + 12 scripts; name still `"my-app"` (:2), `"type":"module"`, `private:true` | scripts dev/build/lint/preview/start/check/format/test/db:generate/db:migrate/db:push | working (template-named) |
| `package-lock.json` | 13,451 | lockfile | pinned dep tree, present (good for reproducibility) | — | working |
| `vite.config.ts` | 68 | build config | plugins + aliases + PWA manifest | see Config section | working w/ vendor cruft |
| `vitest.config.ts` | 19 | test config | node env, include glob `api/**` only | alias `@assets→attached_assets` (dir absent) | stub/dead |
| `drizzle.config.ts` | 16 | tooling | `schema ./db/schema.ts`, `out ./db/migrations`, `dialect "mysql"`, throws if `DATABASE_URL` unset (:4-7) | — | working |
| `tsconfig.json` | 28 | solution | `files: []` + 3 project references + base paths `@/*`,`@contracts/*`,`@db/*` | — | working |
| `tsconfig.app.json` | 45 | client | strict, `noUnusedLocals`/`noUnusedParameters` ON, includes `src` only | — | working |
| `tsconfig.node.json` | 26 | config | includes only `vite.config.ts` | — | partial |
| `tsconfig.server.json` | 24 | server | includes `api`,`contracts`,`db`; `noEmit` (esbuild emits) | — | partial (missing strict-lint flags) |
| `tailwind.config.js` | 83 | build | v3 theme bridge over CSS vars, `darkMode:["class"]` | — | working |
| `postcss.config.js` | 6 | build | tailwindcss + autoprefixer | — | working |
| `eslint.config.js` | 23 | lint | flat config; browser globals applied to `api/**` too | — | partial |
| `components.json` | 22 | tooling | shadcn config; `tailwind.config` field wrongly points at `postcss.config.js` | — | partial |
| `.env.example` | 17 | config doc | 8 env vars (below) | — | working |
| `.backend-features.json` | 6 | platform meta | `features:["auth","db"]`, `app_id`, `initialized_at` | not imported by any source file | scaffold |
| `.gitignore` | 41 | vcs | line 33 `db/migrations/*.sql` = root cause of missing SQL | — | working-but-harmful |
| `.dockerignore` | 5 | build | 5 entries; no Dockerfile exists | — | scaffold |
| `.prettierrc` / `.prettierignore` | 15 / 35 | format | sane defaults | — | working |
| `index.html` | 16 | html shell | favicon + apple-touch links, title "Kita — Money, closer to home", mounts `/src/main.tsx` | — | working |
| `README.md` | 68 | doc | run procedure (db:push then `npx tsx db/seed.ts`), route table, admin-grant rule, PDF ref | — | working (minor drift) |
| `CREDITS.md` | 21 | doc | OFL font + dep attribution, matches `src/index.css:1-6` | — | working |
| `info.md` | 30 | doc | generator notes; cites nonexistent `src/sections/`, `src/types/`, foreign path `/mnt/agents/output/app` | — | scaffold/misleading |

### api/ (top level)
| path | LOC | kind | purpose | key exports | maturity |
|---|---|---|---|---|---|
| `api/boot.ts` | 107 | server entry | Hono assembly: request-id middleware, scoped `bodyLimit` on `/api/trpc/*`, OAuth callback, tRPC fetch adapter, `/api/log`, `/api/*` 404 catch-all (order load-bearing), prod static serve | `export default app` | working |
| `api/router.ts` | 13 | tRPC root | merges namespaces | `appRouter`, `type AppRouter` (ping/auth/remittance/admin) | working |
| `api/middleware.ts` | 62 | authz | superjson transformer, errorFormatter, `requireAuth`→UNAUTHORIZED, `requireRole`→FORBIDDEN | `createRouter`, `publicQuery`, `authedQuery`, `adminQuery` | working |
| `api/context.ts` | 21 | tRPC ctx | `{req, user, db}` | `TrpcContext`, `createContext` | working |
| `api/auth-router.ts` | 22 | router | thin session wrapper over `api/kimi/*`, cookie maxAge mirror | `authRouter` | working |
| `api/remittance-router.ts` | 293 | router | 17 customer/public procedures (quote, workspace, recipients, KYC, transfers, rate alerts, `addSandboxFunds`, `simulatePartnerCompletion`) | `remittanceRouter` | working (demo-coupled) |
| `api/admin-router.ts` | 334 | router | 12 admin procedures (overview, listTransfers, action, listUsers, reviewKyc, setUserRole, configuration, resolveApproval, audit, reconciliation) | `adminRouter` | working |

### api/services/ · api/kimi/ · api/lib/ · api/queries/
| path | LOC | kind | purpose | key exports | maturity |
|---|---|---|---|---|---|
| `api/services/core.ts` | 342 | domain | fees/FX/double-entry ledger/SHA-256 audit chain/limits | `DEFAULT_CONFIGURATION`, `RemittanceConfiguration`, `PaymentMethod`, `PayoutMethod`, `getConfiguration`, `calculateQuote`, `ensureWorkspace`, `getOrCreateAccount`, `recordLedger`, `platformAccount`, `partnerAccount`, `canonicalizeJson`, `appendAudit`, `addTransferEvent`, `fundingEntries`, `completeTransferLedger`, `walletBalance`, `currentAdminName` | working |
| `api/kimi/auth.ts` | 130 | platform | OAuth code exchange, JWKS verify, cookie session | `authenticateRequest`, `createOAuthCallbackHandler`, `exchangeAuthCode`, `verifyAccessToken` | working (non-portable) |
| `api/kimi/session.ts` | 40 | platform | HS256 sign/verify with `APP_SECRET`, 1-year expiry | `signSessionToken`, `verifySessionToken`, `TokenResponse`, `SessionPayload` | working |
| `api/kimi/platform.ts` | 30 | platform | `/v1/users/me/profile` accessor | `UserProfile` | working |
| `api/kimi/types.ts` | 18 | platform | session/user types (`user|admin`) | type-only | working |
| `api/lib/env.ts` | 19 | infra | env object; required() only enforced when `NODE_ENV=production` | `env` | partial (dev silently gets `""`) |
| `api/lib/logger.ts` | 167 | infra | file logger → `${KIMI_LOG_DIR:-/tmp/kimi-logs}/app.log` | `log`, `appendLine`, `logFilePath` | working |
| `api/lib/clientlog.ts` | 182 | infra | browser-log ingestion endpoint handler | `handleClientLog` | working |
| `api/lib/http.ts` | 91 | infra | status/response helpers | `HttpClient` | working |
| `api/lib/scrub.ts` | 52 | infra | PII/secret redaction for logs | `scrubValue`, `scrubCtx` | working |
| `api/lib/requestcontext.ts` | 37 | infra | request-id ALS | `REQUEST_ID_HEADER`, `runWithRequestId`, `currentRequestId` | working |
| `api/lib/vite.ts` | 23 | infra | dev/prod static-path helper (mirrors `dist/public`) | `serveStaticFiles` | working |
| `api/lib/cookies.ts` | 17 | infra | cookie serialize options | `getSessionCookieOptions` | working |
| `api/queries/users.ts` | 36 | query | union-id lookup + upsert, admin grant | `findUserByUnionId`, `upsertUser` | working |
| `api/queries/connection.ts` | 18 | query | `drizzle(env.databaseUrl,{mode:"planetscale"})` over mysql2; spreads empty `fullSchema` | `getDb`, `DbTransaction`, `Executor` | partial |

### src/ root, pages, components
| path | LOC | kind | purpose | maturity |
|---|---|---|---|---|
| `src/main.tsx` | 17 | entry | side-effect logger import first, StrictMode > BrowserRouter > TRPCProvider > App | working |
| `src/App.tsx` | 42 | routes | 13 routes: `/`,`/login`,`/app`,`/send`,`/recipients`,`/wallet`,`/transfers/:id`,`/admin`,`/admin/{transactions,compliance,configuration,audit}`,`*`; Home/Login/NotFound eager, rest `lazy()` under one Suspense | working (no guards) |
| `src/index.css` | 125 | theme | font @imports + `@tailwind` v3 directives + shadcn `:root` var block | working |
| `src/App.css` | 42 | style | Vite template leftovers (`#root{max-width:1280px}`, logo spin) — **zero importers repo-wide** | dead |
| `src/const.ts` | 1 | const | `LOGIN_PATH="/login"`, duplicates `contracts/constants.ts:13` | scaffold |
| `src/components/AppShell.tsx` | 116 | layout | nav/sidebar/header chrome, "Sandbox environment" banner :60, `SANDBOX` pill :83 | working |
| `src/components/AuthLayout.tsx` | 266 | layout | split-screen marketing/auth frame | working |
| `src/components/AuthLayoutSkeleton.tsx` | 46 | layout | suspense skeleton for auth pages | working |
| `src/components/QuoteCalculator.tsx` | 139 | widget | fee/FX quote UI bound to `remittance-router`, promo-code input, "Sandbox quote" :122 | working (demo copy) |
| `src/components/StatusBadge.tsx` | 25 | atom | transfer status → badge map (consumers: TransferDetails, AdminAudit/Compliance/Transactions) | working |
| `src/components/Brand.tsx` | 14 | atom | logo + wordmark (consumers: Home, AppShell) | working |
| `src/pages/Home.tsx` | 182 | page | public landing, FAQ states "No… no external funds move" :13, live rate pulled from API :89 | working (demo copy) |
| `src/pages/SendMoney.tsx` | 179 | page | transfer wizard | working |
| `src/pages/AdminConfiguration.tsx` | 80 | page | rates/limits/flags editor (densest page: 17,950 B) | working |
| `src/pages/AdminTransactions.tsx` | 127 | page | txn admin grid (17,033 B) | working |
| `src/pages/TransferDetails.tsx` | 121 | page | detail/trace + sandbox receipt download :26,:47 + `simulatePartnerCompletion` controls :82 | working |
| `src/pages/Dashboard.tsx` | 77 | page | post-login summary | working |
| `src/pages/Wallet.tsx` | 57 | page | balance/points/alerts; `addSandboxFunds` :16 | working |
| `src/pages/Recipients.tsx` | 65 | page | beneficiary CRUD + archive | working |
| `src/pages/AdminCompliance.tsx` | 47 | page | KYC console, eKYC-simulation disclaimer :40 | working |
| `src/pages/AdminAudit.tsx` | 36 | page | audit + reconciliation table | working |
| `src/pages/AdminOverview.tsx` | 44 | page | admin KPIs | working |
| `src/pages/Login.tsx` | 41 | page | single Kimi OAuth button, `window.location.href` redirect | partial (no error/loading/env guard) |
| `src/pages/NotFound.tsx` | 21 | page | 404 | working |

### src/hooks · src/lib · src/providers
| path | LOC | kind | purpose | key exports | maturity |
|---|---|---|---|---|---|
| `src/hooks/useAuth.ts` | 58 | hook | client session state + redirects using `const.ts` LOGIN_PATH | `useAuth` | working |
| `src/hooks/use-mobile.ts` | 19 | hook | breakpoint hook, required by `ui/sidebar.tsx` | — | working |
| `src/lib/logger.ts` | 185 | util | browser log batcher → `/api/log` | — | working |
| `src/lib/format.ts` | 46 | util | currency/date/locale | — | working |
| `src/lib/utils.ts` | 6 | util | `cn()` clsx + tailwind-merge | `cn` | working |
| `src/providers/trpc.tsx` | 34 | provider | react-query + trpc proxy client, superjson, relative `../../api/router` type import | `TRPCProvider` | working |

### src/components/ui/ (53 files, 6,083 LOC)
Vendored shadcn/Radix primitives. Verified importer sweep (`grep -rl "ui/<name>" src api`, excluding self): **only 11 primitives have any importer anywhere** — `avatar, button, card, dialog, dropdown-menu, input, label, separator, sheet, sidebar, skeleton, textarea, toggle, tooltip` (14 names appear in the raw string grep; the strict zero-importer computation yields the 41-file prune set below). Largest: `sidebar.tsx` 726 L, `chart.tsx` 357 L, `menubar.tsx` 274 L, `dropdown-menu.tsx` 255 L, `calendar.tsx` 220 L, `field.tsx` 246 L, `context-menu.tsx` 252 L, `carousel.tsx` 239 L.

Verified **zero-importer-anywhere** (safe prune candidates, 41 files): `accordion, alert, alert-dialog, aspect-ratio, badge, breadcrumb, button-group, calendar, carousel, chart, checkbox, collapsible, command, context-menu, drawer, empty, field, form, hover-card, input-group, input-otp, item, kbd, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, slider, sonner, spinner, switch, table, tabs, toggle-group` (+ `textarea/toggle/skeleton/tooltip/dialog/input/label/separator/sheet must be re-checked per-file before deletion because they appear both as page imports and inside ui internals — coder-01's caveat, confirmed).

All rows above are `kind: shadcn primitive · maturity: scaffold-to-working`; purposes are self-describing from filename and were not individually read (unverified beyond import graph).

### db/ · contracts/ · public/
| path | LOC | kind | purpose | key exports | maturity |
|---|---|---|---|---|---|
| `db/schema.ts` | 252 | drizzle | 14 MySQL tables: users, recipients, quotes, transfers, transfer_events, ledger_accounts, ledger_transactions, ledger_entries, kyc_cases, loyalty_entries, rate_alerts, configurations, approval_requests, audit_logs; role enum `user|admin` | `users…auditLogs` + row types `User, InsertUser, Recipient, Quote, Transfer, TransferEvent, LedgerAccount, LedgerTransaction…` | working |
| `db/relations.ts` | 1 | drizzle | entire body is `import {} from "./schema";` — zero relations defined | none | stub |
| `db/seed.ts` | 120 | seed | idempotent fixtures routed through real ledger/audit path (imports 6 helpers from `services/core.ts`); sandbox partner strings throughout | default main | working (demo data) |
| `db/migrations/.gitkeep` | 0 | placeholder | keeps dir tracked | — | scaffold |
| `db/migrations/meta/_journal.json` | 12 | drizzle meta | declares tag `0000_daily_archangel`, dialect mysql | — | stale/broken |
| `db/migrations/meta/0000_snapshot.json` | 1,489 | drizzle meta | 38 KB schema snapshot with no sibling SQL | — | stale |
| `contracts/types.ts` | 2 | shared | `export type * from "../db/schema"` + re-export errors | — | working |
| `contracts/errors.ts` | 15 | shared | error-code taxonomy | — | working |
| `contracts/constants.ts` | 14 | shared | `kimi_sid` cookie name + 1-year maxAge, `login:"/login"`, `oauthCallback:"/api/oauth/callback"` | — | working |
| `public/icons/{favicon-32,apple-touch-icon,icon-192,icon-512,icon-maskable-512}.png` | binary | assets | referenced by `index.html:7-8` + PWA manifest `vite.config.ts:37-39` | — | working |

## Config & dependencies

Declared pins (`package.json` line numbers verified): `react ^19.2.0` (:73), `react-dom ^19.2.0` (:75), `react-router ^7.6.1` (:78) — **no `react-router-dom` dependency exists**; bare `react-router` is used at `src/main.tsx`/`App.tsx`. `vite ^7.2.4` (:109, devDep), `@vitejs/plugin-react ^5.1.1` (:93), `tailwindcss ^3.4.19` (:104, **devDep**) with `tailwindcss-animate ^1.0.7` (:105) *and* orphan `tw-animate-css ^1.4.0` (:106); `hono ^4.8.3` (:66), `@hono/node-server ^1.14.3`, `@hono/vite-dev-server ^0.19.0` (:89, devDep); `@trpc/{client,react-query,server} ^11.8.1` (:54-56), `@tanstack/react-query ^5.90.16` (:53), `superjson ^2.2.6` (:81); `zod ^4.3.5` (:85); `drizzle-orm ^0.45.1` (:64) + `drizzle-kit ^0.31.8` (devDep :95) + `mysql2 ^3.14.1` (:70); `vitest ^4.0.16` (:110); `jose 6.1.3` (:68, exact-pinned), `dotenv ^17.2.3` (:63), `esbuild ^0.27.2`, `typescript ~5.9.3`. Kimi-specific: `kimi-plugin-inspect-react ^1.0.3` (:101, devDep, imported at `vite.config.ts:7`). `vite-plugin-pwa ^2.0.0` sits in **dependencies** (:84), not devDependencies.

Confirmed-unused-for-any-code-path (coder-16 grep, accepted): `ai 6.0.290`, `@ai-sdk/openai-compatible 2.0.78`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `date-fns`, plus Radix packages reachable only from the 41 unimported primitives (`@radix-ui/react-{accordion,alert-dialog,aspect-ratio,checkbox,collapsible,context-menu,hover-card,menubar,navigation-menu,popover,progress,radio-group,scroll-area,select,slider,switch,tabs,toggle-group}`, `@hookform/resolvers`, `cmdk`, `embla-carousel-react`, `input-otp`, `vaul`, `react-resizable-panels`, `react-day-picker`, `recharts`, `next-themes`).

`drizzle.config.ts` → schema `./db/schema.ts`, out `./db/migrations`, dialect `mysql`, hard-requires `DATABASE_URL`.
`vite.config.ts` wires: custom `kimi-preview-host` plugin forcing `server.allowedHosts:["3000.proxy.internal"]`, `devServer({entry:"api/boot.ts", exclude:[/^\/(?!api\/).*$/]})` (Hono-in-Vite dev proxy — there is **no** manual `server.proxy` block), `inspectAttr()`, `react()`, `VitePWA` (autoUpdate, manifest name "Kita Remittance Sandbox", 3 icons, workbox NetworkOnly for `/api/`, NetworkFirst for navigations); aliases `@`, `@contracts`, `@db` **and bare `db`** (load-bearing for `api/queries`-style imports); `build.outDir: dist/public`; `server.port: 3000`.
`vitest.config.ts`: `environment:"node"`, `include:["api/**/*.test.ts","api/**/*.spec.ts"]` — client tests would be silently skipped; alias `@assets → attached_assets` which does not exist here.
`.env.example` declares 8 vars: `APP_ID, APP_SECRET, DATABASE_URL, VITE_KIMI_AUTH_URL, VITE_APP_ID, KIMI_AUTH_URL, KIMI_OPEN_URL, OWNER_UNION_ID`.
`.backend-features.json` claims `features:["auth","db"]` + `app_id` — accurate vs. what the code actually uses (Kimi session auth + MySQL), but **no source file reads it** (grep found no consumer); it is platform-deploy metadata, not runtime config.

## Dead code, gaps and mock markers

- Missing migration SQL: `db/migrations/meta/_journal.json:9` tags `0000_daily_archangel`, but `find . -name "*.sql"` returns nothing. Root cause `app/.gitignore:33` `db/migrations/*.sql` (independently reproduced by coder-16 via `git check-ignore -v`). `npm run db:migrate` cannot succeed.
- Zero test files: `find` for `*.test.*|*.spec.*|__tests__` → empty, despite `package.json:14` `"test": "vitest run"`. `vitest.config.ts:17` glob restricts discovery to `api/` anyway → `npm test` passes vacuously (fake green signal).
- Stub directory/file: `db/relations.ts:1` is a 1-line no-op; its only consumer is `api/queries/connection.ts:4,6`. `db/migrations/.gitkeep` 0 B.
- Dead stylesheet: `src/App.css` (42 L) has zero importers; only textual reference is `info.md:24`.
- Misleading doc: `info.md` documents `src/sections/` and `src/types/` (neither exists — `ls src` shows App.css, App.tsx, components, const.ts, hooks, index.css, lib, main.tsx, pages, providers) and path `/mnt/agents/output/app`.
- Dangling asset refs: `vitest.config.ts:12` `attached_assets/` absent. `README.md` PDF reference resolves only one level **outside** app/ (`../Kita_Remittance_Technical_Blueprint.pdf`, verified present).
- No Dockerfile, no CI config, no LICENSE (`package.json private:true`, no license field) — absence commands in coder-16 §4, not re-run here (unverified beyond that pass).
- 41 unimported `src/components/ui/*.tsx` shipped in the bundle path (see verified list above) ≈ 3,500+ LOC of unused primitives plus their Radix deps.
- Generator/vendor cruft: `vite.config.ts:12-19` hardcoded `3000.proxy.internal` allowedHost; `vite.config.ts:7,22` `kimi-plugin-inspect-react`; `package.json:2` name `"my-app"`; `.dockerignore` (5 lines) with no Dockerfile; `.backend-features.json` unconsumed.
- Env validation gap: `api/lib/env.ts` enforces required vars only under `NODE_ENV=production`; dev silently receives `""`.
- Mock/sandbox markers (all deliberate product simulation, not unfinished code — no `TODO`/`FIXME`/`XXX`/"not implemented" markers were found anywhere in the sweep): `db/schema.ts:158` `default("Sandbox eKYC")`; `db/seed.ts:63-68,83,97,104` sandbox partners ("Thunes/Nium/PERA HUB sandbox", "Stripe ACH sandbox", "Adyen sandbox"), audit action `sandbox.seeded`; `api/remittance-router.ts` procedures `addSandboxFunds` and `simulatePartnerCompletion`; UI chrome `src/components/AppShell.tsx:60,83`, `QuoteCalculator.tsx:122,135` (promo `WELCOME`), `Home.tsx:13,16,25-27,33,45,89,131,178`, `AdminOverview.tsx:12,20`, `Wallet.tsx:16,19,24,31`, `TransferDetails.tsx:26,47,82,114`, `AdminCompliance.tsx:34,40`, `Recipients.tsx:27`, `vite.config.ts:28` manifest name.
- Authz/UI gap (from coder-11, consistent with my route read of `src/App.tsx:24-38`): no route-level guard component wraps `/app`, `/send`, `/wallet`, or `/admin/*`; offline state handled by zero pages; of 7 customer pages only `TransferDetails.tsx` has a query-error branch.

## Build/runtime packaging notes

Distilled from coder-16 and confirmed here: **conditionally buildable, not runnable as-is.** `node_modules/` is absent, so an install is required first; `package-lock.json` is present (485 KB), which makes that install reproducible if the registry/cache is reachable. Frontend `vite build` and backend `esbuild api/boot.ts --bundle --platform=node --format=esm --outdir=dist` (script at `package.json:8`) are statically plausible — all imports resolve to declared deps, and the four-project tsconfig layout (`tsconfig.json` `files:[]` + references to app/node/server, `check` = `tsc -b`) is coherent. Two caveats: `tsconfig.node.json:25` includes only `vite.config.ts`, so `vitest.config.ts`/`drizzle.config.ts`/`postcss.config.js`/`eslint.config.js` are never typechecked; `tsconfig.server.json` lacks the `noUnusedLocals/noUnusedParameters` that `tsconfig.app.json` enforces, so pruning `ui/*` imports is a client-build requirement but not a server one. `npm start` needs `DATABASE_URL` plus a fully-created MySQL schema. DB bootstrap breaks via `db:migrate` (missing SQL) and works only through `db:push` — which is what `README.md:11-13` actually prescribes, alongside `npx tsx db/seed.ts` where `tsx` is not a declared dependency (transitive in the lockfile only, so it may need network). Strictness posture is unusually good: zero `: any`, `as any`, `@ts-ignore`, `@ts-expect-error`, or `eslint-disable` across src/api/contracts/db (coder-16 grep).

## Read-first list

1. `README.md` — the only run/verify procedure (db:push + seed), route table, and the admin-grant rule; authoritative product description of the Kita sandbox.
2. `package.json` — 12 scripts define every entry point; also the dep-pruning target (name `"my-app"`, 6 unused deps, PWA misplaced).
3. `api/boot.ts` — middleware/route ordering is load-bearing (OAuth → tRPC → `/api/log` → `/api/*` 404 → static serve).
4. `api/middleware.ts` — `authedQuery`/`adminQuery` are the entire authorization model; `superjson` must stay mirrored in `src/providers/trpc.tsx`.
5. `db/schema.ts` — 14 tables are the single source of DB truth and the FE type bridge via `contracts/types.ts`.
6. `api/services/core.ts` — quote/FX/ledger/audit-chain engine imported by both routers **and** `db/seed.ts`; changing it moves fixtures and verification simultaneously.
7. `api/remittance-router.ts` — 17 procedure names are bound into every customer page; replacement must preserve the surface or rewrite 13 pages.
8. `api/kimi/auth.ts` — highest-risk, least portable file (platform OAuth/JWKS/cookie); touch last.
9. `src/App.tsx` — the 13-route table plus lazy/Suspense structure; where any route guard must land.
10. `vite.config.ts` — aliases (including bare `db`), dev-server Hono integration, PWA manifest, and the vendor cruft to strip.
11. `contracts/constants.ts` — `kimi_sid`, login path, OAuth callback path duplicated across FE/BE; mismatch logs everyone out.
12. `db/seed.ts` — shows the intended fixture shape and proves seed writes go through the real ledger/audit path.

## Corrections vs prior passes

- **coder-01's 142-file total holds exactly** (recounted). Its Batch-1 byte sizes match my `du -b` spot checks.
- **coder-01 Batch-1 mischaracterized two stacks**: it asserted "Tailwind UI" generically and left `package.json:104` correction to Batch 2 — Batch 2 is right: Tailwind **v3.4.19**, `@tailwind` directives, not v4. It also listed `react-router 7` correctly; note additionally that **`react-router-dom` is not a dependency at all**, which neither pass states explicitly.
- **coder-01's `src/components/ui/*` "53 files / ~170 KB" holds** (53 files, sum ≈ 170 KB, 6,083 LOC). Its claim "**only 14 distinct primitives are referenced**" is approximately right but not exactly reproducible: my strict zero-importer-anywhere computation yields **41 unimported / 12–14 imported** depending on whether internal `ui/` cross-references count, and specifically `select`, `popover`, `table`, `progress` have **no importer anywhere** even though `select.tsx` appeared in coder-01's "referenced" list. Treat coder-01's referenced-set line ("textarea/toggle/skeleton/tooltip/dialog/input/label/separator/sheet appear both as page imports and inside `ui/` internals") as the operative warning and re-verify per-file before deleting.
- **coder-01 called `db/seed.ts` disposition "modify (not replace)"** while Batch 1 said replace; Batch 2's evidence (seed imports six `services/core.ts` helpers) supports modify. Internal contradiction within coder-01, resolved in favor of Batch 2.
- **coder-01 says `README.md:55` references a PDF "not present in this archive"; coder-16 says the path resolves one level up.** Coder-16 is correct — I verified `../Kita_Remittance_Technical_Blueprint.pdf` exists. The README wording is still misleading (implies in-app), so the fix is phrasing, not a broken link.
- **coder-16's `.backend-features.json` verdict ("move/remove … not consumed by any code") is confirmed** by my grep, and it directly contradicts coder-01 Batch 1's "keep — deploy rejects needed services." coder-16 wins on the evidence; the file is inert metadata whose values merely happen to describe reality.
- **coder-16's `components.json` defect is real and coder-01 missed it**: `components.json:6` sets `"tailwind": {"config": "postcss.config.js"}` instead of `tailwind.config.js`.
- **coder-16's "`tailwind/postcss: coherent v3 setup"** holds; its script inventory (12 scripts incl. existing `test` and `db:migrate`) holds, correcting the earlier "missing script" hypothesis.
- **coder-11's frontend tallies** (13 pages, 5 non-ui components, 2 hooks, 3 libs, 1 provider, 53 ui files) match my counts exactly. Its "REMOVE AuthLayout.tsx + AuthLayoutSkeleton.tsx" disposition conflicts with coder-01's "modify/keep" for the same two files — unresolved disagreement, flagged rather than adjudicated (both are imported by the auth route tree, so removal requires rewiring `Login.tsx`).
