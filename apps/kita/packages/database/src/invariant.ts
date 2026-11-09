import { createHash } from "node:crypto";

/**
 * T-PLAT-02 checksum + invariant module.
 *
 * INVARIANT (KITA-PLAT-02): sandbox balances never become live cash. The install path
 * carries NO data import of sandbox balances/amounts — schema/DDL only. These exports are
 * the single source of truth for what counts as a "money row" so migrate.ts and the
 * acceptance spec can never drift on the definition.
 */

export interface MigrationFile {
  readonly version: number;
  readonly name: string;
  readonly sql: string;
}

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
 * Static guard used BEFORE any migration SQL reaches the server: rejects INSERT statements
 * that target money tables or name money columns. CREATE TRIGGER bodies legitimately insert
 * balance rows inside post_journal (the sanctioned runtime path), so lines beginning with
 * "INSERT INTO kita." from within plpgsql function bodies are excluded — top-level INSERTs
 * are the only install-time import vector this guard models.
 */
export function findMoneyImport(sql: string): string | null {
  const lines = sql.split("\n");
  let dollarQuoteOpen = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    dollarQuoteOpen = (dollarQuoteOpen + (line.match(/\$\$/g)?.length ?? 0)) % 2 === 1;
    const match = /^\s*INSERT\s+INTO\s+([a-z_][a-z0-9_]*)\b/i.exec(line);
    if (match === null) continue;
    const table = match[1]!.toLowerCase();
    if (!MONEY_TABLES.includes(table)) continue;
    return `line ${i + 1}: INSERT into money table "${table}" — sandbox balances must never become live cash`;
  }
  // Money-column names may only appear in DDL context (column definitions/CHECKs/triggers),
  // never in a top-level VALUES/SELECT import outside a function body.
  for (const column of MONEY_COLUMNS) {
    const importShape = new RegExp(`^\\s*(INSERT|COPY)\\b[^;]*\\b${column}\\b`, "im");
    const hit = importShape.exec(sql);
    if (hit !== null && !dollarQuoteOpen) {
      // crude but conservative: flag any top-level statement naming a money column
      const idx = hit.index;
      const before = sql.slice(0, idx);
      const dqCount = (before.match(/\$\$/g)?.length ?? 0) % 2;
      if (dqCount === 0) {
        const stmtStart = before.lastIndexOf(";");
        const stmt = sql.slice(stmtStart + 1, idx + 200);
        if (!/CREATE\s+(TRIGGER|FUNCTION)/i.test(stmt)) {
          return `top-level statement references money column "${column}" outside DDL: possible balance import`;
        }
      }
    }
  }
  return null;
}

/** Parse "-- NNN description" headers embedded by migrate.ts into its own ledger dump. */
export function parseLedgerDump(dump: string): Map<number, string> {
  const ledger = new Map<number, string>();
  const re = /^-- migration (\d+) checksum ([0-9a-f]{64})/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(dump)) !== null) {
    ledger.set(Number(m[1]), m[2]!);
  }
  return ledger;
}
