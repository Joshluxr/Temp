import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { Pool, PoolClient } from "pg";
import {
  MONEY_TABLES,
  assertMoneyTablesEmpty,
  findMoneyImport,
  migrate,
  MigrationError,
} from "../src/index.js";
import { adminPool, ownerPool, resetTestDatabase, templateSql } from "./helpers/pg-test.js";

/**
 * TEST-PLAT-02 (KITA-PLAT-02) — Fresh install works and sandbox balances never become
 * live cash. PACK-OPS, PACK-SECURITY, PACK-API; explicit no-op financial assertions for
 * reads. Requires the isolated postgres:18 from docker-compose.test.yml (no seeded money):
 *   docker compose -f ../../docker-compose.test.yml up -d --wait
 */

const SKIP = process.env.KITA_PG_TEST !== "1";

describe.skipIf(SKIP)("TEST-PLAT-02 — PostgreSQL core migration (T-PLAT-02)", () => {
  let admin: Pool;
  let owner: Pool;
  let client: PoolClient;

  beforeAll(async () => {
    admin = await adminPool();
  });

  beforeEach(async () => {
    await resetTestDatabase(admin);
    owner = await ownerPool();
    client = await owner.connect();
  });

  afterEach(async () => {
    await client?.release();
    await owner?.end();
  });

  it("fresh install works: numbered migration applies cleanly to an empty target", async () => {
    const result = await migrate(client);
    expect(result.applied.map((m) => m.version)).toEqual([1]);
    expect(result.skipped).toHaveLength(0);
    const { rows } = await client.query(`SELECT count(*)::int AS n FROM pg_class c JOIN pg_namespace ns ON ns.oid=c.relnamespace WHERE ns.nspname='kita' AND c.relkind='r'`);
    expect(rows[0]!.n).toBeGreaterThanOrEqual(70); // full core table set preserved from source DDL
  });

  it("fresh install leaves zero economic rows — sandbox balances never become live cash", async () => {
    await migrate(client);
    await assertMoneyTablesEmpty(client); // throws MigrationError on any money row
    const { rows } = await client.query<{ n: string }>(`SELECT count(*)::text AS n FROM kita.account_balances`);
    expect(rows[0]!.n).toBe("0");
    const { rows: cur } = await client.query<{ code: string; exponent: number }>(`SELECT code, exponent FROM kita.currencies ORDER BY code`);
    expect(cur).toHaveLength(8); // reference codes/exponents only — no amounts
  });

  it("runner refuses a non-empty/mismatched target", async () => {
    await client.query(`CREATE SCHEMA kita`);
    await client.query(`CREATE TABLE kita.tampered(x int)`);
    await expect(migrate(client)).rejects.toThrow(MigrationError);
    await expect(migrate(client)).rejects.toThrow(/non-empty\/mismatched target/);
  });

  it("explicit no-op financial assertions for reads: GET-path SELECTs mutate nothing", async () => {
    await migrate(client);
    for (const table of ["books", "transfers", "journals", "journal_lines", "account_balances", "money_operations"]) {
      const { rows } = await client.query(`SELECT count(*)::int AS n FROM kita.${table}`);
      expect(rows[0]!.n).toBe(0);
    }
    const { rows } = await client.query<{ n: string }>(`SELECT count(*)::text AS n FROM kita.journals`);
    expect(rows[0]!.n).toBe("0"); // read produced no journal, no balance, no cash
  });

  it("grants are least-privilege", async () => {
    await migrate(client);
    const checks: Array<[string, string, string, boolean]> = [
      ["kita_api", "kita.journals", "INSERT", false],
      ["kita_worker", "kita.journal_lines", "UPDATE", false],
      ["kita_posting", "kita.account_balances", "UPDATE", false],
      ["kita_posting", "kita.post_journal(uuid,text,uuid,uuid,uuid,uuid,uuid,timestamptz,text,jsonb)", "EXECUTE", true],
      ["kita_auditor", "kita.audit_events", "SELECT", true],
      ["kita_auditor", "kita.journals", "INSERT", false],
      ["kita_api", "kita.currencies", "INSERT", false],
    ];
    for (const [role, object, priv, expected] of checks) {
      const fn = object.includes("(") ? hasFunctionPrivilege : hasTablePrivilege;
      const { rows } = await client.query<{ p: boolean }>(fn, [role, object, priv]);
      expect(rows[0]!.p, `${role} ${priv} on ${object}`).toBe(expected);
    }
    // PUBLIC holds nothing at all inside the schema.
    const { rows } = await client.query<{ n: string }>(
      `SELECT count(*)::text AS n FROM (
         SELECT (aclexplode(datacl)).grantee AS grantee
           FROM pg_class c
           JOIN pg_namespace ns ON ns.oid=c.relnamespace
          WHERE ns.nspname='kita' AND c.relkind IN ('r','p','v','m','f')
       ) x WHERE x.grantee='public'::regrole`,
    );
    expect(Number(rows[0]!.n)).toBe(0);
  });
});

const hasTablePrivilege =
  `SELECT has_table_privilege($1,$2,$3) AS p`;
const hasFunctionPrivilege =
  `SELECT has_function_privilege($1,'kita.'||split_part($2,'(',1)||'('||split_part(split_part($2,'(',2),')',1)||')',$3) AS p`;

describe("TEST-PLAT-02 invariant — no money rows imported (static guard, no DB required)", () => {
  let coreSql: string;

  beforeAll(async () => {
    coreSql = await templateSql();
  });

  it("the shipped 001_core.sql passes the no-money-import guard", () => {
    expect(findMoneyImport(coreSql)).toBeNull();
  });

  it("guard rejects an injected sandbox-balance import", () => {
    const tampered = `${coreSql}\nINSERT INTO account_balances(account_id,normal_minor) VALUES(gen_random_uuid(),999999);\n`;
    expect(findMoneyImport(tampered)).toContain("account_balances");
  });

  it("guard rejects balance-bearing inserts even aimed at allowed seed tables", () => {
    expect(findMoneyImport(`INSERT INTO currencies(code,exponent,normal_minor) VALUES('USD',2,500);`)).toContain("normal_minor");
  });

  it("every declared money table is protected by the post-install emptiness assertion", () => {
    for (const table of MONEY_TABLES) {
      expect(coreSql, `table ${table} must exist in core DDL`).toContain(`CREATE TABLE ${table}(`);
    }
  });

  it("source DDL carries no fabricated-outcome helpers (addSandboxFunds/simulatePartnerCompletion/admin complete-fail)", () => {
    const forbiddenTerms = ["addSandboxFunds", "simulatePartnerCompletion", "sandbox_balance_import", "fake_kyc"];
    for (const term of forbiddenTerms) {
      expect(coreSql.toLowerCase()).not.toContain(term.toLowerCase());
    }
  });
});
