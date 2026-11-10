import { createHash, randomBytes } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import pg from "pg";

import { createPool } from "../src/pool.js";
import type { PoolClientLike, PoolLike } from "../src/pool.js";
import { withSerializable } from "../src/transaction.ts";
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
  return `a${randomBytes(12).toString("hex")}`.slice(0, 24);
}

function expectedHash(tag: string): string {
  return `rr1:${createHash("sha256").update(`{"requestTag":"${tag}","schemaVersion":1}`, "utf8").digest("hex")}`;
}

function timedDeferred<T = void>(name: string, ms = 20_000): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (err: unknown) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (err: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  const timer = setTimeout(() => reject(new Error(`timeout:${name}`)), ms);
  return {
    promise,
    resolve: (value) => {
      clearTimeout(timer);
      resolve(value);
    },
    reject: (err) => {
      clearTimeout(timer);
      reject(err);
    },
  };
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
    expect(result.rows.length).toBeLessThanOrEqual(1);
    return result.rows[0];
  } finally {
    await client.end();
  }
}

function expectRow(row: ReservedRow | undefined, bookId: string, actorId: string, key: string, tag: string): ReservedRow {
  if (!row) throw new Error(`missing reserved row for ${key}`);
  expect(row.book_id).toBe(bookId);
  expect(row.actor_id).toBe(actorId);
  expect(row.operation).toBe("recordNonMoneyRefusal.v1");
  expect(row.key).toBe(key);
  expect(row.state).toBe("rejected");
  expect(row.resource_id).toBeNull();
  expect(row.response).toEqual(STORED);
  expect(row.request_hash).toBe(expectedHash(tag));
  expect(row.created_at.length).toBeGreaterThan(0);
  expect(row.id.length).toBeGreaterThan(0);
  return row;
}

async function observeIdentity(client: PoolClientLike, expectedLogin: string): Promise<{ pid: number; start: string }> {
  const ident = await client.query(
    `SELECT session_user AS session_user, current_user AS current_user,
            pg_backend_pid() AS pid,
            current_setting('transaction_isolation') AS isolation,
            current_setting('synchronous_commit') AS synchronous_commit,
            current_setting('session_replication_role') AS replication_role,
            current_setting('statement_timeout') AS statement_timeout,
            (SELECT backend_start::text FROM pg_stat_activity WHERE pid = pg_backend_pid()) AS start`,
  );
  const row = ident.rows[0];
  expect(row?.session_user).toBe(expectedLogin);
  expect(row?.current_user).toBe(expectedLogin);
  expect(row?.isolation).toBe("serializable");
  expect(row?.synchronous_commit).toBe("on");
  expect(row?.replication_role).toBe("origin");
  return { pid: Number(row?.pid), start: String(row?.start) };
}

describe.skipIf(!selected)("non-money refusal atomicity PostgreSQL evidence", () => {
  let fx: RefusalPgFixtures | undefined;
  const pending: Promise<unknown>[] = [];

  beforeAll(async () => {
    requireRefusalOwnerUrl();
    fx = await provisionRefusalFixtures();
  });

  afterAll(async () => {
    await Promise.allSettled(pending);
    await fx?.close();
  });

  it("Atomic refusal rollback on native KRF02", async () => {
    if (!fx) throw new Error("fixtures missing");
    const keyA = freshKey();
    const keyB = freshKey();
    const tagA = "atom-a";
    const tagB = "atom-b";
    const pool = createPool({ databaseUrl: fx.loginA.url, poolMax: 2, statementTimeoutMs: 15_000 });
    const afterA = timedDeferred("afterA");
    const continueB = timedDeferred("continueB");
    try {
      await expect(recordNonMoneyRefusal(pool, { idempotencyKey: keyB, requestTag: tagB })).resolves.toEqual(STORED);
      const rowB = expectRow(
        await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyB),
        fx.bookA,
        fx.loginA.actorId,
        keyB,
        tagB,
      );
      await expect(countReservedRows(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyA)).resolves.toBe(0);
      let requested = 0;
      let acquired = 0;
      const sequence: string[] = [];
      let driverErr: unknown;
      const wrapping: PoolLike = {
        async connect() {
          requested += 1;
          const client = await pool.connect();
          acquired += 1;
          return {
            async query(sql: string, params?: readonly unknown[]) {
              if (sql.startsWith("BEGIN")) {
                const result = await client.query(sql, params);
                sequence.push("begin");
                await observeIdentity(client, fx!.loginA.name);
                return result;
              }
              if (sql.includes("record_non_money_refusal") && !sequence.includes("function-a")) {
                const result = await client.query(sql, params);
                sequence.push("function-a");
                afterA.resolve();
                await continueB.promise;
                return result;
              }
              try {
                const result = await client.query(sql, params);
                if (sql.startsWith("COMMIT")) sequence.push("commit");
                if (sql.startsWith("ROLLBACK")) sequence.push("rollback");
                return result;
              } catch (err) {
                if (sql.includes("record_non_money_refusal")) driverErr = err;
                throw err;
              }
            },
            release(err?: unknown) {
              client.release(err);
              sequence.push("release");
            },
          } satisfies PoolClientLike;
        },
        query: (sql, params) => pool.query(sql, params),
        end: () => pool.end(),
      };
      const running = withSerializable(wrapping, async (client) => {
        await client.query("SELECT kita.record_non_money_refusal($1,$2) AS body", [keyA, tagA]);
        await client.query("SELECT kita.record_non_money_refusal($1,$2) AS body", [keyB, "atom-b-other"]);
        return STORED;
      });
      pending.push(running);
      await afterA.promise;
      await expect(countReservedRows(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyA)).resolves.toBe(0);
      expect(
        expectRow(
          await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyB),
          fx.bookA,
          fx.loginA.actorId,
          keyB,
          tagB,
        ),
      ).toEqual(rowB);
      continueB.resolve();
      let helperErr: unknown;
      try {
        await running;
      } catch (err) {
        helperErr = err;
      }
      expect(helperErr).toBe(driverErr);
      expect((helperErr as { code?: string }).code).toBe("KRF02");
      expect(requested).toBe(1);
      expect(acquired).toBe(1);
      expect(sequence).toEqual(["begin", "function-a", "rollback", "release"]);
      await expect(countReservedRows(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyA)).resolves.toBe(0);
      expect(await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyB)).toEqual(rowB);
      await expect(recordNonMoneyRefusal(pool, { idempotencyKey: keyA, requestTag: tagA })).resolves.toEqual(STORED);
      const rowA = expectRow(
        await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyA),
        fx.bookA,
        fx.loginA.actorId,
        keyA,
        tagA,
      );
      await expect(recordNonMoneyRefusal(pool, { idempotencyKey: keyA, requestTag: tagA })).resolves.toEqual(STORED);
      await expect(recordNonMoneyRefusal(pool, { idempotencyKey: keyA, requestTag: "atom-a-other" })).resolves.toEqual(
        MISMATCH,
      );
      expect(await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyA)).toEqual(rowA);
      expect(await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyB)).toEqual(rowB);
    } finally {
      afterA.reject(new Error("cleanup"));
      continueB.reject(new Error("cleanup"));
      await Promise.allSettled(pending);
      await pool.close();
    }
  });

  it("Native 40P01 rolls back refusal and replays the full callback", async () => {
    if (!fx) throw new Error("fixtures missing");
    const keyA = freshKey();
    const keyB = freshKey();
    const tagA = "dl-a";
    const tagB = "dl-b";
    const lockA = 100000 + (randomBytes(2).readUInt16BE(0) % 50000);
    const lockB = 200000 + (randomBytes(2).readUInt16BE(0) % 50000);
    const holders = await (async () => {
      const client = new pg.Client({
        connectionString: fx!.ownerUrl,
        connectionTimeoutMillis: 10_000,
        statement_timeout: 15_000,
      });
      await client.connect();
      try {
        const result = await client.query(
          `SELECT count(*)::int AS n FROM pg_locks
           WHERE locktype = 'advisory' AND classid = $1 AND objid = 1`,
          [lockA],
        );
        const resultB = await client.query(
          `SELECT count(*)::int AS n FROM pg_locks
           WHERE locktype = 'advisory' AND classid = $1 AND objid = 1`,
          [lockB],
        );
        return Number(result.rows[0]?.n) + Number(resultB.rows[0]?.n);
      } finally {
        await client.end();
      }
    })();
    expect(holders).toBe(0);
    const poolA = createPool({
      databaseUrl: fx.loginA.url,
      poolMax: 1,
      statementTimeoutMs: 20_000,
      connectionTimeoutMs: 10_000,
    });
    const poolB = createPool({
      databaseUrl: fx.loginA.url,
      poolMax: 1,
      statementTimeoutMs: 20_000,
      connectionTimeoutMs: 10_000,
    });
    const firstA = timedDeferred("firstA");
    const firstB = timedDeferred("firstB");
    const goSecond = timedDeferred("goSecond");
    const victimRolledBack = timedDeferred("victimRolledBack");
    const allowSurvivorCommit = timedDeferred("allowSurvivorCommit");
    const allowVictimRetry = timedDeferred("allowVictimRetry");
    const codes: Array<{ side: "A" | "B"; attempt: number; code: string }> = [];
    let acquiredA = 0;
    let acquiredB = 0;
    let gatedA = 0;
    let gatedB = 0;
    const seqA: string[] = [];
    const seqB: string[] = [];
    const backends: Record<string, { pid: number; start: string }> = {};
    let victimSide: "A" | "B" | undefined;

    function wrap(pool: ReturnType<typeof createPool>, side: "A" | "B"): PoolLike {
      const seq = side === "A" ? seqA : seqB;
      return {
        async connect() {
          if (side === "A") gatedA += 1;
          else gatedB += 1;
          const next = side === "A" ? gatedA : gatedB;
          if (next === 2) await allowVictimRetry.promise;
          const client = await pool.connect();
          if (side === "A") acquiredA += 1;
          else acquiredB += 1;
          const attempt = side === "A" ? acquiredA : acquiredB;
          let recorded = false;
          return {
            async query(sql: string, params?: readonly unknown[]) {
              if (sql.startsWith("BEGIN")) {
                const result = await client.query(sql, params);
                seq.push(`begin:${attempt}`);
                const ident = await observeIdentity(client, fx!.loginA.name);
                if (attempt === 1) backends[side] = ident;
                return result;
              }
              try {
                const result = await client.query(sql, params);
                if (sql.startsWith("COMMIT")) seq.push(`commit:${attempt}`);
                if (sql.startsWith("ROLLBACK")) seq.push(`rollback:${attempt}`);
                if (sql.includes("record_non_money_refusal") && attempt === 1 && !recorded) {
                  recorded = true;
                  seq.push(`function:${attempt}`);
                  if (side === "A") firstA.resolve();
                  else firstB.resolve();
                  await goSecond.promise;
                }
                if (sql.includes("pg_advisory_xact_lock") && attempt === 1 && recorded) {
                  seq.push(`lock2:${attempt}`);
                  await victimRolledBack.promise;
                  await allowSurvivorCommit.promise;
                }
                return result;
              } catch (err) {
                const code = (err as { code?: string }).code;
                if (code) codes.push({ side, attempt, code });
                if (code === "40P01" && attempt === 1) victimSide = side;
                throw err;
              }
            },
            release(err?: unknown) {
              client.release(err);
              seq.push(`release:${attempt}`);
              if (attempt === 1 && victimSide === side) victimRolledBack.resolve();
            },
          } satisfies PoolClientLike;
        },
        query: (sql, params) => pool.query(sql, params),
        end: () => pool.end(),
      };
    }

    const runA = withSerializable(wrap(poolA, "A"), async (client) => {
      await client.query("SELECT pg_advisory_xact_lock($1, $2)", [lockA, 1]);
      const body = await client.query("SELECT kita.record_non_money_refusal($1,$2) AS body", [keyA, tagA]);
      await client.query("SELECT pg_advisory_xact_lock($1, $2)", [lockB, 1]);
      return body.rows[0]?.body;
    });
    const runB = withSerializable(wrap(poolB, "B"), async (client) => {
      await client.query("SELECT pg_advisory_xact_lock($1, $2)", [lockB, 1]);
      const body = await client.query("SELECT kita.record_non_money_refusal($1,$2) AS body", [keyB, tagB]);
      await client.query("SELECT pg_advisory_xact_lock($1, $2)", [lockA, 1]);
      return body.rows[0]?.body;
    });
    pending.push(runA, runB);
    const abort = (err: unknown) => {
      firstA.reject(err);
      firstB.reject(err);
      goSecond.reject(err);
      victimRolledBack.reject(err);
      allowSurvivorCommit.reject(err);
      allowVictimRetry.reject(err);
    };
    try {
      await Promise.all([firstA.promise, firstB.promise]);
      await expect(countReservedRows(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyA)).resolves.toBe(0);
      await expect(countReservedRows(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyB)).resolves.toBe(0);
      goSecond.resolve();
      const deadline = Date.now() + 15_000;
      while (!codes.some((c) => c.code === "40P01") && Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 25));
      }
      expect(codes.some((c) => c.code === "40P01" && c.attempt === 1)).toBe(true);
      expect(victimSide === "A" || victimSide === "B").toBe(true);
      await victimRolledBack.promise;
      await expect(countReservedRows(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyA)).resolves.toBe(0);
      await expect(countReservedRows(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyB)).resolves.toBe(0);
      const victimBackend = backends[victimSide!];
      expect(victimBackend?.pid).toBeGreaterThan(0);
      const lockClient = new pg.Client({
        connectionString: fx.ownerUrl,
        connectionTimeoutMillis: 10_000,
        statement_timeout: 15_000,
      });
      await lockClient.connect();
      try {
        const leftover = await lockClient.query(
          `SELECT count(*)::int AS n
           FROM pg_locks l
           JOIN pg_stat_activity a ON a.pid = l.pid
           WHERE l.locktype = 'advisory'
             AND a.pid = $1
             AND a.backend_start::text = $2`,
          [victimBackend.pid, victimBackend.start],
        );
        expect(Number(leftover.rows[0]?.n)).toBe(0);
      } finally {
        await lockClient.end();
      }
      allowSurvivorCommit.resolve();
      const settled = await Promise.race([
        runA.then((body) => ({ side: "A" as const, body })),
        runB.then((body) => ({ side: "B" as const, body })),
      ]);
      expect(settled.body).toEqual(STORED);
      const survivorKey = settled.side === "A" ? keyA : keyB;
      const victimKey = settled.side === "A" ? keyB : keyA;
      await expect(countReservedRows(fx.ownerUrl, fx.bookA, fx.loginA.actorId, survivorKey)).resolves.toBe(1);
      await expect(countReservedRows(fx.ownerUrl, fx.bookA, fx.loginA.actorId, victimKey)).resolves.toBe(0);
      allowVictimRetry.resolve();
      await expect(runA).resolves.toEqual(STORED);
      await expect(runB).resolves.toEqual(STORED);
      expect(acquiredA + acquiredB).toBe(3);
      expect(Math.max(acquiredA, acquiredB)).toBe(2);
      expect(Math.min(acquiredA, acquiredB)).toBe(1);
      expect(codes.filter((c) => c.code === "40P01")).toHaveLength(1);
      const rowA = expectRow(
        await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyA),
        fx.bookA,
        fx.loginA.actorId,
        keyA,
        tagA,
      );
      const rowB = expectRow(
        await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyB),
        fx.bookA,
        fx.loginA.actorId,
        keyB,
        tagB,
      );
      const replay = createPool({ databaseUrl: fx.loginA.url, poolMax: 2, statementTimeoutMs: 15_000 });
      try {
        await expect(recordNonMoneyRefusal(replay, { idempotencyKey: keyA, requestTag: tagA })).resolves.toEqual(STORED);
        await expect(recordNonMoneyRefusal(replay, { idempotencyKey: keyA, requestTag: "dl-a-x" })).resolves.toEqual(
          MISMATCH,
        );
        await expect(recordNonMoneyRefusal(replay, { idempotencyKey: keyB, requestTag: tagB })).resolves.toEqual(STORED);
        await expect(recordNonMoneyRefusal(replay, { idempotencyKey: keyB, requestTag: "dl-b-x" })).resolves.toEqual(
          MISMATCH,
        );
      } finally {
        await replay.close();
      }
      expect(await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyA)).toEqual(rowA);
      expect(await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyB)).toEqual(rowB);
      expect(seqA.join(",")).toMatch(/begin:1/);
      expect(seqB.join(",")).toMatch(/begin:1/);
      expect(seqA.join(",") + seqB.join(",")).toMatch(/rollback:1/);
      expect(seqA.join(",") + seqB.join(",")).toMatch(/release:1/);
      expect(seqA.join(",") + seqB.join(",")).toMatch(/commit:1/);
    } catch (err) {
      abort(err);
      throw err;
    } finally {
      abort(new Error("cleanup"));
      await Promise.allSettled([runA, runB]);
      const closes = await Promise.allSettled([poolA.close(), poolB.close()]);
      const failed = closes.find((result): result is PromiseRejectedResult => result.status === "rejected");
      if (failed) throw failed.reason;
    }
  });
});
