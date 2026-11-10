import { createHash, randomBytes } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import pg from "pg";

import { createPool } from "../src/pool.js";
import type { PoolClientLike, PoolLike } from "../src/pool.js";
import { withSerializable } from "../src/transaction.js";
import { recordNonMoneyRefusal } from "../src/non-money-refusal-store.js";
import {
  countReservedRows,
  ownerClient,
  postgresSuiteSelected,
  provisionRefusalFixtures,
  requireRefusalOwnerUrl,
  type RefusalPgFixtures,
} from "./helpers/non-money-refusal-pg.js";

const selected = postgresSuiteSelected();
const privateNotes = new WeakMap<object, unknown[]>();

function notePrivate(owner: object, value: unknown): void {
  const prior = privateNotes.get(owner) ?? [];
  prior.push(value);
  privateNotes.set(owner, prior);
}
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

function parsePgDurationMs(raw: unknown): number {
  if (typeof raw !== "string" || raw.trim().length === 0) {
    throw new Error("HOLD: duration missing");
  }
  const text = raw.trim().toLowerCase();
  const match = /^(\d+)(us|ms|s|min|h)?$/.exec(text);
  if (!match) throw new Error("HOLD: duration unparseable");
  const n = Number(match[1]);
  const unit = match[2] ?? "ms";
  const ms =
    unit === "us" ? n / 1000 : unit === "ms" ? n : unit === "s" ? n * 1000 : unit === "min" ? n * 60_000 : n * 3_600_000;
  if (!(ms > 0) || !Number.isFinite(ms)) throw new Error("HOLD: duration not positive");
  return ms;
}

function timedDeferred<T = void>(name: string, ms = 20_000): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (err: unknown) => void;
  outcome: () => PromiseSettledResult<T> | undefined;
} {
  let resolve!: (value: T) => void;
  let reject!: (err: unknown) => void;
  let settled: PromiseSettledResult<T> | undefined;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  const timer = setTimeout(() => reject(new Error(`timeout:${name}`)), ms);
  void promise.then(
    (value) => {
      settled = { status: "fulfilled", value };
    },
    (reason: unknown) => {
      settled = { status: "rejected", reason };
    },
  );
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
    outcome: () => settled,
  };
}

async function withOwnerObserver<T>(ownerUrl: string, fn: (client: pg.Client) => Promise<T>): Promise<T> {
  const client = ownerClient(ownerUrl);
  let connected = false;
  let failed = false;
  let primary: unknown;
  try {
    await client.connect();
    connected = true;
    return await fn(client);
  } catch (err) {
    failed = true;
    primary = err;
    throw err;
  } finally {
    try {
      await client.end();
    } catch (endErr) {
      let code = "CLOSE_FAILED";
      try {
        if (typeof endErr === "object" && endErr !== null && "code" in endErr) {
          const value = (endErr as { code?: unknown }).code;
          if (typeof value === "string" && value.length > 0) code = value;
        }
      } catch {
        code = "CLOSE_FAILED";
      }
      const cleanup = new Error(`observer close failed stage=owner-client.end code=${code} connected=${connected}`);
      notePrivate(cleanup, endErr);
      const hideable =
        (typeof primary === "object" && primary !== null) || typeof primary === "function";
      notePrivate(client, cleanup);
      notePrivate(client, endErr);
      if (failed && hideable) {
        notePrivate(primary as object, cleanup);
        notePrivate(primary as object, endErr);
      } else if (failed) {
        throw primary;
      } else {
        throw cleanup;
      }
    }
  }
}

async function fetchReservedRow(
  ownerUrl: string,
  bookId: string,
  actorId: string,
  key: string,
): Promise<ReservedRow | undefined> {
  return withOwnerObserver(ownerUrl, async (client) => {
    const result = await client.query<ReservedRow>(
      `SELECT id::text, book_id::text, actor_id, operation, key, request_hash, state,
              resource_id::text, response, created_at::text
       FROM kita.command_keys
       WHERE book_id = $1 AND actor_id = $2 AND operation = 'recordNonMoneyRefusal.v1' AND key = $3`,
      [bookId, actorId, key],
    );
    expect(result.rows.length).toBeLessThanOrEqual(1);
    return result.rows[0];
  });
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

async function observeIdentity(
  client: PoolClientLike,
  expectedLogin: string,
): Promise<{ pid: number; start: string; oid: string }> {
  const ident = await client.query(
    `SELECT session_user AS session_user, current_user AS current_user,
            pg_backend_pid() AS pid,
            current_setting('transaction_isolation') AS isolation,
            current_setting('synchronous_commit') AS synchronous_commit,
            current_setting('session_replication_role') AS replication_role,
            current_setting('statement_timeout') AS statement_timeout,
            current_setting('lock_timeout') AS lock_timeout,
            current_setting('deadlock_timeout') AS deadlock_timeout,
            (SELECT oid::text FROM pg_roles WHERE rolname = current_user) AS login_oid,
            (SELECT rolsuper FROM pg_roles WHERE rolname = current_user) AS rolsuper,
            (SELECT rolcreatedb FROM pg_roles WHERE rolname = current_user) AS rolcreatedb,
            (SELECT rolcanlogin FROM pg_roles WHERE rolname = current_user) AS rolcanlogin,
            (SELECT rolinherit FROM pg_roles WHERE rolname = current_user) AS rolinherit,
            (SELECT rolcreaterole FROM pg_roles WHERE rolname = current_user) AS rolcreaterole,
            (SELECT rolreplication FROM pg_roles WHERE rolname = current_user) AS rolreplication,
            (SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user) AS rolbypassrls,
            (SELECT pg_has_role(current_user, 'kita_refusal_recorder', 'USAGE')) AS recorder_member,
            (SELECT backend_start::text FROM pg_stat_activity WHERE pid = pg_backend_pid()) AS start`,
  );
  const row = ident.rows[0];
  expect(row?.session_user).toBe(expectedLogin);
  expect(row?.current_user).toBe(expectedLogin);
  expect(row?.isolation).toBe("serializable");
  expect(row?.synchronous_commit).toBe("on");
  expect(row?.replication_role).toBe("origin");
  expect(row?.statement_timeout).not.toBe("0");
  expect(String(row?.statement_timeout).length).toBeGreaterThan(0);
  expect(typeof row?.lock_timeout).toBe("string");
  expect(typeof row?.deadlock_timeout).toBe("string");
  expect(String(row?.deadlock_timeout).length).toBeGreaterThan(0);
  expect(row?.rolsuper).toBe(false);
  expect(row?.rolcreatedb).toBe(false);
  expect(row?.rolcanlogin).toBe(true);
  expect(row?.rolinherit).toBe(true);
  expect(row?.rolcreaterole).toBe(false);
  expect(row?.rolreplication).toBe(false);
  expect(row?.rolbypassrls).toBe(false);
  expect(row?.recorder_member).toBe(true);
  if (typeof row?.login_oid !== "string" || row.login_oid.length === 0) {
    throw new Error("HOLD: actual login oid missing");
  }
  if (typeof row?.start !== "string" || row.start.length === 0) {
    throw new Error("HOLD: backend_start missing");
  }
  const pid = Number(row.pid);
  if (!Number.isInteger(pid) || pid <= 0) {
    throw new Error("HOLD: backend pid missing");
  }
  const statementMs = parsePgDurationMs(row.statement_timeout);
  const lockMs = parsePgDurationMs(row.lock_timeout);
  const deadlockMs = parsePgDurationMs(row.deadlock_timeout);
  if (!(statementMs > 0 && lockMs > 0 && deadlockMs > 0)) {
    throw new Error("HOLD: timeout budget is not positive");
  }
  if (!(deadlockMs <= lockMs && lockMs <= statementMs)) {
    throw new Error("HOLD: timeout budgets are incompatible");
  }
  return { pid, start: row.start, oid: row.login_oid };
}

async function assertSuitePreflight(ownerUrl: string): Promise<void> {
  await withOwnerObserver(ownerUrl, async (client) => {
    const row = (
      await client.query<{
        server_version_num: string;
        current_database: string;
        session_user: string;
        current_user: string;
        rolsuper: boolean;
        rolcreaterole: boolean;
        replication_role: string;
        temp_grant: string;
        fn_oid: string;
      }>(
        `SELECT current_setting('server_version_num') AS server_version_num,
                current_database() AS current_database,
                session_user, current_user,
                (SELECT rolsuper FROM pg_roles WHERE rolname = current_user) AS rolsuper,
                (SELECT rolcreaterole FROM pg_roles WHERE rolname = current_user) AS rolcreaterole,
                current_setting('session_replication_role') AS replication_role,
                (SELECT count(*)::text
                   FROM pg_auth_members m
                   JOIN pg_roles r ON r.oid = m.member
                   JOIN pg_roles g ON g.oid = m.roleid
                   JOIN pg_roles grantor ON grantor.oid = m.grantor
                  WHERE r.rolname = 'kita_test'
                    AND g.rolname = 'kita_refusal_definer'
                    AND grantor.rolname = 'kita_test') AS temp_grant,
                (SELECT p.oid::text
                   FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                  WHERE n.nspname = 'kita' AND p.proname = 'record_non_money_refusal'
                    AND pg_get_function_identity_arguments(p.oid) = 'p_key text, p_tag text') AS fn_oid`,
      )
    ).rows[0];
    if (!row) throw new Error("HOLD: suite preflight returned no row");
    if (row.server_version_num !== "180006") throw new Error("HOLD: not PostgreSQL 18.6");
    if (row.current_database !== "kita_core_test") throw new Error("HOLD: wrong database");
    if (row.session_user !== "kita_test" || row.current_user !== "kita_test") {
      throw new Error("HOLD: owner session is not kita_test");
    }
    if (row.rolsuper || !row.rolcreaterole) throw new Error("HOLD: installer attributes unexpected");
    if (row.replication_role !== "origin") throw new Error("HOLD: session_replication_role is not origin");
    if (row.temp_grant !== "0") throw new Error("HOLD: temporary definer membership is present");
    if (!row.fn_oid) throw new Error("HOLD: installed recorder oid missing");
    const members = await client.query<{
      grantor: string;
      admin_option: boolean;
      inherit_option: boolean;
      set_option: boolean;
    }>(
      `SELECT grantor.rolname AS grantor, m.admin_option, m.inherit_option, m.set_option
         FROM pg_auth_members m
         JOIN pg_roles r ON r.oid = m.member
         JOIN pg_roles g ON g.oid = m.roleid
         JOIN pg_roles grantor ON grantor.oid = m.grantor
        WHERE r.rolname = 'kita_test' AND g.rolname = 'kita_refusal_definer'`,
    );
    expect(members.rows.length).toBeGreaterThan(0);
    expect(members.rows.every((m) => m.grantor !== "kita_test")).toBe(true);
    expect(
      members.rows.every((m) => m.admin_option && m.inherit_option === false && m.set_option === false),
    ).toBe(true);
    const bootstrap = members.rows.filter((m) => m.admin_option && !m.set_option && m.inherit_option === false);
    expect(bootstrap.length).toBe(members.rows.length);
    expect(row.fn_oid.length).toBeGreaterThan(0);
  });
}

async function advisoryNamespace(
  ownerUrl: string,
  expected: ReadonlyArray<{ classid: number; objid: number }>,
): Promise<
  Array<{
    database: string;
    classid: string;
    objid: string;
    objsubid: string;
    pid: number;
    granted: boolean;
    start: string | null;
  }>
> {
  return withOwnerObserver(ownerUrl, async (client) => {
    const result = await client.query<{
      database: string;
      classid: string;
      objid: string;
      objsubid: string;
      pid: number;
      granted: boolean;
      start: string | null;
    }>(
      `SELECT l.database::text AS database, l.classid::text AS classid, l.objid::text AS objid,
              l.objsubid::text AS objsubid, l.pid, l.granted,
              a.backend_start::text AS start
       FROM pg_locks l
       LEFT JOIN pg_stat_activity a ON a.pid = l.pid
       WHERE l.locktype = 'advisory'
         AND l.database = (SELECT oid FROM pg_database WHERE datname = current_database())`,
    );
    const allowed = new Set(expected.map((row) => `${row.classid}:${row.objid}`));
    return result.rows.filter(
      (row) => row.objsubid === "2" && allowed.has(`${row.classid}:${row.objid}`),
    );
  });
}

describe.skipIf(!selected)("non-money refusal atomicity PostgreSQL evidence", () => {
  let fx: RefusalPgFixtures | undefined;
  const pending: Promise<unknown>[] = [];

  beforeAll(async () => {
    /* Native preflight and fixture provisioning run after controlled evidence in the first case. */
  });

  afterAll(async () => {
    const pendingResults = await Promise.allSettled(pending);
    const closeFailures: unknown[] = [];
    if (fx) {
      const fixtures = fx;
      const first = fixtures.close();
      const concurrent = fixtures.close();
      const settled = await Promise.allSettled([first, concurrent]);
      expect(settled[0]?.status).toBe(settled[1]?.status);
      for (const result of settled) {
        if (result.status === "rejected") closeFailures.push(result.reason);
      }
      expect(() => fixtures.poolFor("postgres://kita-refusal-closed/refused")).toThrow(/fixture closing/);
      const repeated = await Promise.allSettled([fixtures.close(), fixtures.close()]);
      expect(repeated[0]?.status).toBe(settled[0]?.status);
      expect(repeated[1]?.status).toBe(settled[0]?.status);
      if (settled[0]?.status === "rejected" && settled[1]?.status === "rejected") {
        expect(settled[0].reason).toBe(settled[1].reason);
      }
    }
    if (closeFailures.length > 0) {
      const error = new Error("fixture close failed after suite");
      (error as { closeFailures?: unknown[] }).closeFailures = closeFailures;
      throw error;
    }
    void pendingResults;
  });

  it("Atomic refusal rollback on native KRF02", async () => {
    {
      let driverEnds = 0;
      let helperCloses = 0;
      let settle!: (err?: unknown) => void;
      const held = new Promise<void>((resolve, reject) => {
        settle = (err?: unknown) => (err === undefined ? resolve() : reject(err));
      });
      const pools = new Map<string, ReturnType<typeof createPool>>();
      let closing = false;
      let closeReport: Promise<void> | undefined;
      const fixtures = {
        poolFor(url: string) {
          if (closing) {
            throw new Error("HOLD: fixture closing; pool acquisition refused");
          }
          const existing = pools.get(url);
          if (existing) return existing;
          const pool = createPool(
            { databaseUrl: url, poolMax: 1 },
            {
              driver: {
                createPool() {
                  return {
                    connect: async () => ({
                      query: async () => ({ rows: [] }),
                      release() {},
                    }),
                    query: async () => ({ rows: [] }),
                    async end() {
                      driverEnds += 1;
                      await held;
                    },
                  };
                },
              },
            },
          );
          pools.set(url, pool);
          return pool;
        },
        async close() {
          closing = true;
          helperCloses += closeReport ? 0 : 1;
          if (closeReport) return closeReport;
          closeReport = (async () => {
            const owned = [...pools.values()];
            await Promise.all(owned.map((pool) => pool.close()));
          })();
          return closeReport;
        },
      };
      fixtures.poolFor("postgres://kita-refusal-fake/local");
      const firstClose = fixtures.close();
      const concurrentClose = fixtures.close();
      expect(() => fixtures.poolFor("postgres://kita-refusal-fake/other")).toThrow(/fixture closing/);
      expect(driverEnds).toBe(1);
      expect(helperCloses).toBe(1);
      const heldEnd = new Error("held-end-failed");
      settle(heldEnd);
      await expect(firstClose).rejects.toBe(heldEnd);
      await expect(concurrentClose).rejects.toBe(heldEnd);
      expect(driverEnds).toBe(1);
      expect(helperCloses).toBe(1);
      const repeated = await Promise.allSettled([fixtures.close(), fixtures.close()]);
      expect(repeated[0]?.status).toBe("rejected");
      expect(repeated[1]?.status).toBe("rejected");
      if (repeated[0]?.status === "rejected" && repeated[1]?.status === "rejected") {
        expect(repeated[0].reason).toBe(repeated[1].reason);
        expect(repeated[0].reason).toBe(heldEnd);
      }
    }
    const ownerUrl = requireRefusalOwnerUrl();
    await assertSuitePreflight(ownerUrl);
    fx = await provisionRefusalFixtures();
    if (!fx) throw new Error("fixtures missing");
    const fixtures = fx;
    expect(fixtures.poolFor(fixtures.loginA.url)).toBe(fixtures.poolFor(fixtures.loginA.url));
    const keyA = freshKey();
    const keyB = freshKey();
    const tagA = "atom-a";
    const tagB = "atom-b";
    const pool = createPool({
      databaseUrl: fx.loginA.url,
      poolMax: 2,
      statementTimeoutMs: 15_000,
      connectionTimeoutMs: 10_000,
      idleTimeoutMs: 15_000,
    });
    const afterA = timedDeferred("afterA");
    const continueB = timedDeferred("continueB");
    const observing: PoolLike = {
      async connect() {
        const client = await pool.connect();
        return {
          async query(sql: string, params?: readonly unknown[]) {
            const result = await client.query(sql, params);
            if (sql.startsWith("BEGIN")) await observeIdentity(client, fixtures.loginA.name);
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
    try {
      await expect(recordNonMoneyRefusal(observing, { idempotencyKey: keyB, requestTag: tagB })).resolves.toEqual(STORED);
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
      let aborted: unknown;
      let abortOccurred = false;
      const wrapping: PoolLike = {
        async connect() {
          if (abortOccurred) throw aborted;
          requested += 1;
          const client = await pool.connect();
          acquired += 1;
          if (abortOccurred) {
            try {
              client.release();
            } catch (releaseErr) {
              if ((typeof aborted === "object" && aborted !== null) || typeof aborted === "function") {
                notePrivate(aborted as object, releaseErr);
              } else {
                notePrivate(client, releaseErr);
              }
            }
            throw aborted;
          }
          return {
            async query(sql: string, params?: readonly unknown[]) {
              if (abortOccurred && !sql.startsWith("ROLLBACK")) throw aborted;
              if (sql.startsWith("BEGIN")) {
                const result = await client.query(sql, params);
                sequence.push("begin");
                if (abortOccurred) throw aborted;
                await observeIdentity(client, fx!.loginA.name);
                if (abortOccurred) throw aborted;
                return result;
              }
              if (sql.includes("record_non_money_refusal") && !sequence.includes("function-a")) {
                const result = await client.query(sql, params);
                if (abortOccurred) throw aborted;
                sequence.push("function-a");
                afterA.resolve();
                await continueB.promise;
                if (abortOccurred) throw aborted;
                return result;
              }
              try {
                const result = await client.query(sql, params);
                if (sql.startsWith("COMMIT")) sequence.push("commit");
                if (abortOccurred && !sql.startsWith("ROLLBACK")) throw aborted;
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
      void running.catch((err) => {
        abortOccurred = true;
        aborted = err;
        afterA.reject(err);
        continueB.reject(err);
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
        abortOccurred = true;
        aborted = err;
        continueB.reject(err);
      }
      expect(afterA.outcome()?.status).toBe("fulfilled");
      expect(helperErr).toBe(driverErr);
      expect((helperErr as { code?: string }).code).toBe("KRF02");
      expect(requested).toBe(1);
      expect(acquired).toBe(1);
      expect(sequence).toEqual(["begin", "function-a", "rollback", "release"]);
      await expect(countReservedRows(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyA)).resolves.toBe(0);
      expect(await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyB)).toEqual(rowB);
      await expect(recordNonMoneyRefusal(observing, { idempotencyKey: keyA, requestTag: tagA })).resolves.toEqual(STORED);
      const rowA = expectRow(
        await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyA),
        fx.bookA,
        fx.loginA.actorId,
        keyA,
        tagA,
      );
      await expect(recordNonMoneyRefusal(observing, { idempotencyKey: keyA, requestTag: tagA })).resolves.toEqual(STORED);
      await expect(recordNonMoneyRefusal(observing, { idempotencyKey: keyA, requestTag: "atom-a-other" })).resolves.toEqual(
        MISMATCH,
      );
      expect(await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyA)).toEqual(rowA);
      expect(await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyB)).toEqual(rowB);
    } finally {
      afterA.reject(new Error("cleanup"));
      continueB.reject(new Error("cleanup"));
      const drained = await Promise.allSettled(pending);
      void drained;
      try {
        await pool.close();
      } catch (closeErr) {
        const error = new Error("application pool close failed");
        (error as { closeFailures?: unknown[] }).closeFailures = [closeErr];
        throw error;
      }
    }
  });

  it("Native 40P01 rolls back refusal and replays the full callback", async () => {
    if (!fx) throw new Error("fixtures missing");
    const fixtures = fx;
    const keyA = freshKey();
    const keyB = freshKey();
    const tagA = "dl-a";
    const tagB = "dl-b";
    const lockA = 100000 + (randomBytes(2).readUInt16BE(0) % 50000);
    const lockB = 200000 + (randomBytes(2).readUInt16BE(0) % 50000);
    const holders = await advisoryNamespace(fx.ownerUrl, [
      { classid: lockA, objid: 1 },
      { classid: lockB, objid: 1 },
    ]);
    expect(holders.filter((row) => row.classid === String(lockA) || row.classid === String(lockB))).toHaveLength(0);
    const poolA = createPool({
      databaseUrl: fx.loginA.url,
      poolMax: 1,
      statementTimeoutMs: 20_000,
      connectionTimeoutMs: 10_000,
      idleTimeoutMs: 20_000,
    });
    const poolB = createPool({
      databaseUrl: fx.loginA.url,
      poolMax: 1,
      statementTimeoutMs: 20_000,
      connectionTimeoutMs: 10_000,
      idleTimeoutMs: 20_000,
    });
    const firstA = timedDeferred("firstA");
    const firstB = timedDeferred("firstB");
    const goSecond = timedDeferred("goSecond");
    const victimRolledBack = timedDeferred("victimRolledBack");
    const allowSurvivorCommit = timedDeferred("allowSurvivorCommit");
    const allowVictimRetry = timedDeferred("allowVictimRetry");
    const codes: Array<{
      side: "A" | "B";
      attempt: number;
      code: string;
      pid?: number | undefined;
      start?: string | undefined;
      sql?: string | undefined;
      original?: unknown;
    }> = [];
    let acquiredA = 0;
    let acquiredB = 0;
    let gatedA = 0;
    let gatedB = 0;
    const seqA: string[] = [];
    const seqB: string[] = [];
    const backends: Record<string, { pid: number; start: string }> = {};
    let victimSide: "A" | "B" | undefined;
    let victimRollbackAck = false;

    function wrap(pool: ReturnType<typeof createPool>, side: "A" | "B"): PoolLike {
      const seq = side === "A" ? seqA : seqB;
      return {
        async connect() {
          if (abortOccurred) throw persistAbort;
          if (side === "A") gatedA += 1;
          else gatedB += 1;
          const next = side === "A" ? gatedA : gatedB;
          if (next === 2) {
            await allowVictimRetry.promise;
            if (abortOccurred) throw persistAbort;
          }
          let client: Awaited<ReturnType<typeof pool.connect>>;
          try {
            client = await pool.connect();
          } catch (err) {
            const original = err;
            const entry: (typeof codes)[number] = {
              side,
              attempt: next,
              code: "",
              sql: "CONNECT",
              original,
            };
            codes.push(entry);
            try {
              const value = (original as { code?: unknown }).code;
              if (typeof value === "string") entry.code = value;
            } catch {
              /* retain original without code */
            }
            throw err;
          }
          if (side === "A") acquiredA += 1;
          else acquiredB += 1;
          const attempt = side === "A" ? acquiredA : acquiredB;
          if (abortOccurred) {
            try {
              client.release();
            } catch (releaseErr) {
              const original = releaseErr;
              const entry: (typeof codes)[number] = {
                side,
                attempt,
                code: "",
                sql: "RELEASE",
                original,
              };
              codes.push(entry);
              try {
                const value = (original as { code?: unknown }).code;
                if (typeof value === "string") entry.code = value;
              } catch {
                /* retain original without code */
              }
            }
            throw persistAbort;
          }
          let recorded = false;
          return {
            async query(sql: string, params?: readonly unknown[]) {
              if (abortOccurred && !sql.startsWith("ROLLBACK")) throw persistAbort;
              if (sql.startsWith("BEGIN")) {
                try {
                  const result = await client.query(sql, params);
                  seq.push(`begin:${attempt}`);
                  if (abortOccurred) throw persistAbort;
                  const ident = await observeIdentity(client, fixtures.loginA.name);
                  if (abortOccurred) throw persistAbort;
                  if (attempt === 1) backends[side] = ident;
                  return result;
                } catch (err) {
                  const original = err;
                  const entry: (typeof codes)[number] = {
                    side,
                    attempt,
                    code: "",
                    pid: backends[side]?.pid,
                    start: backends[side]?.start,
                    sql,
                    original,
                  };
                  codes.push(entry);
                  try {
                    const value = (original as { code?: unknown }).code;
                    if (typeof value === "string") entry.code = value;
                  } catch {
                    /* retain original without code */
                  }
                  throw err;
                }
              }
              try {
                const result = await client.query(sql, params);
                if (sql.startsWith("COMMIT")) seq.push(`commit:${attempt}`);
                if (abortOccurred && !sql.startsWith("ROLLBACK")) throw persistAbort;
                if (sql.startsWith("ROLLBACK")) {
                  seq.push(`rollback:${attempt}`);
                  if (attempt === 1 && victimSide === side) victimRollbackAck = true;
                }
                if (sql.includes("pg_advisory_xact_lock") && !recorded) {
                  seq.push(`lock1:${attempt}`);
                }
                if (sql.includes("record_non_money_refusal") && !recorded) {
                  recorded = true;
                  seq.push(`function:${attempt}`);
                  if (attempt === 1) {
                    if (side === "A") firstA.resolve();
                    else firstB.resolve();
                    await goSecond.promise;
                    if (abortOccurred) throw persistAbort;
                  }
                }
                if (sql.includes("pg_advisory_xact_lock") && recorded) {
                  seq.push(`lock2:${attempt}`);
                  if (attempt === 1) {
                    await victimRolledBack.promise;
                    if (abortOccurred) throw persistAbort;
                    await allowSurvivorCommit.promise;
                    if (abortOccurred) throw persistAbort;
                  }
                }
                return result;
              } catch (err) {
                if (sql.includes("pg_advisory_xact_lock") && recorded) {
                  seq.push(`lock2:${attempt}`);
                }
                const original = err;
                const entry: (typeof codes)[number] = {
                  side,
                  attempt,
                  code: "",
                  pid: backends[side]?.pid,
                  start: backends[side]?.start,
                  sql,
                  original,
                };
                codes.push(entry);
                try {
                  const value = (original as { code?: unknown }).code;
                  if (typeof value === "string") entry.code = value;
                } catch {
                  /* retain original without code */
                }
                if (entry.code === "40P01" && attempt === 1) victimSide = side;
                throw err;
              }
            },
            release(err?: unknown) {
              try {
                client.release(err);
                seq.push(`release:${attempt}`);
                if (attempt === 1 && victimSide === side && victimRollbackAck) {
                  victimRolledBack.resolve();
                }
              } catch (releaseErr) {
                const original = releaseErr;
                const entry: (typeof codes)[number] = {
                  side,
                  attempt,
                  code: "",
                  pid: backends[side]?.pid,
                  start: backends[side]?.start,
                  sql: "RELEASE",
                  original,
                };
                codes.push(entry);
                try {
                  const value = (original as { code?: unknown }).code;
                  if (typeof value === "string") entry.code = value;
                } catch {
                  /* retain original without code */
                }
                throw releaseErr;
              }
            },
          } satisfies PoolClientLike;
        },
        query: (sql, params) => pool.query(sql, params),
        end: () => pool.end(),
      };
    }

    let persistAbort: unknown;
    let abortOccurred = false;
    const abort = (err: unknown) => {
      if (!abortOccurred) {
        abortOccurred = true;
        persistAbort = err;
      }
      firstA.reject(persistAbort);
      firstB.reject(persistAbort);
      goSecond.reject(persistAbort);
      victimRolledBack.reject(persistAbort);
      allowSurvivorCommit.reject(persistAbort);
      allowVictimRetry.reject(persistAbort);
    };
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
    void runA.catch((err) => abort(err));
    void runB.catch((err) => abort(err));
    pending.push(runA, runB);
    try {
      await Promise.all([firstA.promise, firstB.promise]);
      await expect(countReservedRows(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyA)).resolves.toBe(0);
      await expect(countReservedRows(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyB)).resolves.toBe(0);
      const afterFirst = await advisoryNamespace(fx.ownerUrl, [
        { classid: lockA, objid: 1 },
        { classid: lockB, objid: 1 },
      ]);
      const grantedFirst = afterFirst.filter((row) => row.granted && row.objsubid === "2" && row.objid === "1");
      expect(grantedFirst).toHaveLength(2);
      expect(new Set(grantedFirst.map((row) => row.classid))).toEqual(new Set([String(lockA), String(lockB)]));
      const backendA = backends.A;
      const backendB = backends.B;
      if (!backendA || !backendB) throw new Error("missing first-attempt backend identities");
      expect(
        grantedFirst.some((row) => row.pid === backendA.pid && row.start === backendA.start),
      ).toBe(true);
      expect(
        grantedFirst.some((row) => row.pid === backendB.pid && row.start === backendB.start),
      ).toBe(true);
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
      if (!victimBackend) throw new Error("missing victim backend identity");
      expect(victimBackend.pid).toBeGreaterThan(0);
      const leftover = await advisoryNamespace(fx.ownerUrl, [
        { classid: lockA, objid: 1 },
        { classid: lockB, objid: 1 },
      ]);
      const survivorSide = victimSide === "A" ? "B" : "A";
      const survivorBackend = backends[survivorSide];
      if (!survivorBackend) throw new Error("missing survivor backend identity");
      const grantedLeftover = leftover.filter(
        (row) => row.granted && row.objsubid === "2" && row.objid === "1",
      );
      expect(
        leftover.filter(
          (row) => row.pid === victimBackend.pid && row.start === victimBackend.start,
        ),
      ).toHaveLength(0);
      expect(grantedLeftover).toHaveLength(2);
      expect(new Set(grantedLeftover.map((row) => row.classid))).toEqual(new Set([String(lockA), String(lockB)]));
      for (const lock of grantedLeftover) {
        expect(lock.pid).toBe(survivorBackend.pid);
        expect(lock.start).toBe(survivorBackend.start);
      }
      allowSurvivorCommit.resolve();
      const settled = await Promise.race([
        runA.then((body) => ({ side: "A" as const, body })),
        runB.then((body) => ({ side: "B" as const, body })),
      ]);
      expect(settled.body).toEqual(STORED);
      const survivorKey = settled.side === "A" ? keyA : keyB;
      const survivorTag = settled.side === "A" ? tagA : tagB;
      const victimKey = settled.side === "A" ? keyB : keyA;
      const survivorRow = expectRow(
        await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, survivorKey),
        fx.bookA,
        fx.loginA.actorId,
        survivorKey,
        survivorTag,
      );
      await expect(countReservedRows(fx.ownerUrl, fx.bookA, fx.loginA.actorId, victimKey)).resolves.toBe(0);
      allowVictimRetry.resolve();
      await expect(runA).resolves.toEqual(STORED);
      await expect(runB).resolves.toEqual(STORED);
      expect(acquiredA + acquiredB).toBe(3);
      expect(gatedA).toBe(acquiredA);
      expect(gatedB).toBe(acquiredB);
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
      if (settled.side === "A") {
        expect(rowA).toEqual(survivorRow);
      } else {
        expect(rowB).toEqual(survivorRow);
      }
      const replayRaw = createPool({
        databaseUrl: fx.loginA.url,
        poolMax: 2,
        statementTimeoutMs: 15_000,
        connectionTimeoutMs: 10_000,
        idleTimeoutMs: 15_000,
      });
      const replay: PoolLike = {
        async connect() {
          const client = await replayRaw.connect();
          return {
            async query(sql: string, params?: readonly unknown[]) {
              const result = await client.query(sql, params);
              if (sql.startsWith("BEGIN")) await observeIdentity(client, fixtures.loginA.name);
              return result;
            },
            release(err?: unknown) {
              client.release(err);
            },
          } satisfies PoolClientLike;
        },
        query: (sql, params) => replayRaw.query(sql, params),
        end: () => replayRaw.end(),
      };
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
        await replayRaw.close();
      }
      expect(
        await advisoryNamespace(fx.ownerUrl, [
          { classid: lockA, objid: 1 },
          { classid: lockB, objid: 1 },
        ]),
      ).toHaveLength(0);
      expect(await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyA)).toEqual(rowA);
      expect(await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyB)).toEqual(rowB);
      const victimSeq = victimSide === "A" ? seqA : seqB;
      const survivorSeq = victimSide === "A" ? seqB : seqA;
      expect(survivorSeq).toEqual(["begin:1", "lock1:1", "function:1", "lock2:1", "commit:1", "release:1"]);
      expect(victimSeq).toEqual([
        "begin:1",
        "lock1:1",
        "function:1",
        "lock2:1",
        "rollback:1",
        "release:1",
        "begin:2",
        "lock1:2",
        "function:2",
        "lock2:2",
        "commit:2",
        "release:2",
      ]);
      expect(codes).toHaveLength(1);
      expect(codes.filter((c) => c.code === "40P01")).toHaveLength(1);
      expect(codes[0]?.code).toBe("40P01");
      expect(codes[0]?.attempt).toBe(1);
      expect(codes[0]?.side).toBe(victimSide);
      const firstAttemptA = backends.A;
      const firstAttemptB = backends.B;
      if (!firstAttemptA || !firstAttemptB) throw new Error("missing first-attempt backend identities");
      expect(firstAttemptA.pid !== firstAttemptB.pid || firstAttemptA.start !== firstAttemptB.start).toBe(true);
    } catch (err) {
      abort(err);
      throw err;
    } finally {
      abort(new Error("cleanup"));
      await Promise.allSettled([runA, runB]);
      const closes = await Promise.allSettled([poolA.close(), poolB.close()]);
      const failed = closes.filter((result): result is PromiseRejectedResult => result.status === "rejected");
      if (failed.length > 0) {
        const error = new Error("application pool close failed");
        (error as { closeFailures?: unknown[] }).closeFailures = failed.map((result) => result.reason);
        throw error;
      }
    }
  });
});
