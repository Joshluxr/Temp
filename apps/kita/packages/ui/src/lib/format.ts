/**
 * Ported from docs/kita-sources/kimi-archive/app/src/lib/format.ts (read-only source).
 * Pure Intl formatting helpers — no backend coupling in the original.
 */

export const usd = (value: string | number, maximumFractionDigits = 2) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits }).format(Number(value));

export const php = (value: string | number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 2 }).format(Number(value));

export const payoutLabel: Record<string, string> = {
  bank: "Bank deposit",
  gcash: "GCash",
  maya: "Maya",
  cash_pickup: "Cash pickup",
};

export const paymentLabel: Record<string, string> = {
  bank: "Bank transfer",
  debit: "Debit card",
  credit: "Credit card",
  wallet: "Kita Wallet",
};
