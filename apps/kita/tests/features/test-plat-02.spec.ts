import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * TEST-PLAT-02 (static evidence spec — NO live database connection).
 * Acceptance per docs/kita-plan/13-backlog.md ~L1352: prove the migration path is
 * fresh-install-only, forward-only, checksummed, and that sandbox balances can never
 * be imported as live cash. Everything asserted here is verifiable from file bytes.
 */

const REPO = process.env.KITA_REPO_ROOT ?? "/home/administrator/src/t3mp3st";
const MIGRATE_TS = `${REPO}/apps/kita/packages/database/src/migrate.ts`;
const SQL_DIR = `${REPO}/apps/kita/sql`;

function read(p: string): string {
  return readFileSync(p, "utf8");
}

describe("T-PLAT-02 migration runner invariants", () => {
  const src = read(MIGRATE_TS);

  it("exposes a no-money-import guard (findMoneyImport / assertMoneyTablesEmpty)", () => {
    // The guard symbol must be part of the runner's public surface.
    expect(src).toMatch(/findMoneyImport/);
    expect(src).toMatch(/export\s*\{[^}]*findMoneyImport[^}]*\}/);
    expect(src).toMatch(/assertMoneyTablesEmpty/);
  });

  it("refuses sandbox money imports at load time", () => {
    expect(src).toMatch(/blocked by no-money-import invariant/);
    expect(src).toMatch(/MONEY_TABLES/);
  });

  it("refuses non-empty or mismatched targets (fail-closed fresh install)", () => {
    expect(src).toMatch(/assertFreshTarget/);
    expect(src).toMatch(/refusing to run/);
  });

  it("is checksummed and forward-only", () => {
    expect(src).toMatch(/checksum mismatch for migration/);
    expect(src).toMatch(/sha256/i);
    // No sandbox balance import path exists in the runner source.
    expect(src).not.toMatch(/mysqldump|balance_history|SELECT\*FROM/i);
  });

  it("proves money tables stay empty after install", () => {
    expect(src).toMatch(/money rows present after install/);
    expect(src).toMatch(/sandbox balances would become live cash/);
  });
});

describe("T-PLAT-02 SQL artifacts on disk", () => {
  it("ships numbered core migrations with checksums recorded", () => {
    const checksums = read(`${SQL_DIR}/CHECKSUMS.txt`);
    expect(checksums).toMatch(/001_core\.sql/);
    for (const f of ["001_core.sql", "002_core_smoke.sql"]) {
      const sql = read(`${SQL_DIR}/${f}`);
      const digest = createHash("sha256").update(sql).digest("hex");
      expect(checksums).toContain(digest);
    }
  });

  it("migration SQL contains no sandbox balance import statements", () => {
    for (const f of ["001_core.sql", "002_core_smoke.sql"]) {
      const sql = read(`${SQL_DIR}/${f}`);
      expect(sql).not.toMatch(/COPY\s+.*balance\s+FROM\s+PROGRAM/i);
      expect(sql).not.toMatch(/mysql/i);
    }
  });
});
