import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { PoolClient } from "pg";
import { MONEY_TABLES, sha256Hex } from "./invariant.js";
// The no-money-import guard is defined once in invariant.ts; re-exported here so the
// runner's public surface carries it without a duplicate implementation to drift.
import { findMoneyImport } from "./invariant.js";

export { findMoneyImport };

/**
 * T-PLAT-02 migration runner. Applies numbered migrations in order to a target that is
 * provably empty (or already at the recorded checksum), records checksums, and refuses
 * anything else. There is NO code path here that reads or imports sandbox balance data;
 * post-install assertions prove money tables stayed empty.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
export const MIGRATIONS_DIR = join(HERE, "..", "migrations");
export const LEDGER_PATH = join(MIGRATIONS_DIR, ".applied.json");

export interface Migration {
  readonly version: number;
  readonly filepath: string;
  readonly sql: string;
  readonly checksum: string;
}

export class MigrationError extends Error {}

const fileNameRe = /^(\d{3,})_[a-z0-9_]+\.sql$/;

export async function loadMigrations(dir: string = MIGRATIONS_DIR): Promise<Migration[]> {
  const entries = await readdir(dir);
  const migrations: Migration[] = [];
  for (const name of entries) {
    if (name.startsWith(".")) continue;
    const m = fileNameRe.exec(name);
    if (m === null) {
      if (name.endsWith(".sql")) throw new MigrationError(`non-numbered migration file ${name}; expand sequence requires NNN_name.sql`);
      continue;
    }
    const filepath = join(dir, name);
    const sql = await readFile(filepath, "utf8");
    const violation = findMoneyImport(sql);
    if (violation !== null) throw new MigrationError(`${name} blocked by no-money-import invariant (${violation})`);
    migrations.push({ version: Number(m[1]), filepath, sql, checksum: sha256Hex(sql) });
  }
  migrations.sort((a, b) => a.version - b.version);
  const seen = new Set<number>();
  for (const mig of migrations) {
    if (seen.has(mig.version)) throw new MigrationError(`duplicate migration version ${mig.version}`);
    seen.add(mig.version);
  }
  return migrations;
}

type Ledger = Record<string, { checksum: string; appliedAt: string }>;

async function readLedger(): Promise<Ledger> {
  try {
    return JSON.parse(await readFile(LEDGER_PATH, "utf8")) as Ledger;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw new MigrationError(`unreadable migration ledger ${LEDGER_PATH}: ${(err as Error).message}`);
  }
}

async function writeLedger(ledger: Ledger): Promise<void> {
  await mkdir(dirname(LEDGER_PATH), { recursive: true });
  await writeFile(LEDGER_PATH, JSON.stringify(ledger, null, 2) + "\n", "utf8");
}

/** Refuse to run against a non-empty/mismatched target. */
async function assertFreshTarget(client: PoolClient, fullyApplied: boolean): Promise<void> {
  const { rows } = await client.query<{ n: string }>(
    `SELECT count(*)::text AS n FROM pg_class c JOIN pg_namespace ns ON ns.oid=c.relnamespace
      WHERE ns.nspname='kita' AND c.relkind IN ('r','p','v','m','f')`,
  );
  const existing = Number(rows[0]?.n ?? 0);
  if (existing > 0 && !fullyApplied) {
    throw new MigrationError(
      `refusing to run: target has ${existing} pre-existing kita relations without a complete recorded install (non-empty/mismatched target)`,
    );
  }
}

/** Post-install proof: every economic table is exactly empty; only reference/config rows exist. */
export async function assertMoneyTablesEmpty(client: PoolClient): Promise<void> {
  const cases = MONEY_TABLES.map((t) => `SELECT '${t}' AS tbl, count(*)::text AS n FROM kita.${t}`).join(" UNION ALL ");
  const { rows } = await client.query<{ tbl: string; n: string }>(cases);
  const nonEmpty = rows.filter((r) => BigInt(r.n) !== 0n);
  if (nonEmpty.length > 0) {
    throw new MigrationError(
      `invariant violated — money rows present after install (sandbox balances would become live cash): ${nonEmpty.map((r) => `${r.tbl}=${r.n}`).join(", ")}`,
    );
  }
}

export interface MigrateResult {
  readonly applied: ReadonlyArray<{ version: number; checksum: string }>;
  readonly skipped: ReadonlyArray<number>;
}

export async function migrate(client: PoolClient): Promise<MigrateResult> {
  const migrations = await loadMigrations();
  const ledger = await readLedger();
  for (const mig of migrations) {
    const record = ledger[String(mig.version)];
    if (record !== undefined && record.checksum !== mig.checksum) {
      throw new MigrationError(`checksum mismatch for migration ${mig.version}: recorded ${record.checksum}, file ${mig.checksum} (refusing)`);
    }
  }
  const fullyApplied = migrations.length > 0 && migrations.every((mig) => ledger[String(mig.version)] !== undefined);
  await assertFreshTarget(client, fullyApplied);

  const applied: Array<{ version: number; checksum: string }> = [];
  const skipped: number[] = [];
  for (const mig of migrations) {
    if (ledger[String(mig.version)] !== undefined) {
      skipped.push(mig.version);
      continue;
    }
    // Each numbered migration is self-contained and transactional; one failure aborts everything.
    await client.query(mig.sql);
    applied.push({ version: mig.version, checksum: mig.checksum });
    ledger[String(mig.version)] = { checksum: mig.checksum, appliedAt: new Date().toISOString() };
    await writeLedger(ledger);
  }

  await assertMoneyTablesEmpty(client);
  return { applied, skipped };
}

/** Deterministic checksum helper for CI drift checks against the reviewed source DDL. */
export const checksumOf = (sql: string): string => createHash("sha256").update(sql).digest("hex");
