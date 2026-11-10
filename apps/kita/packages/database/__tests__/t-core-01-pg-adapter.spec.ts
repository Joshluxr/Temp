import { afterEach, describe, expect, it, vi } from "vitest";

const ctorArgs: unknown[] = [];

class StubPool {
  constructor(config: unknown) {
    ctorArgs.push(config);
  }
  async connect() {
    return {
      query: async () => ({ rows: [] }),
      release() {},
    };
  }
  async query() {
    return { rows: [] };
  }
  async end() {}
}

vi.mock("pg", () => ({
  default: { Pool: StubPool },
  Pool: StubPool,
}));

describe("default pg adapter native constructor mapping", () => {
  afterEach(() => {
    ctorArgs.length = 0;
  });

  it("maps normalized timeouts to native pg.Pool options and omits internal names", async () => {
    const { createPool } = await import("../src/pool.js");
    const pool = createPool({
      databaseUrl: "postgres://example.invalid/db",
      poolMax: 7,
      statementTimeoutMs: 111,
      connectionTimeoutMs: 222,
      idleTimeoutMs: 333,
    });
    await pool.query("SELECT 1");
    expect(ctorArgs).toHaveLength(1);
    expect(ctorArgs[0]).toEqual({
      connectionString: "postgres://example.invalid/db",
      max: 7,
      statement_timeout: 111,
      connectionTimeoutMillis: 222,
      idleTimeoutMillis: 333,
    });
    expect(ctorArgs[0] as object).not.toHaveProperty("statementTimeoutMs");
    expect(ctorArgs[0] as object).not.toHaveProperty("connectionTimeoutMs");
    expect(ctorArgs[0] as object).not.toHaveProperty("idleTimeoutMs");
    expect(pool.config).toEqual({
      connectionString: "postgres://example.invalid/db",
      max: 7,
      statementTimeoutMs: 111,
      connectionTimeoutMs: 222,
      idleTimeoutMs: 333,
    });
    await pool.close();
  });

  it("omits unspecified native timeout keys and isolates instances", async () => {
    const { createPool } = await import("../src/pool.js");
    const a = createPool({
      databaseUrl: "postgres://example.invalid/a",
      statementTimeoutMs: 50,
    });
    const b = createPool({
      databaseUrl: "postgres://example.invalid/b",
      connectionTimeoutMs: 80,
    });
    await a.query("SELECT 1");
    await b.query("SELECT 1");
    expect(ctorArgs[0]).toEqual({
      connectionString: "postgres://example.invalid/a",
      statement_timeout: 50,
    });
    expect(ctorArgs[1]).toEqual({
      connectionString: "postgres://example.invalid/b",
      connectionTimeoutMillis: 80,
    });
    expect(ctorArgs[0] as object).not.toHaveProperty("idleTimeoutMillis");
    expect(ctorArgs[1] as object).not.toHaveProperty("statement_timeout");
    await a.close();
    await b.close();
  });
});
