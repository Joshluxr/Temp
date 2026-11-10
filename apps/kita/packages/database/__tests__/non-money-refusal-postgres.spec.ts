import { createHash } from "node:crypto";
import { spawn, type ChildProcess } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import pg from "pg";

import { createPool } from "../src/pool.js";
import type { PoolClientLike, PoolLike } from "../src/pool.js";
import { recordNonMoneyRefusal } from "../src/non-money-refusal-store.ts";
import {
  countReservedRows,
  fetchReservedHash,
  postgresSuiteSelected,
  provisionRefusalFixtures,
  requireRefusalOwnerUrl,
  type RefusalPgFixtures,
} from "./helpers/non-money-refusal-pg.ts";

const selected = postgresSuiteSelected();
const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const KEY = "aaaaaaaaaaaaaaaa";
const TAG = "tag-one";
const STORED = {
  ok: false as const,
  error: {
    code: "CAPABILITY_UNAVAILABLE",
    status: 503,
    retryable: false,
    detail: "Command execution is unavailable.",
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

function expectedHash(tag: string): string {
  const canonical = `{"requestTag":"${tag}","schemaVersion":1}`;
  return `rr1:${createHash("sha256").update(canonical, "utf8").digest("hex")}`;
}

async function ownerQuery<T extends Record<string, unknown>>(
  sql: string,
  params: readonly unknown[] = [],
): Promise<T[]> {
  const client = new pg.Client({ connectionString: requireRefusalOwnerUrl() });
  await client.connect();
  try {
    const result = await client.query<T>(sql, [...params]);
    return result.rows;
  } finally {
    await client.end();
  }
}

async function fetchReservedRow(
  bookId: string,
  actorId: string,
  key: string,
): Promise<ReservedRow | undefined> {
  const rows = await ownerQuery<ReservedRow>(
    `SELECT id::text, book_id::text, actor_id, operation, key, request_hash, state,
            resource_id::text, response, created_at::text
     FROM kita.command_keys
     WHERE book_id = $1 AND actor_id = $2 AND operation = 'recordNonMoneyRefusal.v1' AND key = $3`,
    [bookId, actorId, key],
  );
  return rows[0];
}

async function assertExactTargetPreflight(): Promise<void> {
  const rows = await ownerQuery<{
    server_version_num: string;
    current_database: string;
    session_user: string;
    current_user: string;
    schema_owner: string;
    fsync: string;
    full_page_writes: string;
    synchronous_commit: string;
    fn_owner: string;
    recorder_exec: boolean;
    can_create_role: boolean;
  }>(
    `SELECT current_setting('server_version_num') AS server_version_num,
            current_database() AS current_database,
            session_user AS session_user,
            current_user AS current_user,
            (SELECT pg_get_userbyid(n.nspowner) FROM pg_namespace n WHERE n.nspname = 'kita') AS schema_owner,
            current_setting('fsync') AS fsync,
            current_setting('full_page_writes') AS full_page_writes,
            current_setting('synchronous_commit') AS synchronous_commit,
            (SELECT pg_get_userbyid(p.proowner)
               FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
              WHERE n.nspname = 'kita' AND p.proname = 'record_non_money_refusal') AS fn_owner,
            has_function_privilege('kita_refusal_recorder', 'kita.record_non_money_refusal(text,text)', 'EXECUTE') AS recorder_exec,
            current_setting('is_superuser') = 'on' OR pg_has_role(current_user, 'kita_test', 'USAGE') AS can_create_role`,
  );
  const row = rows[0];
  if (!row) throw new Error("preflight returned no row");
  if (row.server_version_num !== "180006") {
    throw new Error(`HOLD: server_version_num ${row.server_version_num} is not 180006`);
  }
  if (row.current_database !== "kita_core_test") {
    throw new Error("HOLD: database is not kita_core_test");
  }
  if (row.session_user !== "kita_test" || row.current_user !== "kita_test") {
    throw new Error("HOLD: owner session is not kita_test");
  }
  if (row.schema_owner !== "kita_test") {
    throw new Error("HOLD: kita schema owner is not kita_test");
  }
  if (row.fsync !== "on" || row.full_page_writes !== "on" || row.synchronous_commit !== "on") {
    throw new Error("HOLD: durability settings are not on");
  }
  if (row.fn_owner !== "kita_refusal_definer") {
    throw new Error("HOLD: function owner is not kita_refusal_definer");
  }
  if (row.recorder_exec !== true) {
    throw new Error("HOLD: recorder EXECUTE missing");
  }
}

async function assertRestrictedIdentity(url: string, expectedLogin: string): Promise<void> {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    const result = await client.query<{
      session_user: string;
      current_user: string;
      synchronous_commit: string;
    }>(
      `SELECT session_user AS session_user, current_user AS current_user,
              current_setting('synchronous_commit') AS synchronous_commit`,
    );
    const row = result.rows[0];
    if (!row) throw new Error("HOLD: restricted identity query returned no row");
    if (row.session_user !== expectedLogin || row.current_user !== expectedLogin) {
      throw new Error(`HOLD: restricted identity ${expectedLogin} mismatch`);
    }
    if (row.synchronous_commit !== "on") {
      throw new Error("HOLD: restricted writer synchronous_commit is not on");
    }
  } finally {
    await client.end();
  }
}

const CHILD_SRC = `
const { Client } = require('pg');
process.on('message', async (msg) => {
  const client = new Client({ connectionString: msg.url });
  try {
    await client.connect();
    const pid = await client.query('SELECT pg_backend_pid() AS pid');
    await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');
    const body = await client.query('SELECT kita.record_non_money_refusal($1,$2) AS body', [msg.key, msg.tag]);
    const returned = body.rows[0].body;
    if (!returned || returned.ok !== false || !returned.error ||
        returned.error.code !== 'CAPABILITY_UNAVAILABLE' || returned.error.status !== 503 ||
        returned.error.retryable !== false ||
        returned.error.detail !== 'Command execution is unavailable.') {
      process.send({ type: 'fail', detail: 'function body mismatch:' + JSON.stringify(returned) });
      process.exit(2);
    }
    if (msg.mode === 'after-commit') {
      await client.query('COMMIT');
      process.send({ type: 'checkpoint', backendPid: pid.rows[0].pid, committed: true });
    } else {
      process.send({ type: 'checkpoint', backendPid: pid.rows[0].pid, committed: false });
    }
    await new Promise(() => {});
  } catch (err) {
    process.send({ type: 'fail', detail: String(err && err.message ? err.message : err) });
    process.exit(3);
  }
});
process.send({ type: 'ready' });
`;

function strippedEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  delete env.KITA_REFUSAL_TEST_OWNER_URL;
  delete env.PGPASSWORD;
  delete env.PGUSER;
  delete env.PGDATABASE;
  delete env.PGHOST;
  delete env.PGPORT;
  return env;
}

function spawnRestrictedChild(): ChildProcess {
  return spawn(process.execPath, ["-e", CHILD_SRC], {
    cwd: PACKAGE_ROOT,
    env: strippedEnv(),
    stdio: ["ignore", "pipe", "pipe", "ipc"],
  });
}

function waitMessage(
  child: ChildProcess,
  type: string,
  timeoutMs: number,
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const finish = (fn: () => void) => {
      clearTimeout(timer);
      child.off("message", onMessage);
      child.off("exit", onExit);
      fn();
    };
    const timer = setTimeout(() => {
      finish(() => reject(new Error(`timeout waiting for ${type}`)));
    }, timeoutMs);
    const onMessage = (msg: Record<string, unknown>) => {
      if (msg.type === "fail") {
        finish(() => reject(new Error(String(msg.detail))));
        return;
      }
      if (msg.type === type) {
        finish(() => resolve(msg));
      }
    };
    const onExit = (code: number | null, signal: NodeJS.Signals | null) => {
      finish(() =>
        reject(new Error(`child exited before ${type}: ${String(code)}/${String(signal)}`)),
      );
    };
    child.on("message", onMessage);
    child.once("exit", onExit);
  });
}

async function waitExit(child: ChildProcess, timeoutMs: number): Promise<{ code: number | null; signal: NodeJS.Signals | null }> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout waiting for child exit")), timeoutMs);
    child.once("exit", (code, signal) => {
      clearTimeout(timer);
      resolve({ code, signal });
    });
  });
}

async function waitBackendGone(backendPid: number, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const rows = await ownerQuery<{ pid: number }>("SELECT pid FROM pg_stat_activity WHERE pid = $1", [
      backendPid,
    ]);
    if (rows.length === 0) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error(`backend ${backendPid} did not disappear`);
}

class InjectedTransportFailure extends Error {
  override readonly name = "InjectedTransportFailure";
  readonly code = "ECONNRESET";
  constructor() {
    super("injected: COMMIT acknowledgment withheld");
  }
}

function lostCommitPool(url: string): { pool: PoolLike; stats: { checkouts: number } } {
  const stats = { checkouts: 0 };
  const pool: PoolLike = {
    async connect() {
      stats.checkouts += 1;
      const client = new pg.Client({ connectionString: url });
      await client.connect();
      let closed = false;
      const wrapped: PoolClientLike = {
        async query(sql: string, params?: readonly unknown[]) {
          if (sql.startsWith("COMMIT")) {
            await client.query("COMMIT");
            await client.end();
            closed = true;
            throw new InjectedTransportFailure();
          }
          const result = await client.query(sql, params ? [...params] : undefined);
          return { rows: result.rows, rowCount: result.rowCount ?? 0 };
        },
        release() {
          if (!closed) {
            void client.end();
            closed = true;
          }
        },
      };
      return wrapped;
    },
    query: async () => ({ rows: [] }),
    end: async () => {},
  };
  return { pool, stats };
}

function expectPreserved(before: ReservedRow, after: ReservedRow): void {
  expect(after).toEqual(before);
  expect(after.state).toBe("rejected");
  expect(after.resource_id).toBeNull();
  expect(after.operation).toBe("recordNonMoneyRefusal.v1");
  expect(after.response).toEqual(STORED);
}

describe.skipIf(!selected)("non-money refusal PostgreSQL 18 evidence", () => {
  let fx: RefusalPgFixtures;

  beforeAll(async () => {
    await assertExactTargetPreflight();
    fx = await provisionRefusalFixtures();
    await assertRestrictedIdentity(fx.loginA.url, fx.loginA.name);
    await assertRestrictedIdentity(fx.loginB.url, fx.loginB.name);
    await assertRestrictedIdentity(fx.loginC.url, fx.loginC.name);
  });

  afterAll(async () => {
    /* Restricted pools close with the process; credentials stay in memory only. */
  });

  it("records a rejected command_keys row and replays the same refusal", async () => {
    const poolA = fx.poolFor(fx.loginA.url);
    const first = await recordNonMoneyRefusal(poolA, {
      idempotencyKey: KEY,
      requestTag: TAG,
    });
    expect(first).toEqual(STORED);
    const second = await recordNonMoneyRefusal(poolA, {
      idempotencyKey: KEY,
      requestTag: TAG,
    });
    expect(second).toEqual(STORED);
  });

  it("rejects a changed tag for the same key without overwriting", async () => {
    const poolA = fx.poolFor(fx.loginA.url);
    const mismatch = await recordNonMoneyRefusal(poolA, {
      idempotencyKey: KEY,
      requestTag: "tag-two",
    });
    expect(mismatch).toEqual({
      ok: false,
      error: {
        code: "IDEMPOTENCY_MISMATCH",
        status: 409,
        retryable: false,
        detail: "Idempotency key is bound to a different request.",
      },
    });
    const replay = await recordNonMoneyRefusal(poolA, {
      idempotencyKey: KEY,
      requestTag: TAG,
    });
    expect(replay).toEqual(STORED);
  });

  it("isolates the same textual key across actors and books", async () => {
    const poolB = fx.poolFor(fx.loginB.url);
    const poolC = fx.poolFor(fx.loginC.url);
    await expect(
      recordNonMoneyRefusal(poolB, { idempotencyKey: KEY, requestTag: TAG }),
    ).resolves.toEqual(STORED);
    await expect(
      recordNonMoneyRefusal(poolC, { idempotencyKey: KEY, requestTag: TAG }),
    ).resolves.toEqual(STORED);
  });

  it("refuses an unbound recorder login without writing", async () => {
    const poolU = fx.poolFor(fx.loginUnbound.url);
    await expect(
      recordNonMoneyRefusal(poolU, { idempotencyKey: KEY, requestTag: TAG }),
    ).resolves.toEqual({
      ok: false,
      error: {
        code: "unauthorized",
        status: 403,
        retryable: false,
        detail: "Refusal-record scope is unavailable.",
      },
    });
  });

  it("denies direct command_keys SELECT from a restricted login", async () => {
    const poolA = fx.poolFor(fx.loginA.url);
    const client = await poolA.connect();
    try {
      await expect(client.query("SELECT id FROM kita.command_keys")).rejects.toMatchObject({
        code: "42501",
      });
    } finally {
      client.release();
    }
  });

  it("converges 100 simultaneous contenders on one reserved row", async () => {
    const key = "cccccccccccccccc";
    const tag = "contend-one";
    const pool = createPool({ databaseUrl: fx.loginA.url, poolMax: 40 });
    try {
      const results = await Promise.all(
        Array.from({ length: 100 }, () =>
          recordNonMoneyRefusal(pool, { idempotencyKey: key, requestTag: tag }),
        ),
      );
      expect(results).toHaveLength(100);
      for (const result of results) {
        expect(result).toEqual(STORED);
      }
      await expect(
        countReservedRows(fx.ownerUrl, fx.bookA, fx.loginA.actorId, key),
      ).resolves.toBe(1);
    } finally {
      await pool.close();
    }
  });

  it("stores the independently computed rr1 SHA-256 over UTF-8 canonical bytes", async () => {
    const key = "dddddddddddddddd";
    const tag = "golden1";
    const poolA = fx.poolFor(fx.loginA.url);
    await expect(
      recordNonMoneyRefusal(poolA, { idempotencyKey: key, requestTag: tag }),
    ).resolves.toEqual(STORED);
    const canonical = `{"requestTag":"${tag}","schemaVersion":1}`;
    const digest = createHash("sha256").update(canonical, "utf8").digest("hex");
    await expect(
      fetchReservedHash(fx.ownerUrl, fx.bookA, fx.loginA.actorId, key),
    ).resolves.toBe(`rr1:${digest}`);
  });

  it("denies SET ROLE to the definer from a restricted login", async () => {
    const poolA = fx.poolFor(fx.loginA.url);
    const client = await poolA.connect();
    try {
      await expect(client.query("SET ROLE kita_refusal_definer")).rejects.toMatchObject({
        code: "42501",
      });
    } finally {
      client.release();
    }
  });

  it("leaves zero rows when the client dies before COMMIT, then retries into one reserved row", async () => {
    const key = "eeeeeeeeeeeeeeee";
    const tag = "crash-before";
    const child = spawnRestrictedChild();
    try {
      await waitMessage(child, "ready", 10_000);
      if (typeof child.pid !== "number") throw new Error("child pid missing");
      child.send({ url: fx.loginA.url, key, tag, mode: "before-commit" });
      const checkpoint = await waitMessage(child, "checkpoint", 15_000);
      const backendPid = Number(checkpoint.backendPid);
      expect(checkpoint.committed).toBe(false);
      process.kill(child.pid, "SIGKILL");
      const exited = await waitExit(child, 10_000);
      expect(exited.signal).toBe("SIGKILL");
      await waitBackendGone(backendPid, 10_000);
      await expect(countReservedRows(fx.ownerUrl, fx.bookA, fx.loginA.actorId, key)).resolves.toBe(0);
      const poolA = fx.poolFor(fx.loginA.url);
      await expect(recordNonMoneyRefusal(poolA, { idempotencyKey: key, requestTag: tag })).resolves.toEqual(
        STORED,
      );
      const first = await fetchReservedRow(fx.bookA, fx.loginA.actorId, key);
      if (!first) throw new Error("expected reserved row after retry");
      expect(first.request_hash).toBe(expectedHash(tag));
      await expect(recordNonMoneyRefusal(poolA, { idempotencyKey: key, requestTag: tag })).resolves.toEqual(
        STORED,
      );
      const replay = await fetchReservedRow(fx.bookA, fx.loginA.actorId, key);
      if (!replay) throw new Error("expected reserved row after replay");
      expectPreserved(first, replay);
      await expect(countReservedRows(fx.ownerUrl, fx.bookA, fx.loginA.actorId, key)).resolves.toBe(1);
    } finally {
      if (child.exitCode === null && child.signalCode === null && typeof child.pid === "number") {
        try {
          process.kill(child.pid, "SIGKILL");
        } catch {
          /* already reaped */
        }
      }
    }
  });

  it("replays the original row after the client dies after acknowledged COMMIT", async () => {
    const key = "ffffffffffffffff";
    const tag = "crash-after";
    const child = spawnRestrictedChild();
    try {
      await waitMessage(child, "ready", 10_000);
      if (typeof child.pid !== "number") throw new Error("child pid missing");
      child.send({ url: fx.loginA.url, key, tag, mode: "after-commit" });
      const checkpoint = await waitMessage(child, "checkpoint", 15_000);
      expect(checkpoint.committed).toBe(true);
      const backendPid = Number(checkpoint.backendPid);
      const committed = await fetchReservedRow(fx.bookA, fx.loginA.actorId, key);
      if (!committed) throw new Error("expected reserved row after COMMIT checkpoint");
      expect(committed.request_hash).toBe(expectedHash(tag));
      process.kill(child.pid, "SIGKILL");
      await waitExit(child, 10_000);
      await waitBackendGone(backendPid, 10_000);
      const poolA = createPool({ databaseUrl: fx.loginA.url, poolMax: 2 });
      try {
        await expect(recordNonMoneyRefusal(poolA, { idempotencyKey: key, requestTag: tag })).resolves.toEqual(
          STORED,
        );
        const replay = await fetchReservedRow(fx.bookA, fx.loginA.actorId, key);
        if (!replay) throw new Error("expected reserved row after restart replay");
        expectPreserved(committed, replay);
        await expect(countReservedRows(fx.ownerUrl, fx.bookA, fx.loginA.actorId, key)).resolves.toBe(1);
      } finally {
        await poolA.close();
      }
    } finally {
      if (child.exitCode === null && child.signalCode === null && typeof child.pid === "number") {
        try {
          process.kill(child.pid, "SIGKILL");
        } catch {
          /* already reaped */
        }
      }
    }
  });

  it("treats a withheld COMMIT acknowledgment as unconfirmed and recovers the committed row", async () => {
    const key = "gggggggggggggggg";
    const tag = "lost-ack";
    const { pool, stats } = lostCommitPool(fx.loginA.url);
    await expect(recordNonMoneyRefusal(pool, { idempotencyKey: key, requestTag: tag })).resolves.toEqual(
      UNCONFIRMED,
    );
    expect(stats.checkouts).toBe(1);
    await expect(countReservedRows(fx.ownerUrl, fx.bookA, fx.loginA.actorId, key)).resolves.toBe(1);
    const committed = await fetchReservedRow(fx.bookA, fx.loginA.actorId, key);
    if (!committed) throw new Error("expected reserved row after lost COMMIT ack");
    expect(committed.request_hash).toBe(expectedHash(tag));
    expect(committed.state).toBe("rejected");
    const fresh = createPool({ databaseUrl: fx.loginA.url, poolMax: 2 });
    try {
      await expect(recordNonMoneyRefusal(fresh, { idempotencyKey: key, requestTag: tag })).resolves.toEqual(
        STORED,
      );
      const replay = await fetchReservedRow(fx.bookA, fx.loginA.actorId, key);
      if (!replay) throw new Error("expected reserved row after recovery");
      expectPreserved(committed, replay);
      await expect(
        recordNonMoneyRefusal(fresh, { idempotencyKey: key, requestTag: "lost-ack-other" }),
      ).resolves.toEqual(MISMATCH);
      const afterMismatch = await fetchReservedRow(fx.bookA, fx.loginA.actorId, key);
      if (!afterMismatch) throw new Error("expected reserved row after mismatch");
      expectPreserved(committed, afterMismatch);
    } finally {
      await fresh.close();
    }
  });
});
