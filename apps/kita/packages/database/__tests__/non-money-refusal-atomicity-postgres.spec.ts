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

function deferred<T = void>(): { promise: Promise<T>; resolve: (value: T) => void; reject: (err: unknown) => void } {
  let resolve!: (value: T) => void;
  let reject!: (err: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
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

describe.skipIf(!selected)("non-money refusal atomicity PostgreSQL evidence", () => {
  let fx: RefusalPgFixtures;

  beforeAll(async () => {
    requireRefusalOwnerUrl();
    fx = await provisionRefusalFixtures();
  });

  afterAll(async () => {
    await fx.close();
  });

  it("Atomic refusal rollback on native KRF02", async () => {
    const keyA = freshKey();
    const keyB = freshKey();
    const tagA = "atom-a";
    const tagB = "atom-b";
    const pool = createPool({ databaseUrl: fx.loginA.url, poolMax: 2, statementTimeoutMs: 15_000 });
    try {
      await expect(recordNonMoneyRefusal(pool, { idempotencyKey: keyB, requestTag: tagB })).resolves.toEqual(STORED);
      const rowB = await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyB);
      if (!rowB) throw new Error("missing committed B");
      await expect(countReservedRows(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyA)).resolves.toBe(0);
      let attempts = 0;
      let krf: unknown;
      const afterA = deferred();
      const continueB = deferred();
      const wrapping: PoolLike = {
        async connect() {
          attempts += 1;
          const client = await pool.connect();
          let sawA = false;
          return {
            async query(sql: string, params?: readonly unknown[]) {
              const result = await client.query(sql, params);
              if (sql.includes("record_non_money_refusal") && !sawA) {
                sawA = true;
                afterA.resolve();
                await continueB.promise;
              }
              return result;
            },
            release(err?: unknown) {
              client.release(err);
            },
          } satisfies PoolClientLike;
        },
        query: (sql, params) => pool.query(sql, params),
        end: () => pool.end(),
      };
      const running = withSerializable(wrapping, async (client) => {
        await client.query("SELECT kita.record_non_money_refusal($1,$2) AS body", [keyA, tagA]);
        try {
          await client.query("SELECT kita.record_non_money_refusal($1,$2) AS body", [keyB, "atom-b-other"]);
        } catch (err) {
          krf = err;
          throw err;
        }
        return STORED;
      });
      await afterA.promise;
      await expect(countReservedRows(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyA)).resolves.toBe(0);
      expect(await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyB)).toEqual(rowB);
      continueB.resolve();
      await expect(running).rejects.toMatchObject({ code: "KRF02" });
      expect((krf as { code?: string }).code).toBe("KRF02");
      expect(krf).toBe((await Promise.resolve(krf)) as unknown);
      expect(attempts).toBe(1);
      await expect(countReservedRows(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyA)).resolves.toBe(0);
      expect(await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyB)).toEqual(rowB);
      await expect(recordNonMoneyRefusal(pool, { idempotencyKey: keyA, requestTag: tagA })).resolves.toEqual(STORED);
      const rowA = await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyA);
      if (!rowA) throw new Error("missing recovered A");
      expect(rowA.request_hash).toBe(expectedHash(tagA));
      await expect(recordNonMoneyRefusal(pool, { idempotencyKey: keyA, requestTag: tagA })).resolves.toEqual(STORED);
      await expect(recordNonMoneyRefusal(pool, { idempotencyKey: keyA, requestTag: "atom-a-other" })).resolves.toEqual(
        MISMATCH,
      );
      expect(await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyA)).toEqual(rowA);
      expect(await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyB)).toEqual(rowB);
    } finally {
      await pool.close();
    }
  });

  it("Native 40P01 rolls back refusal and replays the full callback", async () => {
    const keyA = freshKey();
    const keyB = freshKey();
    const tagA = "dl-a";
    const tagB = "dl-b";
    const lockA = 100000 + (randomBytes(2).readUInt16BE(0) % 50000);
    const lockB = 200000 + (randomBytes(2).readUInt16BE(0) % 50000);
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
    const firstA = deferred();
    const firstB = deferred();
    const goSecond = deferred();
    const survivorHeld = deferred();
    const allowSurvivorCommit = deferred();
    const allowVictimRetry = deferred();
    const codes: string[] = [];
    let attemptsA = 0;
    let attemptsB = 0;

    function wrap(pool: ReturnType<typeof createPool>, side: "A" | "B"): PoolLike {
      return {
        async connect() {
          if (side === "A") attemptsA += 1;
          else attemptsB += 1;
          const attempt = side === "A" ? attemptsA : attemptsB;
          if (attempt === 2) await allowVictimRetry.promise;
          const client = await pool.connect();
          let recorded = false;
          let secondLock = false;
          return {
            async query(sql: string, params?: readonly unknown[]) {
              try {
                const result = await client.query(sql, params);
                if (sql.includes("record_non_money_refusal") && attempt === 1 && !recorded) {
                  recorded = true;
                  if (side === "A") firstA.resolve();
                  else firstB.resolve();
                  await goSecond.promise;
                }
                if (sql.includes("pg_advisory_xact_lock") && attempt === 1 && recorded && !secondLock) {
                  secondLock = true;
                  survivorHeld.resolve();
                  await allowSurvivorCommit.promise;
                }
                return result;
              } catch (err) {
                const code = (err as { code?: string }).code;
                if (code) codes.push(code);
                throw err;
              }
            },
            release(err?: unknown) {
              client.release(err);
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

    try {
      await Promise.all([firstA.promise, firstB.promise]);
      await expect(countReservedRows(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyA)).resolves.toBe(0);
      await expect(countReservedRows(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyB)).resolves.toBe(0);
      goSecond.resolve();
      const deadlockDeadline = Date.now() + 15_000;
      while (!codes.includes("40P01") && Date.now() < deadlockDeadline) {
        await new Promise((r) => setTimeout(r, 25));
      }
      expect(codes).toContain("40P01");
      await survivorHeld.promise;
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
      expect(attemptsA + attemptsB).toBe(3);
      expect(Math.max(attemptsA, attemptsB)).toBe(2);
      expect(Math.min(attemptsA, attemptsB)).toBe(1);
      expect(codes.filter((c) => c === "40P01")).toHaveLength(1);
      const rowA = await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyA);
      const rowB = await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyB);
      if (!rowA || !rowB) throw new Error("missing deadlock recovery rows");
      expect(rowA.request_hash).toBe(expectedHash(tagA));
      expect(rowB.request_hash).toBe(expectedHash(tagB));
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
    } finally {
      firstA.resolve();
      firstB.resolve();
      goSecond.resolve();
      survivorHeld.resolve();
      allowSurvivorCommit.resolve();
      allowVictimRetry.resolve();
      await poolA.close();
      await poolB.close();
    }
  });
});
