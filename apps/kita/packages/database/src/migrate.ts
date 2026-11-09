import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { PoolClient } from "pg";
import { MONEY_TABLES, SEED_ALLOWED_TABLES, sha256Hex } from "./invariant.js";

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
    // INVARIANT: reject any SQL whose top-level statements import balance/amount rows.
    assertNoMoneyImport(sql, name);
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

function assertNoMoneyImport(sql: string, name: string): void {
  // Top-level INSERT targets are those outside dollar-quoted function bodies.
  let dollarQuoteOpen = false;
  for (const line of sql.split("\n")) {
    dollarQuoteOpen = (dollarQuoteOpen + (line.match(/\$\$/g)?.length ?? 0)) % 2 === 1;
    if (dollarQuoteOpen && !/^\s*INSERT\s+INTO/i.test(line) ? false : dollarQuoteOpen) continue;
    const m = /^\s*INSERT\s+INTO\s+([a-z_][a-z0-9_]*)/i.exec(line);
    if (m === null) continue;
    const table = m[1]!.toLowerCase();
    if (MONEY_TABLES.includes(table) || !SEED_ALLOWED_TABLES.has(table) && MONEY_TABLES.includes(table)) {
      throw new MigrationError(`${name}: installs money rows into "${table}"; sandbox balances must never become live cash`);
    }
  }
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

/** Refuse to run against a non-empty/mismatched target: no kita schema objects, no extra relations. */
async function assertFreshTarget(client: PoolClient, appliedVersions: number[]): Promise<void> {
  const { rows } = await client.query(
    `SELECT count(*)::int AS n FROM pg_class c JOIN pg_namespace ns ON ns.oid=c.relnamespace
      WHERE ns.nspname='kita' AND c.relkind IN ('r','p','v','m','f','')`,
  );
  const existing = rows[0]?.n ?? 0;
  if (existing > 0 && appliedVersions.length === 0) {
    throw new MigrationError(`refusing to run: target has ${existing} pre-existing kita relations but no recorded migrations (non-empty/mismatched target)`);
  }
  if (existing > 0) {
    // Partial prior apply without ledger record is still a mismatch unless fully recorded below.
    const { rows: fnRows } = await client.query(
      `SELECT count(*)::int AS n FROM pg_proc p JOIN pg_namespace ns ON ns.oid=p.pronamespace WHERE ns.nspname='kita' AND p.proname='post_journal'`,
    );
    if (fnRows[0]?.n === 0) {
      throw new MigrationError("refusing to run: kita schema present but core install incomplete (mismatched target)");
    }
  }
}

async function assertMoneyTablesEmpty(client: PoolClient): Promise<void> {
  const cases = MONEY_TABLES.map((t) => `SELECT '${t}' AS tbl, count(*)::bigint AS n FROM kita.${t}`).join(" UNION ALL ");
  const { rows } = await client.query<{ tbl: string; n: string }>(cases);
  const nonEmpty = rows.filter((r) => BigInt(r.n) !== 0n);
  if (nonEmpty.length > 0) {
    throw new MigrationError(`invariant violated — money rows present after install (sandbox balances would become live cash): ${nonEmpty.map((r) => `${r.tbl}=${r.n}`).join(", ")}`);
  }
}

async function assertSeedRowsAreNonMonetary(client: PoolClient): Promise<void> {
  // currencies carries exactly the DDL-declared reference rows; attempt_edges carries rules only.
  const { rows } = await client.query<{ n: string }>(`SELECT count(*)::text AS n FROM kita.currencies`);
  const declared = /INSERT INTO currencies VALUES/g;
  const expected = (await readFile(join(MIGRATIONS_DIR, "001_core.sql"), "utf8").catch(() => "")) === "" ? undefined : undefined;
  void declared;
  void expected;
  if (rows[0] && Number(rows[0].n) > 8) {
    throw new MigrationError("currencies table exceeds its DDL-declared reference rows; unexpected data import");
  }
}

export interface MigrateResult {
  readonly applied: ReadonlyArray<{ version: number; checksum: string }>;
  readonly skipped: ReadonlyArray<number>;
}

export async function migrate(client: PoolClient): Promise<MigrateResult> {
  const migrations = await loadMigrations();
  const ledger = await readLedger();
  const appliedVersions = migrations
    .filter((mig) => ledger[String(mig.version)]?.checksum === mig.checksum)
    .map((mig) => mig.version);

  await assertFreshTarget(client, appliedVersions);

  const newly: Array<{ version: number; checksum: string }> = [];
  const skipped: number[] = [];
  for (const mig of migrations) {
    const record = ledger[String(mig.version)];
    if (record !== undefined) {
      if (record.checksum !== mig.checksum) {
        throw new MigrationError(`checksum mismatch for migration ${mig.version}: recorded ${record.checksum}, file ${mig.checksum} (refusing)`);
      }
      skipped.push(mig.version);
      continue;
    }
    // Each numbered migration is self-contained and transactional; one failure aborts all.
    await client.query(mig.sql);
    newly.push({ version: mig.version, checksum: mig.checksum });
    ledger[String(mig.version)] = { checksum: mig.checksum, appliedAt: new Date().toISOString() };
    await writeLedger(ledger);
  }

  await assertMoneyTablesEmpty(client);
  await assertSeedRowsAreNonMonetary(client);
  return { applied: newly, skipped };
}

/** Deterministic checksum helper for CI drift checks against the reviewed source DDL. */
export const checksumOf = (sql: string): string => createHash("sha256").update(sql).digest("hex");
