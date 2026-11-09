# @kita/ui

Kita design tokens + presentation components, ported on **2026-11-09** from
`docs/kita-sources/kimi-archive/app` (read-only Vite/React sandbox archive — never modified).

Created under the Sol **CONDITIONAL-PASS** first batch (T-PLAT-01 / T-PLAT-02):
*"port Kita UI tokens/components from kimi-archive without wiring sandbox money
minting"*. This package is therefore **pure presentation**: it contains no tRPC,
no auth/session, no API calls, and no money-path code.

## Exports

| Entry | What | File |
| --- | --- | --- |
| `@kita/ui` | `Brand`, `AppShell`, `PageHeading`, `EmptyState`, `QuoteCalculator` + format helpers | `src/index.ts` (raw TS, typed via `types`) |
| `@kita/ui/styles.css` | Design tokens (`:root` custom properties), base body/selection styles, utility classes (`.ink-panel`, `.lime-highlight`, `.display-hero`, `.control*`, `.field`, `.surface`, …) | `src/tokens.css` |

Ship raw TS source (no build step): consume from Next.js with
`transpilePackages: ["@kita/ui"]` and import `@kita/ui/styles.css` once in the
root layout. Tailwind v4 can read the `hsl(var(--token))` custom properties
directly; `tokens.css` itself needs no Tailwind (all `@apply`/`@layer`/`@tailwind`
directives were rewritten as plain CSS). Font loading was de-coupled: stacks are
`"Hanken Grotesk", system-ui, sans-serif` and `"Newsreader", Georgia, serif` —
host apps that want the real faces add their own `@fontsource` imports.

## What was stripped and why

All removals trace to the Sol CONDITIONAL-PASS review: **no sandbox money
minting, no fake KYC, no backend outcome manufacturing in this batch.**

### QuoteCalculator (`src/QuoteCalculator.tsx`)
Removed backend/money couplings:
- `import { trpc } from "@/providers/trpc"` — deleted entirely.
- `trpc.remittance.currentRate.useQuery()` (server live FX rate + fee table) → static demo fee table `demoFees` and a `midMarketRate` prop (default 58.0), clearly labelled "Demo quote — presentation only, not a binding rate".
- `trpc.remittance.createQuote.useMutation()` + the debounced `quoteMutation.mutate({ amount, direction, paymentMethod, payoutMethod, promoCode })` effect (this created server-side quotes tied to balances) → removed. Selections now flow out through `onSubmit?: (input: QuoteInput) => void` / `onChange?` props; the host app owns any pricing/quoting logic.
- Server quote expiry countdown (`quote.expiresAt` interval) and `quoteMutation.error` alert banner → removed (they only exist against a live mutation).
- `useNavigate()` react-router redirect to `/send?quote=<id>` → replaced by the optional `onSubmit` callback.
- Promo "Apply" previously fed `promoCode` into the server mutation → now purely local state + `onChange` notification.

### AppShell (`src/AppShell.tsx`)
Removed auth/session couplings:
- `import { useAuth } from "@/hooks/useAuth"` — that hook wraps `trpc` session queries and `useNavigate`; deleted. No `user`/`isLoading`/`logout` from a provider.
- Unauthenticated-loading spinner, `if (!user) return null`, and the admin-role gate screen ("Administrator access required") → removed; identity is now a display-only `user?: { name; email; role }` prop and nav items are props/static demo lists with an `activeHref` prop instead of router `NavLink` matching.
- `logout` handler call → replaced by optional `onSignOut?: () => void` prop (the component itself calls nothing).
- react-router `Link`/`NavLink` → plain anchors (router-agnostic).

### Brand (`src/Brand.tsx`)
- react-router `Link` → plain `<a href>`; otherwise verbatim.

### tokens.css (from `src/index.css` + `tailwind.config.js`)
- Dropped 7 `@fontsource/hanken-grotesk` / `@fontsource/newsreader` imports and the three `@tailwind` directives; replaced with plain font-family fallback stacks. All token values (primitives `--primitive-ink/cream/paper/lime/sage`, every semantic alias through `--sidebar-ring`, and utilities `.ink-panel`, `.lime-highlight`, `::selection`) are verbatim, including the warm cream/paper tones of the ink/warm/lime palette.

## Not included (deliberately)

The kimi archive's `src/providers/trpc*`, `src/hooks/useAuth.ts`, `db/`, and any
balance/funding code were **not** ported. Nothing here references
`addSandboxFunds`, `simulatePartnerCompletion`, or admin complete/fail flows.
