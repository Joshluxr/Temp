/**
 * @kita/ui — Kita design tokens + presentation components.
 * Ported from docs/kita-sources/kimi-archive/app (read-only). Pure UI: no tRPC,
 * no auth/session, no money/balance wiring of any kind.
 */
export { Brand } from "./Brand";
export { AppShell, PageHeading, EmptyState, type NavItem, type AppShellUser } from "./AppShell";
export { QuoteCalculator, type QuoteInput, type PaymentMethod, type PayoutMethod } from "./QuoteCalculator";
export { usd, php, payoutLabel, paymentLabel } from "./lib/format";
