import { createHash } from "node:crypto";

/**
 * T-PLAT-02 checksum + invariant module.
 *
 * INVARIANT (KITA-PLAT-02): sandbox balances never become live cash. The install path
 * carries NO data import of sandbox balances/amounts — schema/DDL only. These exports are
 * the single source of truth for what counts as a "money row" so migrate.ts and the
 * acceptance spec can never drift on the definition.
 */

export const sha256Hex = (data: string | Uint8Array): string =>
  createHash("sha256").update(data).digest("hex");

/** Money-bearing columns: any INSERT supplying these during install is a money import. */
export const MONEY_COLUMNS: readonly string[] = [
  "normal_minor",
  "principal_minor",
  "fee_minor",
  "discount_minor",
  "tax_minor",
  "total_minor",
  "receive_minor",
  "source_minor",
  "destination_minor",
  "amount_minor",
  "allocated_minor",
  "difference_minor",
  "goodwill_minor",
  "budget_minor",
  "maximum_minor",
  "reserved_minor",
  "consumed_minor",
  "signed_minor",
  "atomic_units",
];

/** Tables whose rows ARE economic state; they must be exactly empty after a fresh install. */
export const MONEY_TABLES: readonly string[] = [
  "books",
  "customers",
  "transfers",
  "quotes",
  "money_operations",
  "wallet_quotes",
  "funding_instruments",
  "mandates",
  "limit_buckets",
  "limit_reservations",
  "ledger_accounts",
  "account_balances",
  "journals",
  "journal_lines",
  "liquidity_reservations",
  "refund_obligations",
  "refund_allocations",
  "disputes",
  "statement_files",
  "statement_lines",
  "reconciliation_matches",
  "reconciliation_breaks",
  "fx_trades",
  "fx_allocations",
  "treasury_movements",
  "campaigns",
  "reward_reservations",
  "point_lots",
  "point_events",
  "bill_payments",
  "staff_grants",
];

/** Reference/config tables allowed to carry DDL-defined rows at install time. */
export const SEED_ALLOWED_TABLES: ReadonlySet<string> = new Set([
  "currencies", // code+exponent reference rows only; no amounts
  "attempt_edges", // provider state-machine rules; no outcomes, no amounts
]);

/**
 * Install-time guard used BEFORE any migration SQL reaches the server: rejects top-level
 * INSERTs that target non-seed tables or supply money columns. CREATE TRIGGER/FUNCTION
 * bodies legitimately insert balance rows inside post_journal (the sanctioned runtime
 * path), so statements inside dollar-quoted bodies are excluded — top-level INSERTs are
 * the only install-time import vector this guard models.
 */
export function findMoneyImport(sql: string): string | null {
  const lines = sql.split("\n");
  let insideBody = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    insideBody = ((insideBody ? 1 : 0) + (line.match(/\$\$/g)?.length ?? 0)) % 2 === 1;
    if (insideBody) continue;
    const m = /^\s*INSERT\s+INTO\s+([a-z_][a-z0-9_]*)\b/i.exec(line);
    if (m === null) continue;
    const table = m[1]!.toLowerCase();
    if (!SEED_ALLOWED_TABLES.has(table)) {
      return `line ${i + 1}: INSERT into "${table}" is not an allowed non-monetary seed table`;
    }
    const stmtEndOffset = lines.slice(i).findIndex((l) => l.includes(";"));
    const stmt = lines.slice(i, i + (stmtEndOffset < 0 ? 1 : stmtEndOffset + 1)).join(" ");
    const moneyColumn = MONEY_COLUMNS.find((c) => new RegExp(`\\b${c}\\b`).test(stmt));
    if (moneyColumn !== undefined) {
      return `line ${i + 1}: seed INSERT references money column "${moneyColumn}"`;
    }
  }
  return null;
}
