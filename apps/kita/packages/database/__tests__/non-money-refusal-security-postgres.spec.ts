import { createHash, randomBytes } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import pg from "pg";

import { recordNonMoneyRefusal } from "../src/non-money-refusal-store.ts";
import type { PoolLike } from "../src/pool.js";
import {
  assertRefusalSecurityPreflight,
  countReservedRows,
  ownerClient,
  postgresSuiteSelected,
  provisionRefusalFixtures,
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
const UNAUTHORIZED = {
  ok: false as const,
  error: {
    code: "unauthorized",
    status: 403,
    retryable: false,
    detail: "Refusal-record scope is unavailable.",
  },
};
const INVALID = {
  ok: false as const,
  error: {
    code: "invalid_request",
    status: 400,
    retryable: false,
    detail: "Invalid refusal-record request.",
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
  return `k${randomBytes(12).toString("hex")}`.slice(0, 24);
}

function expectedHash(tag: string): string {
  return `rr1:${createHash("sha256").update(`{"requestTag":"${tag}","schemaVersion":1}`, "utf8").digest("hex")}`;
}

async function withOwner<T>(url: string, fn: (client: pg.Client) => Promise<T>): Promise<T> {
  const client = ownerClient(url);
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

async function fetchReservedRow(
  ownerUrl: string,
  bookId: string,
  actorId: string,
  key: string,
): Promise<ReservedRow | undefined> {
  return withOwner(ownerUrl, async (client) => {
    const result = await client.query<ReservedRow>(
      `SELECT id::text, book_id::text, actor_id, operation, key, request_hash, state,
              resource_id::text, response, created_at::text
       FROM kita.command_keys
       WHERE book_id = $1 AND actor_id = $2 AND operation = 'recordNonMoneyRefusal.v1' AND key = $3`,
      [bookId, actorId, key],
    );
    return result.rows[0];
  });
}

async function restrictedClient(url: string): Promise<pg.Client> {
  const client = new pg.Client({
    connectionString: url,
    connectionTimeoutMillis: 10_000,
    statement_timeout: 15_000,
  });
  await client.connect();
  return client;
}

async function expectSqlState(
  client: pg.Client,
  sql: string,
  params: unknown[],
  code: string,
  routine?: string,
): Promise<void> {
  const sp = `sp_${randomBytes(4).toString("hex")}`;
  await client.query(`SAVEPOINT ${sp}`);
  try {
    await client.query(sql, params);
    throw new Error(`expected ${code} from ${sql}`);
  } catch (err) {
    const actual = (err as { code?: string }).code;
    if (actual !== code) {
      throw new Error(`expected ${code} got ${String(actual)} for ${sql}`);
    }
    if (routine) {
      const where = String((err as { where?: string; routine?: string }).where ?? "");
      const rt = String((err as { routine?: string }).routine ?? "");
      if (!where.includes(routine) && rt !== routine) {
        throw new Error(`expected trigger ${routine} in error context`);
      }
    }
  } finally {
    await client.query(`ROLLBACK TO SAVEPOINT ${sp}`);
  }
}

describe.skipIf(!selected)("non-money refusal restricted privilege PostgreSQL evidence", () => {
  let fx: RefusalPgFixtures;

  beforeAll(async () => {
    await assertRefusalSecurityPreflight();
    fx = await provisionRefusalFixtures();
  });

  afterAll(async () => {
    await fx.close();
  });

  it("Committed refusal and replay", async () => {
    const key = freshKey();
    const tag = "sec-commit";
    const sequence: string[] = [];
    const pool = fx.poolFor(fx.loginA.url);
    const observed: PoolLike = {
      connect: async () => {
        const client = await pool.connect();
        return {
          async query(sql: string, params?: readonly unknown[]) {
            if (sql.startsWith("BEGIN")) sequence.push("begin");
            if (sql.includes("record_non_money_refusal")) sequence.push("function");
            if (sql.startsWith("COMMIT")) sequence.push("commit");
            return client.query(sql, params);
          },
          release(err?: unknown) {
            sequence.push("release");
            client.release(err);
          },
        };
      },
      query: (sql, params) => pool.query(sql, params),
      end: () => pool.end(),
    };
    await expect(recordNonMoneyRefusal(observed, { idempotencyKey: key, requestTag: tag })).resolves.toEqual(
      STORED,
    );
    expect(sequence.join(",")).toBe("begin,function,commit,release");
    const row = await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, key);
    if (!row) throw new Error("missing reserved row");
    expect(row.request_hash).toBe(expectedHash(tag));
    expect(row.response).toEqual(STORED);
    await expect(recordNonMoneyRefusal(pool, { idempotencyKey: key, requestTag: tag })).resolves.toEqual(STORED);
    const replay = await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, key);
    expect(replay).toEqual(row);
    await expect(countReservedRows(fx.ownerUrl, fx.bookA, fx.loginA.actorId, key)).resolves.toBe(1);
  });

  it("Restricted command_keys access", async () => {
    const key = freshKey();
    const tag = "sec-ck";
    const pool = fx.poolFor(fx.loginA.url);
    await expect(recordNonMoneyRefusal(pool, { idempotencyKey: key, requestTag: tag })).resolves.toEqual(STORED);
    const existing = await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, key);
    if (!existing) throw new Error("missing baseline row");
    const client = await restrictedClient(fx.loginA.url);
    try {
      await client.query("BEGIN");
      await expectSqlState(client, "SELECT id FROM kita.command_keys WHERE id = $1", [existing.id], "42501");
      await expectSqlState(
        client,
        `INSERT INTO kita.command_keys (book_id, actor_id, operation, key, request_hash, state, resource_id, response)
         VALUES ($1,$2,'recordNonMoneyRefusal.v1',$3,'rr1:${"a".repeat(64)}','rejected',NULL,$4::jsonb)`,
        [fx.bookA, fx.loginA.actorId, freshKey(), JSON.stringify(STORED)],
        "42501",
      );
      await expectSqlState(
        client,
        "UPDATE kita.command_keys SET state = 'unknown' WHERE id = $1 AND book_id = $2 AND actor_id = $3 AND key = $4",
        [existing.id, fx.bookA, fx.loginA.actorId, key],
        "42501",
      );
      await expectSqlState(
        client,
        "DELETE FROM kita.command_keys WHERE id = $1 AND book_id = $2 AND actor_id = $3 AND key = $4",
        [existing.id, fx.bookA, fx.loginA.actorId, key],
        "42501",
      );
    } finally {
      await client.query("ROLLBACK");
      await client.end();
    }
    expect(await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, key)).toEqual(existing);
  });

  it("Restricted binding access", async () => {
    const client = await restrictedClient(fx.loginA.url);
    const oid = await withOwner(fx.ownerUrl, async (owner) => {
      const r = await owner.query<{ oid: string }>(
        "SELECT oid::text FROM pg_roles WHERE rolname = $1",
        [fx.loginA.name],
      );
      return r.rows[0]?.oid;
    });
    if (!oid) throw new Error("login oid missing");
    const unboundOid = await withOwner(fx.ownerUrl, async (owner) => {
      const r = await owner.query<{ oid: string }>(
        "SELECT oid::text FROM pg_roles WHERE rolname = $1",
        [fx.loginUnbound.name],
      );
      return r.rows[0]?.oid;
    });
    try {
      await client.query("BEGIN");
      await expectSqlState(
        client,
        "SELECT login_oid FROM kita.non_money_refusal_principals WHERE login_oid = $1",
        [oid],
        "42501",
      );
      await expectSqlState(
        client,
        `INSERT INTO kita.non_money_refusal_principals (login_oid, login_name, book_id, actor_id)
         VALUES ($1,$2,$3,'refusal-service:spoof')`,
        [unboundOid, fx.loginUnbound.name, fx.bookA],
        "42501",
      );
      await expectSqlState(
        client,
        "UPDATE kita.non_money_refusal_principals SET actor_id = 'refusal-service:changed' WHERE login_oid = $1",
        [oid],
        "42501",
      );
      await expectSqlState(
        client,
        "DELETE FROM kita.non_money_refusal_principals WHERE login_oid = $1 AND login_name = $2",
        [oid, fx.loginA.name],
        "42501",
      );
    } finally {
      await client.query("ROLLBACK");
      await client.end();
    }
  });

  it("Restricted role assumption", async () => {
    const targets = ["kita_refusal_definer", "kita_test", "kita_refusal_recorder", fx.loginB.name];
    for (const target of targets) {
      const client = await restrictedClient(fx.loginA.url);
      try {
        await client.query("BEGIN");
        const before = await client.query<{ session_user: string; current_user: string }>(
          "SELECT session_user AS session_user, current_user AS current_user",
        );
        expect(before.rows[0]?.session_user).toBe(fx.loginA.name);
        expect(before.rows[0]?.current_user).toBe(fx.loginA.name);
        if (!/^[A-Za-z0-9_]+$/.test(target)) throw new Error("invalid role ident");
        await expectSqlState(client, `SET LOCAL ROLE "${target}"`, [], "42501");
        const after = await client.query<{ session_user: string; current_user: string }>(
          "SELECT session_user AS session_user, current_user AS current_user",
        );
        expect(after.rows[0]?.session_user).toBe(fx.loginA.name);
        expect(after.rows[0]?.current_user).toBe(fx.loginA.name);
      } finally {
        await client.query("ROLLBACK");
        await client.end();
      }
    }
  });

  it("Unbound recorder denial", async () => {
    const key = freshKey();
    const tag = "sec-unbound";
    const client = await restrictedClient(fx.loginUnbound.url);
    try {
      await client.query("BEGIN");
      await expectSqlState(client, "SELECT kita.record_non_money_refusal($1,$2)", [key, tag], "KRF01");
    } finally {
      await client.query("ROLLBACK");
      await client.end();
    }
    await expect(
      recordNonMoneyRefusal(fx.poolFor(fx.loginUnbound.url), { idempotencyKey: key, requestTag: tag }),
    ).resolves.toEqual(UNAUTHORIZED);
    await expect(countReservedRows(fx.ownerUrl, fx.bookA, fx.loginA.actorId, key)).resolves.toBe(0);
    await expect(countReservedRows(fx.ownerUrl, fx.bookA, fx.loginB.actorId, key)).resolves.toBe(0);
    await expect(countReservedRows(fx.ownerUrl, fx.bookC, fx.loginC.actorId, key)).resolves.toBe(0);
  });

  it("Actor/book isolation and input spoof rejection", async () => {
    const key = freshKey();
    const tags = { a: "iso-a", b: "iso-b", c: "iso-c" };
    await expect(
      recordNonMoneyRefusal(fx.poolFor(fx.loginA.url), { idempotencyKey: key, requestTag: tags.a }),
    ).resolves.toEqual(STORED);
    await expect(
      recordNonMoneyRefusal(fx.poolFor(fx.loginB.url), { idempotencyKey: key, requestTag: tags.b }),
    ).resolves.toEqual(STORED);
    await expect(
      recordNonMoneyRefusal(fx.poolFor(fx.loginC.url), { idempotencyKey: key, requestTag: tags.c }),
    ).resolves.toEqual(STORED);
    const rowA = await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, key);
    const rowB = await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginB.actorId, key);
    const rowC = await fetchReservedRow(fx.ownerUrl, fx.bookC, fx.loginC.actorId, key);
    if (!rowA || !rowB || !rowC) throw new Error("missing isolated rows");
    expect(rowA.request_hash).toBe(expectedHash(tags.a));
    expect(rowB.request_hash).toBe(expectedHash(tags.b));
    expect(rowC.request_hash).toBe(expectedHash(tags.c));
    expect(new Set([rowA.id, rowB.id, rowC.id]).size).toBe(3);
    await expect(
      recordNonMoneyRefusal(fx.poolFor(fx.loginA.url), { idempotencyKey: key, requestTag: tags.a }),
    ).resolves.toEqual(STORED);
    await expect(
      recordNonMoneyRefusal(fx.poolFor(fx.loginA.url), { idempotencyKey: key, requestTag: "iso-other" }),
    ).resolves.toEqual(MISMATCH);
    expect(await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, key)).toEqual(rowA);
    expect(await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginB.actorId, key)).toEqual(rowB);
    expect(await fetchReservedRow(fx.ownerUrl, fx.bookC, fx.loginC.actorId, key)).toEqual(rowC);
    const noCheckout: PoolLike = {
      connect: async () => {
        throw new Error("must not checkout");
      },
      query: async () => {
        throw new Error("must not query");
      },
      end: async () => {},
    };
    for (const extra of ["bookId", "actorId", "operation"]) {
      await expect(
        recordNonMoneyRefusal(noCheckout, {
          idempotencyKey: key,
          requestTag: tags.a,
          [extra]: "spoof",
        }),
      ).resolves.toEqual(INVALID);
    }
  });

  it("Binding trigger immutability", async () => {
    const oid = await withOwner(fx.ownerUrl, async (owner) => {
      const r = await owner.query<{ oid: string }>(
        "SELECT oid::text FROM pg_roles WHERE rolname = $1",
        [fx.loginA.name],
      );
      return r.rows[0]?.oid;
    });
    if (!oid) throw new Error("login oid missing");
    const client = ownerClient(fx.ownerUrl);
    await client.connect();
    try {
      await client.query("BEGIN");
      await expectSqlState(
        client,
        "UPDATE kita.non_money_refusal_principals SET actor_id = 'refusal-service:mut' WHERE login_oid = $1 AND login_name = $2",
        [oid, fx.loginA.name],
        "42501",
        "non_money_refusal_principals_immutable",
      );
      await expectSqlState(
        client,
        "UPDATE kita.non_money_refusal_principals SET book_id = $3 WHERE login_oid = $1 AND login_name = $2",
        [oid, fx.loginA.name, fx.bookC],
        "42501",
        "non_money_refusal_principals_immutable",
      );
      await expectSqlState(
        client,
        "DELETE FROM kita.non_money_refusal_principals WHERE login_oid = $1 AND login_name = $2",
        [oid, fx.loginA.name],
        "42501",
        "non_money_refusal_principals_immutable",
      );
    } finally {
      await client.query("ROLLBACK");
      await client.end();
    }
  });

  it("Reserved history trigger immutability", async () => {
    const key = freshKey();
    const tag = "sec-hist";
    const pool = fx.poolFor(fx.loginA.url);
    await expect(recordNonMoneyRefusal(pool, { idempotencyKey: key, requestTag: tag })).resolves.toEqual(STORED);
    const existing = await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, key);
    if (!existing) throw new Error("missing history baseline");
    const client = ownerClient(fx.ownerUrl);
    await client.connect();
    const scope = [existing.id, fx.bookA, fx.loginA.actorId, key];
    try {
      await client.query("BEGIN");
      const updates: Array<[string, unknown[]]> = [
        ["UPDATE kita.command_keys SET actor_id = $5 WHERE id = $1 AND book_id = $2 AND actor_id = $3 AND key = $4", [...scope, fx.loginB.actorId]],
        ["UPDATE kita.command_keys SET book_id = $5 WHERE id = $1 AND book_id = $2 AND actor_id = $3 AND key = $4", [...scope, fx.bookC]],
        ["UPDATE kita.command_keys SET key = $5 WHERE id = $1 AND book_id = $2 AND actor_id = $3 AND key = $4", [...scope, freshKey()]],
        ["UPDATE kita.command_keys SET request_hash = $5 WHERE id = $1 AND book_id = $2 AND actor_id = $3 AND key = $4", [...scope, expectedHash("other")]],
        ["UPDATE kita.command_keys SET state = 'unknown' WHERE id = $1 AND book_id = $2 AND actor_id = $3 AND key = $4", scope],
        ["UPDATE kita.command_keys SET resource_id = gen_random_uuid() WHERE id = $1 AND book_id = $2 AND actor_id = $3 AND key = $4", scope],
        ["UPDATE kita.command_keys SET response = $5::jsonb WHERE id = $1 AND book_id = $2 AND actor_id = $3 AND key = $4", [...scope, JSON.stringify({ ok: false, error: { code: "x" } })]],
        ["UPDATE kita.command_keys SET created_at = now() WHERE id = $1 AND book_id = $2 AND actor_id = $3 AND key = $4", scope],
        ["UPDATE kita.command_keys SET operation = 'recordNonMoneyRefusal.test' WHERE id = $1 AND book_id = $2 AND actor_id = $3 AND key = $4", scope],
        ["DELETE FROM kita.command_keys WHERE id = $1 AND book_id = $2 AND actor_id = $3 AND key = $4", scope],
      ];
      for (const [sql, params] of updates) {
        await expectSqlState(client, sql, params, "42501", "guard_non_money_refusal_command_keys");
      }
    } finally {
      await client.query("ROLLBACK");
      await client.end();
    }
    expect(await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, key)).toEqual(existing);
    await expect(recordNonMoneyRefusal(pool, { idempotencyKey: key, requestTag: tag })).resolves.toEqual(STORED);
    await expect(recordNonMoneyRefusal(pool, { idempotencyKey: key, requestTag: "sec-hist-other" })).resolves.toEqual(
      MISMATCH,
    );
    expect(await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, key)).toEqual(existing);
  });
});
