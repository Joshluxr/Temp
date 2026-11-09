# C. Complete application-file migration map

2026-11-09. Inventory includes hidden files, generated lock/migration metadata, all UI primitives and binary icons. No node_modules or vendored dependency tree exists inside this archive. Every physical file has exactly one primary decision; secondary edits required by a move are explicit. Original archive is read-only historical evidence. “Remove” means omit from target, not delete the supplied source archive.

Primary decisions: retain = preserve implementation/content with path/import adjustments; modify = reuse with stated behavior changes; replace = rewrite responsibility using target contracts; move = port useful implementation into target module; remove = exclude from target. All target paths are planned, not already implemented. See [machine inventory](evidence/app-inventory.json) for full SHA-256 and dependency imports.

Migration order: freeze originals/hash inventory → establish contracts/tokens/SQL → port pure UI → implement real domain/provider controls → bind screens → remove prototype endpoints/build paths → integration/security/financial gates → production enablement. No dual financial writers and no sandbox cash migration. Snapshot comparisons preserve visual intent; financial behavior is specified by E/G, not copied from the prototype.


**Exact inventory: 142 files.**

| Source under `kimi-archive/app` | Decision | Planned destination | Required change / reason |
|---|---|---|---|
| `.backend-features.json` | remove | `none` | Kimi generation metadata has no production role. |
| `.dockerignore` | modify | `.dockerignore` | Retain formatting/ignore intent, update workspace outputs, secrets and fixture exclusions. |
| `.env.example` | replace | `config/env.example` | Document secret refs and environment identifiers; no credentials or permissive sandbox defaults. |
| `.gitignore` | modify | `.gitignore` | Retain formatting/ignore intent, update workspace outputs, secrets and fixture exclusions. |
| `.prettierignore` | modify | `.prettierignore` | Retain formatting/ignore intent, update workspace outputs, secrets and fixture exclusions. |
| `.prettierrc` | modify | `.prettierrc` | Retain formatting/ignore intent, update workspace outputs, secrets and fixture exclusions. |
| `CREDITS.md` | retain | `CREDITS.md` | Keep fonts and component attributions; augment SBOM/licenses. |
| `README.md` | replace | `README.md; docs/sandbox-history.md` | Document real setup/gates and preserve archived sandbox provenance without production claims. |
| `api/admin-router.ts` | replace | `apps/api/src/admin/*.controller.ts; packages/domain/admin/*.ts` | Replace two-role access and status forcing with scoped evidence commands, person-level approval, stale-version checks. |
| `api/auth-router.ts` | replace | `apps/api/src/auth/session.controller.ts` | OIDC sessions, actual revocation, device/session inventory; cookie deletion alone does not revoke bearer tokens. |
| `api/boot.ts` | replace | `apps/api/src/main.ts` | Dedicated API boot, 256KiB default bounds, raw callback route, health/readiness; no Vite/static server. |
| `api/context.ts` | replace | `apps/api/src/auth/request-context.ts` | Explicit subject, audience, legal entity, authentication assurance and correlation context. |
| `api/kimi/auth.ts` | remove | `none` | Remove Kimi platform identity/session coupling; replace with validated customer/workforce OIDC, PKCE, nonce/state and revocation. |
| `api/kimi/platform.ts` | remove | `none` | Remove Kimi platform identity/session coupling; replace with validated customer/workforce OIDC, PKCE, nonce/state and revocation. |
| `api/kimi/session.ts` | remove | `none` | Remove Kimi platform identity/session coupling; replace with validated customer/workforce OIDC, PKCE, nonce/state and revocation. |
| `api/kimi/types.ts` | remove | `none` | Remove Kimi platform identity/session coupling; replace with validated customer/workforce OIDC, PKCE, nonce/state and revocation. |
| `api/lib/clientlog.ts` | replace | `apps/api/src/telemetry/ingest.controller.ts` | Authenticated, rate-limited allowlist telemetry; no arbitrary browser log ingestion into privileged local logs. |
| `api/lib/cookies.ts` | modify | `apps/customer-web/src/auth/cookies.ts; apps/admin-web/src/auth/cookies.ts` | Host-only secure cookies, separate names/origins, CSRF and shorter sessions. |
| `api/lib/env.ts` | replace | `packages/config/runtime.ts` | Strict startup validation, secret references, production/sandbox isolation; no fallback money config. |
| `api/lib/http.ts` | replace | `packages/providers/transport.ts` | Per-provider deadlines, typed ambiguity, raw evidence and safe retry policy; no blind payment retry. |
| `api/lib/logger.ts` | modify | `packages/observability/logger.ts` | Structured stdout/OTel, scrub errors, no Kimi-specific local file dependency. |
| `api/lib/requestcontext.ts` | move | `packages/observability/request-context.ts` | Retain AsyncLocalStorage correlation idea; validate upstream IDs and add trace propagation. |
| `api/lib/scrub.ts` | modify | `packages/observability/redaction.ts` | Allowlist structured fields, fuzz PII/PAN/secret redaction; blacklist alone insufficient. |
| `api/lib/vite.ts` | remove | `none` | Vite dev/static wiring retired; Next standalone containers own web serving. |
| `api/middleware.ts` | replace | `apps/api/src/auth/{authentication,authorization}.guard.ts` | Default-deny object/action policy; no user/admin enum gate. |
| `api/queries/connection.ts` | replace | `packages/database/pool.ts` | pg pool, least-privilege role, transactions and retry context. |
| `api/queries/users.ts` | replace | `packages/domain/identity/customer-repository.ts` | Remove ownerUnionId automatic admin; OIDC subject mapping and scoped customers. |
| `api/remittance-router.ts` | replace | `apps/api/src/customer/*.controller.ts` | Port command intent; remove simulatePartnerCompletion/addSandboxFunds, implement REST, ownership and idempotency. |
| `api/router.ts` | replace | `apps/api/src/app.module.ts` | REST modules from OpenAPI, no runtime database row export. |
| `api/services/core.ts` | replace | `packages/domain/{quotes,ledger,transfers,treasury}/*.ts` | Float pricing, simulated funding, unguarded balances and synthetic completion must be replaced by G/E algorithms. |
| `components.json` | modify | `packages/ui-web/components.json` | Shared alias and token destinations for ported primitives. |
| `contracts/constants.ts` | replace | `packages/contracts/src/auth.ts` | Remove one-year Kimi cookie policy; contract constants only. |
| `contracts/errors.ts` | modify | `packages/contracts/src/problem.ts` | Stable codes, requestId, retryability, field errors and operation links. |
| `contracts/types.ts` | replace | `packages/contracts/src/generated.ts` | Generate wire DTOs, do not export DB PII/types. |
| `db/migrations/.gitkeep` | remove | `none` | Replace empty migration evidence with versioned executable SQL. |
| `db/migrations/meta/0000_snapshot.json` | remove | `none` | Generated MySQL metadata not a production migration. |
| `db/migrations/meta/_journal.json` | remove | `none` | Generated MySQL metadata not retained as PostgreSQL history. |
| `db/relations.ts` | remove | `none` | Empty placeholder is not schema evidence; FK relationships reside in SQL. |
| `db/schema.ts` | replace | `packages/database/migrations/001_core.sql` | PostgreSQL executable schema with FK, immutable journal and version/state guards. |
| `db/seed.ts` | replace | `tests/fixtures/sandbox.ts` | Fictional sandbox-only fixtures with environmental fail-closed guard; no production seeding. |
| `drizzle.config.ts` | remove | `none` | MySQL/Drizzle migration path retired; raw SQL migration runner. |
| `eslint.config.js` | modify | `packages/eslint-config/index.js` | Server/client boundaries, no floating money or unawaited financial tasks. |
| `index.html` | replace | `apps/customer-web/app/layout.tsx` | Port metadata/icons into Next metadata; remove Vite script entry. |
| `info.md` | remove | `none` | Generic scaffold notes are obsolete; preserve only in read-only original archive. |
| `package-lock.json` | replace | `pnpm-lock.yaml` | Regenerate from reviewed manifests; lock integrity, licenses and SBOM. |
| `package.json` | replace | `package.json; apps/*/package.json` | pnpm workspaces and exact audited pins; remove mysql2, Kimi, unused AI SDKs and Vite runtime. |
| `postcss.config.js` | move | `packages/design-tokens/postcss.config.js` | Compatible shared Tailwind3 build configuration. |
| `public/icons/apple-touch-icon.png` | retain | `apps/customer-web/public/icons/apple-touch-icon.png; apps/mobile/assets/apple-touch-icon.png` | Keep Kita bitmap asset after visual/license/contrast review; generate platform-required sizes without changing identity. |
| `public/icons/favicon-32.png` | retain | `apps/customer-web/public/icons/favicon-32.png; apps/mobile/assets/favicon-32.png` | Keep Kita bitmap asset after visual/license/contrast review; generate platform-required sizes without changing identity. |
| `public/icons/icon-192.png` | retain | `apps/customer-web/public/icons/icon-192.png; apps/mobile/assets/icon-192.png` | Keep Kita bitmap asset after visual/license/contrast review; generate platform-required sizes without changing identity. |
| `public/icons/icon-512.png` | retain | `apps/customer-web/public/icons/icon-512.png; apps/mobile/assets/icon-512.png` | Keep Kita bitmap asset after visual/license/contrast review; generate platform-required sizes without changing identity. |
| `public/icons/icon-maskable-512.png` | retain | `apps/customer-web/public/icons/icon-maskable-512.png; apps/mobile/assets/icon-maskable-512.png` | Keep Kita bitmap asset after visual/license/contrast review; generate platform-required sizes without changing identity. |
| `src/App.css` | remove | `none` | Unused generic Vite styles and logo animation do not belong in Kita product. |
| `src/App.tsx` | replace | `apps/customer-web/app/layout.tsx; apps/admin-web/app/layout.tsx` | Next route trees; physical admin separation and scoped server reads. |
| `src/components/AppShell.tsx` | modify | `packages/ui-web/customer-shell.tsx; apps/admin-web/components/admin-shell.tsx` | Split customer/admin navigation and audience; replace tRPC identity hooks. |
| `src/components/AuthLayout.tsx` | replace | `apps/admin-web/components/workbench-layout.tsx` | Remove duplicate Kimi scaffold/links and build dedicated workforce workbench. |
| `src/components/AuthLayoutSkeleton.tsx` | move | `packages/ui-web/auth-layout-skeleton.tsx` | Useful skeleton; reduced motion and status semantics. |
| `src/components/Brand.tsx` | retain | `packages/ui-web/brand.tsx` | Retain Kita wordmark; accessible name and correct ink/lime variants. |
| `src/components/QuoteCalculator.tsx` | modify | `apps/customer-web/components/quote-calculator.tsx` | Retain form/composition; server-only pricing, exact strings, stale/expiry distinction and race-safe response selection. |
| `src/components/StatusBadge.tsx` | modify | `packages/ui-web/status-badge.tsx` | Map independent states, neutral review, accessible icons/text; no paid=settled collapse. |
| `src/components/ui/accordion.tsx` | move | `packages/ui-web/ui/accordion.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/alert-dialog.tsx` | move | `packages/ui-web/ui/alert-dialog.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/alert.tsx` | move | `packages/ui-web/ui/alert.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/aspect-ratio.tsx` | move | `packages/ui-web/ui/aspect-ratio.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/avatar.tsx` | move | `packages/ui-web/ui/avatar.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/badge.tsx` | move | `packages/ui-web/ui/badge.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/breadcrumb.tsx` | move | `packages/ui-web/ui/breadcrumb.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/button-group.tsx` | move | `packages/ui-web/ui/button-group.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/button.tsx` | move | `packages/ui-web/ui/button.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/calendar.tsx` | move | `packages/ui-web/ui/calendar.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/card.tsx` | move | `packages/ui-web/ui/card.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/carousel.tsx` | move | `packages/ui-web/ui/carousel.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/chart.tsx` | move | `packages/ui-web/ui/chart.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/checkbox.tsx` | move | `packages/ui-web/ui/checkbox.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/collapsible.tsx` | move | `packages/ui-web/ui/collapsible.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/command.tsx` | move | `packages/ui-web/ui/command.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/context-menu.tsx` | move | `packages/ui-web/ui/context-menu.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/dialog.tsx` | move | `packages/ui-web/ui/dialog.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/drawer.tsx` | move | `packages/ui-web/ui/drawer.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/dropdown-menu.tsx` | move | `packages/ui-web/ui/dropdown-menu.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/empty.tsx` | move | `packages/ui-web/ui/empty.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/field.tsx` | move | `packages/ui-web/ui/field.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/form.tsx` | move | `packages/ui-web/ui/form.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/hover-card.tsx` | move | `packages/ui-web/ui/hover-card.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/input-group.tsx` | move | `packages/ui-web/ui/input-group.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/input-otp.tsx` | move | `packages/ui-web/ui/input-otp.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/input.tsx` | move | `packages/ui-web/ui/input.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/item.tsx` | move | `packages/ui-web/ui/item.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/kbd.tsx` | move | `packages/ui-web/ui/kbd.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/label.tsx` | move | `packages/ui-web/ui/label.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/menubar.tsx` | move | `packages/ui-web/ui/menubar.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/navigation-menu.tsx` | move | `packages/ui-web/ui/navigation-menu.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/pagination.tsx` | move | `packages/ui-web/ui/pagination.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/popover.tsx` | move | `packages/ui-web/ui/popover.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/progress.tsx` | move | `packages/ui-web/ui/progress.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/radio-group.tsx` | move | `packages/ui-web/ui/radio-group.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/resizable.tsx` | move | `packages/ui-web/ui/resizable.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/scroll-area.tsx` | move | `packages/ui-web/ui/scroll-area.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/select.tsx` | move | `packages/ui-web/ui/select.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/separator.tsx` | move | `packages/ui-web/ui/separator.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/sheet.tsx` | move | `packages/ui-web/ui/sheet.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/sidebar.tsx` | move | `packages/ui-web/ui/sidebar.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/skeleton.tsx` | move | `packages/ui-web/ui/skeleton.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/slider.tsx` | move | `packages/ui-web/ui/slider.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/sonner.tsx` | move | `packages/ui-web/ui/sonner.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/spinner.tsx` | move | `packages/ui-web/ui/spinner.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/switch.tsx` | move | `packages/ui-web/ui/switch.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/table.tsx` | move | `packages/ui-web/ui/table.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/tabs.tsx` | move | `packages/ui-web/ui/tabs.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/textarea.tsx` | move | `packages/ui-web/ui/textarea.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/toggle-group.tsx` | move | `packages/ui-web/ui/toggle-group.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/toggle.tsx` | move | `packages/ui-web/ui/toggle.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/components/ui/tooltip.tsx` | move | `packages/ui-web/ui/tooltip.tsx` | Port existing accessible primitive; replace aliases/use-mobile imports, test keyboard/focus and Kita contrast; add use client only where hooks/browser APIs require it. |
| `src/const.ts` | modify | `packages/contracts/src/routes.ts` | Named customer routes; no hardcoded Kimi login. |
| `src/hooks/use-mobile.ts` | move | `packages/ui-web/hooks/use-mobile.ts` | Retain responsive hint; never authorization or native platform detection. |
| `src/hooks/useAuth.ts` | replace | `packages/api-client/use-session.ts` | OIDC session read, rotation/revocation, real permissions, clear caches on logout. |
| `src/index.css` | modify | `packages/design-tokens/kita.css` | Preserve ink/warm/lime and fonts; correct exact hex/contrast, import in both web apps. |
| `src/lib/format.ts` | replace | `packages/money/format.ts` | Exact BigInt/string formatting and locale/currency exponents; remove Number conversion. |
| `src/lib/logger.ts` | replace | `packages/observability/browser.ts` | Consent-aware allowlist and no screen replay on money/identity pages. |
| `src/lib/utils.ts` | retain | `packages/ui-web/lib/utils.ts` | Class merging utility remains useful, module path adjusted. |
| `src/main.tsx` | remove | `none` | Next owns hydration and entry point. |
| `src/pages/AdminAudit.tsx` | modify | `apps/admin-web/app/audit/page.tsx` | Retain useful Kita layout; replace tRPC with scoped OpenAPI queries and full empty/error/pending states. Use authorized commands and independent approval, no forced complete/fail. |
| `src/pages/AdminCompliance.tsx` | modify | `apps/admin-web/app/compliance/page.tsx` | Retain useful Kita layout; replace tRPC with scoped OpenAPI queries and full empty/error/pending states. Use authorized commands and independent approval, no forced complete/fail. |
| `src/pages/AdminConfiguration.tsx` | modify | `apps/admin-web/app/configuration/page.tsx` | Retain useful Kita layout; replace tRPC with scoped OpenAPI queries and full empty/error/pending states. Use authorized commands and independent approval, no forced complete/fail. |
| `src/pages/AdminOverview.tsx` | modify | `apps/admin-web/app/page.tsx` | Retain useful Kita layout; replace tRPC with scoped OpenAPI queries and full empty/error/pending states. Use authorized commands and independent approval, no forced complete/fail. |
| `src/pages/AdminTransactions.tsx` | modify | `apps/admin-web/app/transfers/page.tsx` | Retain useful Kita layout; replace tRPC with scoped OpenAPI queries and full empty/error/pending states. Use authorized commands and independent approval, no forced complete/fail. |
| `src/pages/Dashboard.tsx` | modify | `apps/customer-web/app/home/page.tsx` | Retain useful Kita layout; replace tRPC with scoped OpenAPI queries and full empty/error/pending states. Remove sandbox success/funding controls; implement provider-backed flow and truthful financial status. |
| `src/pages/Home.tsx` | modify | `apps/customer-web/app/page.tsx` | Retain useful Kita layout; replace tRPC with scoped OpenAPI queries and full empty/error/pending states. Remove sandbox success/funding controls; implement provider-backed flow and truthful financial status. |
| `src/pages/Login.tsx` | modify | `apps/customer-web/app/login/page.tsx` | Retain useful Kita layout; replace tRPC with scoped OpenAPI queries and full empty/error/pending states. Remove sandbox success/funding controls; implement provider-backed flow and truthful financial status. |
| `src/pages/NotFound.tsx` | modify | `apps/customer-web/app/not-found.tsx` | Retain useful Kita layout; replace tRPC with scoped OpenAPI queries and full empty/error/pending states. Remove sandbox success/funding controls; implement provider-backed flow and truthful financial status. |
| `src/pages/Recipients.tsx` | modify | `apps/customer-web/app/recipients/page.tsx` | Retain useful Kita layout; replace tRPC with scoped OpenAPI queries and full empty/error/pending states. Remove sandbox success/funding controls; implement provider-backed flow and truthful financial status. |
| `src/pages/SendMoney.tsx` | modify | `apps/customer-web/app/send/page.tsx` | Retain useful Kita layout; replace tRPC with scoped OpenAPI queries and full empty/error/pending states. Remove sandbox success/funding controls; implement provider-backed flow and truthful financial status. |
| `src/pages/TransferDetails.tsx` | modify | `apps/customer-web/app/transfers/[id]/page.tsx` | Retain useful Kita layout; replace tRPC with scoped OpenAPI queries and full empty/error/pending states. Remove sandbox success/funding controls; implement provider-backed flow and truthful financial status. |
| `src/pages/Wallet.tsx` | modify | `apps/customer-web/app/wallet/page.tsx` | Retain useful Kita layout; replace tRPC with scoped OpenAPI queries and full empty/error/pending states. Remove sandbox success/funding controls; implement provider-backed flow and truthful financial status. |
| `src/providers/trpc.tsx` | replace | `packages/api-client/query-provider.tsx` | OpenAPI client with scoped query keys and conservative mutation retry. |
| `tailwind.config.js` | modify | `packages/design-tokens/tailwind.config.ts` | Keep Tailwind3 during port; scan workspace components; retain Kita palette. |
| `tsconfig.app.json` | replace | `packages/tsconfig/tsconfig.app.json` | Strict monorepo Node/Next/Expo targets, separate DOM/native types and no unchecked indexed access. |
| `tsconfig.json` | replace | `packages/tsconfig/tsconfig.json` | Strict monorepo Node/Next/Expo targets, separate DOM/native types and no unchecked indexed access. |
| `tsconfig.node.json` | replace | `packages/tsconfig/tsconfig.node.json` | Strict monorepo Node/Next/Expo targets, separate DOM/native types and no unchecked indexed access. |
| `tsconfig.server.json` | replace | `packages/tsconfig/tsconfig.server.json` | Strict monorepo Node/Next/Expo targets, separate DOM/native types and no unchecked indexed access. |
| `vite.config.ts` | remove | `none` | Retire Vite/PWA plugin and Kimi inspector; reviewed Next/Expo build configuration replaces it. |
| `vitest.config.ts` | replace | `vitest.workspace.ts` | Domain fixtures plus real PostgreSQL concurrency/invariant integration tests. |

## Migration acceptance
Every row is assigned to T-MIG-01 plus its domain feature task. Review rejects missing, duplicate, or extra source paths, unresolved Kimi/MySQL imports, sandbox controls in production bundles, and retained floating-point financial paths. New files (mobile, providers, SQL, workers, security, finance) are in M; this table does not imply the old archive already contained them.

## Data and rollback
Import only demonstrably needed user/recipient data after consent/legal review, encryption and re-verification; sandbox IDs, balances, approval history and fictional provider references never become production facts. Preserve a source→target ID map for any lawful import. The first production ledger opens from signed bank/provider evidence. Use expand/contract deployment and feature routing; rollback UI/API code only while schemas remain compatible. After any real external instruction, reconcile and recover forward.
