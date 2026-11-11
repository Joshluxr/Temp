import { createHash, randomBytes } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import pg from "pg";

import { createPool } from "../src/pool.js";
import { recordNonMoneyRefusal } from "../src/non-money-refusal-store.ts";
import {
  countReservedRows,
  postgresSuiteSelected,
  provisionRefusalFixtures,
  requireRefusalOwnerUrl,
  type RefusalPgFixtures,
} from "./helpers/non-money-refusal-pg.ts";

const selected = postgresSuiteSelected();
const STORED = {
  ok: false as const,
  error: {
    code: "CAPABILITY_UNAVAILABLE",
    status: 503,
    retryable: false,
    detail: "Command execution is unavailable.",
  },
};
const MISMATCH = {
  ok: false as const,
  error: {
    code: "IDEMPOTENCY_MISMATCH",
    status: 409,
    retryable: false,
    detail: "Idempotency key is bound to a different request.",
  },
};
const UNCONFIRMED = {
  ok: false as const,
  error: {
    code: "dependency_unavailable",
    status: 503,
    retryable: true,
    detail: "Refusal persistence is unconfirmed; retry the same key.",
  },
};

type ReservedRow = {
  id: string;
  book_id: string;
  actor_id: string;
  operation: string;
  key: string;
  request_hash: string;
  state: string;
  resource_id: string | null;
  response: unknown;
  created_at: string;
};

function freshKey(): string {
  return `t${randomBytes(12).toString("hex")}`.slice(0, 24);
}

function expectedHash(tag: string): string {
  return `rr1:${createHash("sha256").update(`{"requestTag":"${tag}","schemaVersion":1}`, "utf8").digest("hex")}`;
}

async function fetchReservedRow(
  ownerUrl: string,
  bookId: string,
  actorId: string,
  key: string,
): Promise<ReservedRow | undefined> {
  const client = new pg.Client({
    connectionString: ownerUrl,
    connectionTimeoutMillis: 10_000,
    statement_timeout: 15_000,
  });
  await client.connect();
  try {
    const result = await client.query<ReservedRow>(
      `SELECT id::text, book_id::text, actor_id, operation, key, request_hash, state,
              resource_id::text, response, created_at::text
       FROM kita.command_keys
       WHERE book_id = $1 AND actor_id = $2 AND operation = 'recordNonMoneyRefusal.v1' AND key = $3`,
      [bookId, actorId, key],
    );
    return result.rows[0];
  } finally {
    await client.end();
  }
}

describe.skipIf(!selected)("non-money refusal native pool timeout PostgreSQL evidence", () => {
  let fx: RefusalPgFixtures;

  beforeAll(async () => {
    requireRefusalOwnerUrl();
    fx = await provisionRefusalFixtures();
  });

  afterAll(async () => {
    await fx.close();
  });

  it("Native options and committed persistence", async () => {
    const poolA = createPool({
      databaseUrl: fx.loginA.url,
      poolMax: 2,
      statementTimeoutMs: 5000,
      connectionTimeoutMs: 4000,
      idleTimeoutMs: 30000,
    });
    const poolB = createPool({
      databaseUrl: fx.loginB.url,
      poolMax: 2,
      statementTimeoutMs: 8000,
      connectionTimeoutMs: 4000,
      idleTimeoutMs: 30000,
    });
    try {
      const ca = await poolA.connect();
      try {
        const setting = await ca.query("SELECT current_setting('statement_timeout') AS t");
        expect(String(setting.rows[0]?.t)).toMatch(/5000|5s|5 min/i);
        const sync = await ca.query("SELECT current_setting('synchronous_commit') AS s");
        expect(sync.rows[0]?.s).toBe("on");
      } finally {
        ca.release();
      }
      const cb = await poolB.connect();
      try {
        const setting = await cb.query("SELECT current_setting('statement_timeout') AS t");
        expect(String(setting.rows[0]?.t)).toMatch(/8000|8s/i);
      } finally {
        cb.release();
      }
      const keyA = freshKey();
      await expect(recordNonMoneyRefusal(poolA, { idempotencyKey: keyA, requestTag: "to-a" })).resolves.toEqual(
        STORED,
      );
      const row = await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyA);
      if (!row) throw new Error("missing row");
      expect(row.request_hash).toBe(expectedHash("to-a"));
      await expect(recordNonMoneyRefusal(poolA, { idempotencyKey: keyA, requestTag: "to-a" })).resolves.toEqual(
        STORED,
      );
      await expect(recordNonMoneyRefusal(poolA, { idempotencyKey: keyA, requestTag: "to-other" })).resolves.toEqual(
        MISMATCH,
      );
      expect(await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyA)).toEqual(row);
      await poolA.close();
      const keyB = freshKey();
      await expect(recordNonMoneyRefusal(poolB, { idempotencyKey: keyB, requestTag: "to-b" })).resolves.toEqual(
        STORED,
      );
      await expect(countReservedRows(fx.ownerUrl, fx.bookA, fx.loginB.actorId, keyB)).resolves.toBe(1);
    } finally {
      await poolB.close();
    }
  });

  it("Native statement cancellation and recovery", async () => {
    const key = freshKey();
    const tag = "to-cancel";
    const blocker = new pg.Client({
      connectionString: fx.loginA.url,
      connectionTimeoutMillis: 10_000,
      statement_timeout: 30_000,
    });
    await blocker.connect();
    const pool = createPool({
      databaseUrl: fx.loginA.url,
      poolMax: 2,
      statementTimeoutMs: 500,
    });
    try {
      await blocker.query("BEGIN ISOLATION LEVEL READ COMMITTED");
      await blocker.query("SELECT kita.record_non_money_refusal($1,$2)", [key, tag]);
      let attempts = 0;
      let firstCode: string | undefined;
      const observed = {
        async connect() {
          attempts += 1;
          const client = await pool.connect();
          return {
            async query(sql: string, params?: readonly unknown[]) {
              try {
                return await client.query(sql, params);
              } catch (err) {
                if (firstCode === undefined) firstCode = (err as { code?: string }).code;
                throw err;
              }
            },
            release(err?: unknown) {
              client.release(err);
            },
          };
        },
        query: (sql: string, params?: readonly unknown[]) => pool.query(sql, params),
        end: () => pool.end(),
      };
      const result = await recordNonMoneyRefusal(observed, { idempotencyKey: key, requestTag: tag });
      expect(result).toEqual(UNCONFIRMED);
      expect(attempts).toBe(1);
      expect(firstCode).toBe("57014");
    } finally {
      try {
        await blocker.query("ROLLBACK");
      } catch {
        /* ignore */
      }
      await blocker.end();
      await pool.close();
    }
    await expect(countReservedRows(fx.ownerUrl, fx.bookA, fx.loginA.actorId, key)).resolves.toBe(0);
    const recover = createPool({ databaseUrl: fx.loginA.url, poolMax: 2, statementTimeoutMs: 5000 });
    try {
      await expect(recordNonMoneyRefusal(recover, { idempotencyKey: key, requestTag: tag })).resolves.toEqual(STORED);
      const row = await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, key);
      if (!row) throw new Error("missing recovery row");
      expect(row.request_hash).toBe(expectedHash(tag));
      await expect(recordNonMoneyRefusal(recover, { idempotencyKey: key, requestTag: tag })).resolves.toEqual(STORED);
      expect(await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, key)).toEqual(row);
    } finally {
      await recover.close();
    }
  });

  it("Native bounded acquisition", async () => {
    const pool = createPool({
      databaseUrl: fx.loginA.url,
      poolMax: 1,
      connectionTimeoutMs: 250,
    });
    const held = await pool.connect();
    try {
      const started = Date.now();
      await expect(pool.connect()).rejects.toMatchObject({ message: expect.stringMatching(/timeout|Timeout/i) });
      expect(Date.now() - started).toBeLessThan(5_000);
    } finally {
      held.release();
    }
    const key = freshKey();
    try {
      await expect(recordNonMoneyRefusal(pool, { idempotencyKey: key, requestTag: "to-acq" })).resolves.toEqual(
        STORED,
      );
      await expect(countReservedRows(fx.ownerUrl, fx.bookA, fx.loginA.actorId, key)).resolves.toBe(1);
    } finally {
      await pool.close();
    }
  });

  it("Native idle removal and replay", async () => {
    const pool = createPool({
      databaseUrl: fx.loginA.url,
      poolMax: 1,
      idleTimeoutMs: 400,
      statementTimeoutMs: 5000,
    });
    const observer = createPool({
      databaseUrl: fx.loginA.url,
      poolMax: 1,
      statementTimeoutMs: 5000,
    });
    const key = freshKey();
    const tag = "to-idle";
    try {
      const writer = await pool.connect();
      let pid: number;
      let backendStart: string;
      try {
        const ident = await writer.query(
          "SELECT pg_backend_pid() AS pid, (SELECT backend_start::text FROM pg_stat_activity WHERE pid = pg_backend_pid()) AS start",
        );
        pid = Number(ident.rows[0]?.pid);
        backendStart = String(ident.rows[0]?.start);
        writer.release();
      } catch (err) {
        writer.release(err);
        throw err;
      }
      await expect(recordNonMoneyRefusal(pool, { idempotencyKey: key, requestTag: tag })).resolves.toEqual(STORED);
      const row = await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, key);
      if (!row) throw new Error("missing idle baseline");
      const hold = await pool.connect();
      const holdPid = await hold.query("SELECT pg_backend_pid() AS pid");
      const livePid = Number(holdPid.rows[0]?.pid);
      const seen = await observer.query("SELECT count(*)::int AS n FROM pg_stat_activity WHERE pid = $1", [livePid]);
      expect(Number(seen.rows[0]?.n)).toBe(1);
      hold.release();
      const deadline = Date.now() + 8_000;
      let gone = false;
      while (Date.now() < deadline) {
        const check = await observer.query("SELECT count(*)::int AS n FROM pg_stat_activity WHERE pid = $1", [
          livePid,
        ]);
        if (Number(check.rows[0]?.n) === 0) {
          gone = true;
          break;
        }
        await new Promise((r) => setTimeout(r, 50));
      }
      expect(gone).toBe(true);
      expect(pid).toBeGreaterThan(0);
      expect(backendStart.length).toBeGreaterThan(0);
      await expect(recordNonMoneyRefusal(pool, { idempotencyKey: key, requestTag: tag })).resolves.toEqual(STORED);
      await expect(recordNonMoneyRefusal(pool, { idempotencyKey: key, requestTag: "to-idle-other" })).resolves.toEqual(
        MISMATCH,
      );
      expect(await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, key)).toEqual(row);
    } finally {
      await pool.close();
      await observer.close();
    }
  });
});
