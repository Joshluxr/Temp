import { createHash, randomBytes } from "node:crypto";
import { isProxy } from "node:util/types";
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

const ARRAY_ITERATOR = [][Symbol.iterator];

type FailureEntry = {
  side: "A" | "B";
  attempt: number;
  code: string;
  pid?: number | undefined;
  start?: string | undefined;
  sql?: string | undefined;
  params?: unknown[];
  original?: unknown;
};

function snapshotTrustedParams(params: unknown): unknown[] | undefined {
  if (!Array.isArray(params) || isProxy(params)) return undefined;
  const proto = Object.getPrototypeOf(params);
  if (proto !== Array.prototype || isProxy(proto)) return undefined;
  const ownIter = Object.getOwnPropertyDescriptor(params, Symbol.iterator);
  if (ownIter) return undefined;
  const iter = Object.getOwnPropertyDescriptor(Array.prototype, Symbol.iterator);
  if (
    !iter ||
    Object.prototype.hasOwnProperty.call(iter, "get") ||
    Object.prototype.hasOwnProperty.call(iter, "set") ||
    iter.value !== ARRAY_ITERATOR
  ) {
    return undefined;
  }
  const lenDesc = Object.getOwnPropertyDescriptor(params, "length");
  if (
    !lenDesc ||
    Object.prototype.hasOwnProperty.call(lenDesc, "get") ||
    Object.prototype.hasOwnProperty.call(lenDesc, "set") ||
    typeof lenDesc.value !== "number" ||
    !Number.isInteger(lenDesc.value) ||
    lenDesc.value < 0
  ) {
    return undefined;
  }
  const copy: unknown[] = [];
  for (let i = 0; i < lenDesc.value; i += 1) {
    const desc = Object.getOwnPropertyDescriptor(params, i);
    if (
      !desc ||
      Object.prototype.hasOwnProperty.call(desc, "get") ||
      Object.prototype.hasOwnProperty.call(desc, "set") ||
      !Object.prototype.hasOwnProperty.call(desc, "value")
    ) {
      return undefined;
    }
    copy.push(desc.value);
  }
  return copy;
}

function firstAttemptStagesOrdered(seq: readonly string[]): boolean {
  const lock2 = seq.indexOf("lock2:1");
  const prefix = lock2 === -1 ? seq : seq.slice(0, lock2);
  if (prefix.some((step) => step === "commit:1" || step === "rollback:1" || step === "release:1")) {
    return false;
  }
  return prefix[0] === "begin:1" && prefix[1] === "lock1:1" && prefix[2] === "function:1" && prefix.length === 3;
}

const LOGIN_OID = Symbol.for("kita.non-money-refusal.login-oid");

function expectedLoginOid(login: { readonly name: string }): string {
  const oid = (login as Record<symbol, unknown>)[LOGIN_OID];
  if (typeof oid !== "string" || oid.length === 0) {
    throw new Error("HOLD: independently retained login oid missing");
  }
  return oid;
}

function proofMatches(entry: FailureEntry, proof: FailureEntry): boolean {
  if (
    entry.original !== proof.original ||
    entry.code !== proof.code ||
    entry.sql !== proof.sql ||
    entry.side !== proof.side ||
    entry.attempt !== proof.attempt ||
    entry.pid !== proof.pid ||
    entry.start !== proof.start
  ) {
    return false;
  }
  const left = entry.params;
  const right = proof.params;
  if (left === right) return true;
  if (!left || !right || left.length !== right.length) return false;
  for (let i = 0; i < left.length; i += 1) {
    if (left[i] !== right[i]) return false;
  }
  return true;
}

function exactOriginalLedger(
  codes: readonly FailureEntry[],
  retained: FailureEntry | undefined,
  proof?: FailureEntry,
): boolean {
  if (retained === undefined || proof === undefined || codes.length !== 1 || codes[0] !== retained) {
    return false;
  }
  return proofMatches(retained, proof);
}

function classifyVictimOpposingLock(input: {
  driverAcked: boolean;
  persistAbort: unknown;
  original: unknown;
  victimEntry: FailureEntry | undefined;
  codes: readonly FailureEntry[];
  entry: FailureEntry;
  attempt: number;
  requestedAttempt: number;
  firstLockAck: boolean;
  recorderAck: boolean;
  seq: readonly string[];
  sql: string;
  forwardedAtCall: unknown[] | undefined;
  opposing: readonly unknown[];
  pid: number | undefined;
  start: string | undefined;
  expectedLogin: string;
  expectedOid: string;
  observedLogin: string | undefined;
  observedOid: string | undefined;
  coordinationCompleted: boolean;
}): boolean {
  return (
    !input.driverAcked &&
    input.original !== input.persistAbort &&
    input.victimEntry === undefined &&
    input.codes.length === 1 &&
    input.codes[0] === input.entry &&
    input.entry.code === "40P01" &&
    input.attempt === 1 &&
    input.requestedAttempt === 1 &&
    input.attempt === input.requestedAttempt &&
    input.firstLockAck &&
    input.recorderAck &&
    input.coordinationCompleted &&
    firstAttemptStagesOrdered(input.seq) &&
    input.sql === "SELECT pg_advisory_xact_lock($1, $2)" &&
    input.forwardedAtCall !== undefined &&
    input.forwardedAtCall.length === 2 &&
    input.forwardedAtCall[0] === input.opposing[0] &&
    input.forwardedAtCall[1] === input.opposing[1] &&
    input.pid !== undefined &&
    input.start !== undefined &&
    input.expectedOid.length > 0 &&
    input.observedOid === input.expectedOid &&
    input.observedLogin === input.expectedLogin
  );
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

async function boundedWait(work: Promise<unknown>, name: string, ms: number): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      work,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`timeout:${name}`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
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
  proofOk?: () => boolean,
): Promise<ReservedRow | undefined> {
  return withOwnerObserver(ownerUrl, async (client) => {
    const result = await client.query<ReservedRow>(
      `SELECT id::text, book_id::text, actor_id, operation, key, request_hash, state,
              resource_id::text, response, created_at::text
       FROM kita.command_keys
       WHERE book_id = $1 AND actor_id = $2 AND operation = 'recordNonMoneyRefusal.v1' AND key = $3`,
      [bookId, actorId, key],
    );
    if (proofOk && !proofOk()) throw new Error("HOLD: row observed after ambiguous ledger");
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
  expectedOid: string,
  proofOk: () => boolean,
): Promise<{ pid: number; start: string; oid: string }> {
  if (!proofOk()) throw new Error("HOLD: identity observed after ambiguous ledger");
  let ident;
  try {
    ident = await client.query(
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
  } catch (err) {
    try {
      if (!proofOk()) throw new Error("HOLD: identity observed after ambiguous ledger");
    } catch (abortErr) {
      throw abortErr;
    }
    throw err;
  }
  if (!proofOk()) throw new Error("HOLD: identity observed after ambiguous ledger");
  if (ident.rows.length !== 1) {
    throw new Error("HOLD: authenticated identity cardinality is not one");
  }
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
  if (typeof expectedOid !== "string" || expectedOid.length === 0 || row.login_oid !== expectedOid) {
    throw new Error("HOLD: actual login oid does not match independently expected oid");
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
  if (statementMs > 15_000 || lockMs > 15_000 || deadlockMs > 15_000) {
    throw new Error("HOLD: timeout budgets exceed the 15-second observation window");
  }
  return { pid, start: row.start, oid: row.login_oid };
}

async function assertSuitePreflight(ownerUrl: string): Promise<void> {
  await withOwnerObserver(ownerUrl, async (client) => {
    const preflight = await client.query<{
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
    );
    if (preflight.rows.length !== 1) throw new Error("HOLD: suite preflight cardinality is not one");
    const row = preflight.rows[0];
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
    const expectedGrantor = "kita_refusal_definer";
    if (members.rows.length !== 1) throw new Error("HOLD: definer membership cardinality is not one");
    if (members.rows.some((m) => m.grantor !== expectedGrantor)) {
      throw new Error("HOLD: unexpected definer grantor");
    }
    if (
      members.rows.some(
        (m) => !(m.admin_option && m.inherit_option === false && m.set_option === false),
      )
    ) {
      throw new Error("HOLD: unexpected definer membership options");
    }
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
    const allowed = new Set(expected.map((row) => `${row.classid}:${row.objid}:2`));
    const outsiders = result.rows.filter(
      (row) => !allowed.has(`${row.classid}:${row.objid}:${row.objsubid}`),
    );
    if (outsiders.length > 0) {
      throw new Error("HOLD: unexpected advisory lock participants");
    }
    return result.rows;
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
      notePrivate(error, closeFailures);
      throw error;
    }
    void pendingResults;
  });

  it("Atomic refusal rollback on native KRF02", async () => {
    {
      const lockA = 11;
      const lockB = 22;
      for (const side of ["A", "B"] as const) {
        const opposing = side === "A" ? [lockB, 1] : [lockA, 1];
        const sql = "SELECT pg_advisory_xact_lock($1, $2)";
        const original = { code: "40P01" };
        const entry: FailureEntry = {
          side,
          attempt: 1,
          code: "40P01",
          pid: 100 + (side === "A" ? 1 : 2),
          start: "2026-01-01",
          sql,
          params: opposing,
          original,
        };
        const codes = [entry];
        const valid = {
          driverAcked: false,
          persistAbort: undefined,
          original,
          victimEntry: undefined as FailureEntry | undefined,
          codes,
          entry,
          attempt: 1,
          requestedAttempt: 1,
          firstLockAck: true,
          recorderAck: true,
          seq: ["begin:1", "lock1:1", "function:1"],
          sql,
          forwardedAtCall: opposing.slice(),
          opposing,
          pid: entry.pid,
          start: entry.start,
          expectedLogin: "kita_refusal_test_a",
          expectedOid: "20001",
          observedLogin: "kita_refusal_test_a",
          observedOid: "20001",
          coordinationCompleted: true,
        };
        expect(classifyVictimOpposingLock(valid)).toBe(true);
        expect(exactOriginalLedger(codes, entry, { side: entry.side, attempt: entry.attempt, code: entry.code, pid: 100 + (side === "A" ? 1 : 2), start: "2026-01-01", sql, params: opposing, original })).toBe(true);
        expect(snapshotTrustedParams([lockA, 1])).toEqual([lockA, 1]);
        expect(snapshotTrustedParams(Object.assign([lockA, 1], { [Symbol.iterator]: function* () { yield 0; } }))).toBeUndefined();
        let inheritedInvoked = false;
        const parent = Object.create(Array.prototype);
        Object.defineProperty(parent, Symbol.iterator, {
          get() {
            inheritedInvoked = true;
            return ARRAY_ITERATOR;
          },
        });
        const inheritedArray = [opposing[0], opposing[1]];
        Object.setPrototypeOf(inheritedArray, parent);
        expect(snapshotTrustedParams(inheritedArray)).toBeUndefined();
        expect(inheritedInvoked).toBe(false);
        const protoIter = Object.create(Array.prototype, {
          [Symbol.iterator]: { value: function* () { yield 9; } },
        });
        protoIter[0] = opposing[0];
        protoIter[1] = opposing[1];
        protoIter.length = 2;
        expect(snapshotTrustedParams(protoIter)).toBeUndefined();
        const getterParams: unknown[] = [];
        Object.defineProperty(getterParams, "length", { value: 2 });
        Object.defineProperty(getterParams, "0", { get: () => opposing[0] });
        Object.defineProperty(getterParams, "1", { get: () => opposing[1] });
        expect(snapshotTrustedParams(getterParams)).toBeUndefined();
        expect(classifyVictimOpposingLock({ ...valid, driverAcked: true })).toBe(false);
        expect(classifyVictimOpposingLock({ ...valid, firstLockAck: false })).toBe(false);
        expect(classifyVictimOpposingLock({ ...valid, recorderAck: false })).toBe(false);
        expect(classifyVictimOpposingLock({ ...valid, coordinationCompleted: false })).toBe(false);
        expect(
          classifyVictimOpposingLock({ ...valid, seq: ["begin:1", "lock1:1", "function:1", "commit:1"] }),
        ).toBe(false);
        expect(classifyVictimOpposingLock({ ...valid, seq: ["lock1:1", "begin:1", "function:1"] })).toBe(false);
        expect(classifyVictimOpposingLock({ ...valid, seq: ["begin:1", "function:1", "lock1:1"] })).toBe(false);
        expect(classifyVictimOpposingLock({ ...valid, requestedAttempt: 2 })).toBe(false);
        expect(classifyVictimOpposingLock({ ...valid, observedOid: "9" })).toBe(false);
        expect(classifyVictimOpposingLock({ ...valid, forwardedAtCall: [lockA, 1] })).toBe(side === "B");
        const extra = { ...entry, code: "XX001" as const };
        expect(exactOriginalLedger([entry, extra], entry, { side: entry.side, attempt: entry.attempt, code: entry.code })).toBe(false);
        expect(classifyVictimOpposingLock({ ...valid, codes: [entry, extra] })).toBe(false);
        const abortToken = {};
        expect(classifyVictimOpposingLock({ ...valid, persistAbort: abortToken, original: abortToken })).toBe(false);
      }
      const mutating = [11, 1];
      const snap = snapshotTrustedParams(mutating);
      mutating[0] = 99;
      expect(snap).toEqual([11, 1]);
    }
    {
      let driverEnds = 0;
      let settle!: (err?: unknown) => void;
      let sawEnd!: () => void;
      const held = new Promise<void>((resolve, reject) => {
        settle = (err?: unknown) => (err === undefined ? resolve() : reject(err));
      });
      void held.then(
        () => undefined,
        () => undefined,
      );
      const endStarted = new Promise<void>((resolve) => {
        sawEnd = resolve;
      });
      const heldEnd = new Error("held-end-failed");
      const previousOwnerUrl = process.env.KITA_REFUSAL_TEST_OWNER_URL;
      const OriginalClient = pg.Client;
      const originalPool = (pg as { Pool?: unknown }).Pool;
      let bookSeq = 0;
      let roleSeq = 0;
      const issuedOids = new Map<string, string>();
      const executedCreates = new Set<string>();
      const executedGrants = new Set<string>();
      const issuedBooks: Array<{ id: string; status: string; legal: string }> = [];
      const issuedBindings: Array<{
        login_name: string;
        login_oid: string;
        book_id: string;
        actor_id: string;
      }> = [];
      const fakeQuery = async (sql: string, params?: readonly unknown[]) => {
        if (sql.includes("server_version_num") || sql.includes("session_replication_role")) {
          return {
            rows: [
              {
                server_version_num: "180006",
                current_database: "kita_core_test",
                session_user: "kita_test",
                current_user: "kita_test",
                schema_owner: "kita_test",
                fsync: "on",
                full_page_writes: "on",
                synchronous_commit: "on",
                rolsuper: false,
                rolcreaterole: true,
                replication_role: "origin",
                fn_owner: "kita_refusal_definer",
                fn_hash: "a6140caff93ff7a014ee33ae6c32bb669f8bd75322580fdaafc9c3179f76898a",
                fn_len: "3950",
                prosecdef: true,
                temp_grant: "0",
              },
            ],
          };
        }
        if (sql.includes("SELECT version()")) return { rows: [{ version: "PostgreSQL 18.6" }] };
        if (sql.includes("INSERT INTO kita.books")) {
          bookSeq += 1;
          const id = `00000000-0000-4000-8000-${String(bookSeq).padStart(12, "0")}`;
          issuedBooks.push({ id, status: "disabled", legal: String(params?.[0] ?? "") });
          return { rows: [{ id }] };
        }
        if (sql.includes("CREATE ROLE %I")) {
          const loginName = String(params?.[0] ?? "");
          return {
            rows: [
              {
                sql: `CREATE ROLE "${loginName}" LOGIN PASSWORD 'redacted' NOSUPERUSER NOCREATEDB NOCREATEROLE INHERIT NOREPLICATION NOBYPASSRLS`,
              },
            ],
          };
        }
        if (sql.includes("GRANT kita_refusal_recorder TO %I")) {
          const loginName = String(params?.[0] ?? "");
          return {
            rows: [
              {
                sql: `GRANT kita_refusal_recorder TO "${loginName}" WITH INHERIT TRUE, SET FALSE`,
              },
            ],
          };
        }
        const createExec = /^CREATE ROLE "([A-Za-z0-9_]+)" LOGIN PASSWORD 'redacted' NOSUPERUSER NOCREATEDB NOCREATEROLE INHERIT NOREPLICATION NOBYPASSRLS$/.exec(
          sql,
        );
        if (createExec?.[1]) {
          executedCreates.add(createExec[1]);
          return { rows: [], rowCount: 0 };
        }
        const grantExec = /^GRANT kita_refusal_recorder TO "([A-Za-z0-9_]+)" WITH INHERIT TRUE, SET FALSE$/.exec(sql);
        if (grantExec?.[1]) {
          if (!executedCreates.has(grantExec[1])) {
            throw new Error("HOLD: GRANT executed before CREATE");
          }
          executedGrants.add(grantExec[1]);
          return { rows: [], rowCount: 0 };
        }
        if ((sql.includes("CREATE ROLE") && !sql.includes("%I")) || (sql.includes("GRANT kita_refusal_recorder") && !sql.includes("%I"))) {
          throw new Error("HOLD: unrecognized CREATE/GRANT mutation");
        }
        if (sql.includes("INSERT INTO kita.non_money_refusal_principals")) {
          const bookId = String(params?.[0] ?? "");
          const actorId = String(params?.[1] ?? "");
          const loginName = String(params?.[2] ?? "");
          const loginOid = issuedOids.get(loginName);
          if (!loginOid) throw new Error("HOLD: principal insert name is not issued");
          issuedBindings.push({ login_name: loginName, login_oid: loginOid, book_id: bookId, actor_id: actorId });
          return { rowCount: 1, rows: [] };
        }
        if (sql.includes("oid::text AS oid") || sql.includes("AS oid FROM pg_catalog.pg_roles")) {
          const loginName = String(params?.[0] ?? "");
          if (!executedCreates.has(loginName)) return { rows: [], rowCount: 0 };
          const existing = issuedOids.get(loginName);
          if (existing) return { rows: [{ oid: existing }] };
          roleSeq += 1;
          const oid = String(20_000 + roleSeq);
          issuedOids.set(loginName, oid);
          return { rows: [{ oid }] };
        }
        if (sql.includes("FROM kita.books WHERE id = ANY")) {
          const wanted = new Set((params?.[0] as string[] | undefined) ?? []);
          return {
            rows: issuedBooks
              .filter((book) => wanted.has(book.id))
              .map((book) => ({ id: book.id, status: book.status })),
          };
        }
        if (sql.includes("FROM kita.non_money_refusal_principals")) {
          const wanted = new Set((params?.[0] as string[] | undefined) ?? []);
          return { rows: issuedBindings.filter((row) => wanted.has(row.login_name)) };
        }
        if (sql.includes("pg_auth_members") && sql.includes("kita_refusal_recorder")) {
          return {
            rows: [...executedGrants].map((name) => ({
              member: name,
              member_oid: issuedOids.get(name),
              role: "kita_refusal_recorder",
              grantor: "kita_test",
              admin_option: false,
              inherit_option: true,
              set_option: false,
            })),
          };
        }
        return { rows: [], rowCount: 0 };
      };
      class FakeClient {
        async connect() {}
        async end() {}
        query(sql: string, params?: readonly unknown[]) {
          return fakeQuery(sql, params);
        }
      }
      class FakePool {
        async connect() {
          return {
            query(sql: string, params?: readonly unknown[]) {
              return fakeQuery(sql, params);
            },
            release() {},
          };
        }
        query(sql: string, params?: readonly unknown[]) {
          return fakeQuery(sql, params);
        }
        async end() {
          driverEnds += 1;
          sawEnd();
          await held;
        }
      }
      process.env.KITA_REFUSAL_TEST_OWNER_URL = "postgres://kita_test@127.0.0.1:54339/kita_core_test";
      (pg as { Client: unknown }).Client = FakeClient;
      (pg as { Pool: unknown }).Pool = FakePool;
      let fixtures: RefusalPgFixtures | undefined;
      let firstClose: Promise<void> | undefined;
      let concurrentClose: Promise<void> | undefined;
      try {
        fixtures = await provisionRefusalFixtures();
        fixtures.poolFor(fixtures.loginA.url);
        firstClose = fixtures.close();
        const firstObserved = firstClose.then(
          () => undefined,
          (err: unknown) => err,
        );
        concurrentClose = fixtures.close();
        const concurrentObserved = concurrentClose.then(
          () => undefined,
          (err: unknown) => err,
        );
        expect(() => fixtures!.poolFor("postgres://kita_test@127.0.0.1:54339/kita_core_test")).toThrow(
          /fixture closing/,
        );
        await boundedWait(endStarted, "driver-end-start", 20_000);
        expect(driverEnds).toBe(1);
        settle(heldEnd);
        const shared = await firstObserved;
        expect(shared).toBeInstanceOf(Error);
        expect((shared as Error).message).toMatch(/cleanup failed/);
        expect(await concurrentObserved).toBe(shared);
        expect(driverEnds).toBe(1);
        const repeated = await Promise.allSettled([fixtures.close(), fixtures.close()]);
        expect(repeated[0]?.status).toBe("rejected");
        expect(repeated[1]?.status).toBe("rejected");
        if (repeated[0]?.status === "rejected" && repeated[1]?.status === "rejected") {
          expect(repeated[0].reason).toBe(repeated[1].reason);
          expect(repeated[0].reason).toBe(shared);
        }
      } finally {
        settle(heldEnd);
        await Promise.allSettled([
          held,
          driverEnds > 0 ? endStarted : Promise.resolve(),
          firstClose ?? Promise.resolve(),
          concurrentClose ?? Promise.resolve(),
          fixtures?.close() ?? Promise.resolve(),
        ]);
        (pg as { Client: unknown }).Client = OriginalClient;
        if (originalPool === undefined) delete (pg as { Pool?: unknown }).Pool;
        else (pg as { Pool: unknown }).Pool = originalPool;
        if (previousOwnerUrl === undefined) delete process.env.KITA_REFUSAL_TEST_OWNER_URL;
        else process.env.KITA_REFUSAL_TEST_OWNER_URL = previousOwnerUrl;
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
    let setupSessionOpen = true;
    let abortOccurred = false;
    let aborted: unknown;
    const observing: PoolLike = {
      async connect() {
        const client = await pool.connect();
        return {
          async query(sql: string, params?: readonly unknown[]) {
            const result = await client.query(sql, params);
            if (sql.startsWith("BEGIN")) {
              await observeIdentity(client, fixtures.loginA.name, expectedLoginOid(fixtures.loginA), () => {
                if (!setupSessionOpen) throw new Error("HOLD: setup identity after setup session");
                if (abortOccurred) throw aborted;
                return true;
              });
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
    try {
      await expect(recordNonMoneyRefusal(observing, { idempotencyKey: keyB, requestTag: tagB })).resolves.toEqual(STORED);
      setupSessionOpen = false;
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
                await observeIdentity(client, fx!.loginA.name, expectedLoginOid(fx!.loginA), () => {
                  if (abortOccurred) throw aborted;
                  return true;
                });
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
      params?: unknown[];
      original?: unknown;
    }> = [];
    let acquiredA = 0;
    let acquiredB = 0;
    let gatedA = 0;
    let gatedB = 0;
    const seqA: string[] = [];
    const seqB: string[] = [];
    const backends: Record<string, { pid: number; start: string; oid: string }> = {};
    let victimSide: "A" | "B" | undefined;
    let victimEntry: (typeof codes)[number] | undefined;
    let victimProof: FailureEntry | undefined;
    let victimRollbackAck = false;
    let coordinationCompleted = false;

    function phaseLedgerOk(attempt: number): boolean {
      if (attempt === 1) {
        return (
          codes.length === 0 &&
          victimSide === undefined &&
          victimEntry === undefined &&
          victimProof === undefined &&
          !coordinationCompleted &&
          !victimRollbackAck
        );
      }
      return exactOriginalLedger(codes, victimEntry, victimProof);
    }

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
            if (!exactOriginalLedger(codes, victimEntry, victimProof)) throw persistAbort ?? new Error("HOLD: retry permission after ambiguous ledger");
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
            } catch (snapshotErr) {
              notePrivate(entry, snapshotErr);
              if ((typeof original === "object" && original !== null) || typeof original === "function") {
                notePrivate(original as object, snapshotErr);
              }
            }
            throw err;
          }
          if (next === 2 && !exactOriginalLedger(codes, victimEntry, victimProof)) {
            try {
              client.release();
            } catch (releaseErr) {
              notePrivate(client, releaseErr);
            }
            throw persistAbort ?? new Error("HOLD: checkout after ambiguous ledger");
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
              } catch (snapshotErr) {
                notePrivate(entry, snapshotErr);
                if ((typeof original === "object" && original !== null) || typeof original === "function") {
                  notePrivate(original as object, snapshotErr);
                }
              }
            }
            throw persistAbort;
          }
          let recorded = false;
          let firstLockAck = false;
          let recorderAck = false;
          return {
            async query(sql: string, params?: readonly unknown[]) {
              const callOwner: { sql: string; issued: boolean } = { sql, issued: false };
              notePrivate(client, callOwner);
              let forwardedAtCall: unknown[] | undefined;
              try {
                forwardedAtCall = snapshotTrustedParams(params);
              } catch (snapshotErr) {
                notePrivate(callOwner, snapshotErr);
                notePrivate(client, snapshotErr);
                notePrivate(codes, snapshotErr);
                forwardedAtCall = undefined;
                throw snapshotErr;
              }
              if (abortOccurred && !sql.startsWith("ROLLBACK")) throw persistAbort;
              if (sql.startsWith("BEGIN")) {
                try {
                  if (!phaseLedgerOk(attempt)) {
                    throw persistAbort ?? new Error("HOLD: BEGIN after ambiguous ledger");
                  }
                  callOwner.issued = true;
                  const result = await client.query(sql, params);
                  seq.push(`begin:${attempt}`);
                  if (!phaseLedgerOk(attempt)) {
                    throw persistAbort ?? new Error("HOLD: BEGIN result after ambiguous ledger");
                  }
                  if (abortOccurred) throw persistAbort;
                  const ident = await observeIdentity(
                    client,
                    fixtures.loginA.name,
                    expectedLoginOid(fixtures.loginA),
                    () => {
                      if (abortOccurred) throw persistAbort;
                      return phaseLedgerOk(attempt);
                    },
                  );
                  if (!phaseLedgerOk(attempt)) {
                    throw persistAbort ?? new Error("HOLD: identity after ambiguous ledger");
                  }
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
                  } catch (snapshotErr) {
                    notePrivate(entry, snapshotErr);
                    if ((typeof original === "object" && original !== null) || typeof original === "function") {
                      notePrivate(original as object, snapshotErr);
                    }
                  }
                  throw err;
                }
              }
              if (sql.startsWith("COMMIT") && !exactOriginalLedger(codes, victimEntry, victimProof)) {
                throw persistAbort ?? new Error("HOLD: COMMIT after ambiguous ledger");
              }
              let driverAcked = false;
              try {
                callOwner.issued = true;
                const result = await client.query(sql, params);
                driverAcked = true;
                if (sql.startsWith("COMMIT")) {
                  if (!exactOriginalLedger(codes, victimEntry, victimProof)) {
                    throw persistAbort ?? new Error("HOLD: COMMIT result after ambiguous ledger");
                  }
                  seq.push(`commit:${attempt}`);
                }
                if (sql.startsWith("ROLLBACK")) {
                  seq.push(`rollback:${attempt}`);
                  if (attempt === 1 && victimSide === side) victimRollbackAck = true;
                }
                const ownFirst = side === "A" ? [lockA, 1] : [lockB, 1];
                const recorderParams = side === "A" ? [keyA, tagA] : [keyB, tagB];
                if (
                  sql === "SELECT pg_advisory_xact_lock($1, $2)" &&
                  forwardedAtCall !== undefined &&
                  forwardedAtCall.length === 2 &&
                  forwardedAtCall[0] === ownFirst[0] &&
                  forwardedAtCall[1] === ownFirst[1]
                ) {
                  firstLockAck = true;
                  seq.push(`lock1:${attempt}`);
                }
                if (
                  sql === "SELECT kita.record_non_money_refusal($1,$2) AS body" &&
                  forwardedAtCall !== undefined &&
                  forwardedAtCall.length === 2 &&
                  forwardedAtCall[0] === recorderParams[0] &&
                  forwardedAtCall[1] === recorderParams[1] &&
                  firstLockAck
                ) {
                  recorded = true;
                  recorderAck = true;
                  seq.push(`function:${attempt}`);
                  if (attempt === 1) {
                    if (side === "A") firstA.resolve();
                    else firstB.resolve();
                    await goSecond.promise;
                    coordinationCompleted = true;
                    if (abortOccurred) throw persistAbort;
                  }
                }
                const opposingSuccess = side === "A" ? [lockB, 1] : [lockA, 1];
                if (
                  sql === "SELECT pg_advisory_xact_lock($1, $2)" &&
                  recorded &&
                  recorderAck &&
                  forwardedAtCall !== undefined &&
                  forwardedAtCall.length === 2 &&
                  forwardedAtCall[0] === opposingSuccess[0] &&
                  forwardedAtCall[1] === opposingSuccess[1]
                ) {
                  seq.push(`lock2:${attempt}`);
                  if (attempt === 1) {
                    await victimRolledBack.promise;
                    if (abortOccurred) throw persistAbort;
                    await allowSurvivorCommit.promise;
                    if (!exactOriginalLedger(codes, victimEntry, victimProof)) {
                      throw persistAbort ?? new Error("HOLD: survivor commit after ambiguous ledger");
                    }
                    if (abortOccurred) throw persistAbort;
                  }
                } else if (
                  sql === "SELECT pg_advisory_xact_lock($1, $2)" &&
                  recorded &&
                  recorderAck &&
                  attempt === 1
                ) {
                  throw persistAbort ?? new Error("HOLD: successful opposing lock used exact unexpected parameters");
                }
                if (abortOccurred && !sql.startsWith("ROLLBACK")) throw persistAbort;
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
                notePrivate(callOwner, original);
                notePrivate(entry, callOwner);
                try {
                  if (forwardedAtCall !== undefined) entry.params = forwardedAtCall;
                  const value = (original as { code?: unknown }).code;
                  if (typeof value === "string") entry.code = value;
                } catch (snapshotErr) {
                  notePrivate(callOwner, snapshotErr);
                  notePrivate(entry, snapshotErr);
                  if ((typeof original === "object" && original !== null) || typeof original === "function") {
                    notePrivate(original as object, snapshotErr);
                  }
                  throw original;
                }
                const opposing = side === "A" ? [lockB, 1] : [lockA, 1];
                if (
                  classifyVictimOpposingLock({
                    driverAcked,
                    persistAbort,
                    original,
                    victimEntry,
                    codes,
                    entry,
                    attempt,
                    requestedAttempt: next,
                    firstLockAck,
                    recorderAck,
                    seq,
                    sql,
                    forwardedAtCall,
                    opposing,
                    pid: backends[side]?.pid,
                    start: backends[side]?.start,
                    expectedLogin: fixtures.loginA.name,
                    expectedOid: expectedLoginOid(fixtures.loginA),
                    observedLogin: fixtures.loginA.name,
                    observedOid: backends[side]?.oid,
                    coordinationCompleted,
                  })
                ) {
                  seq.push(`lock2:${attempt}`);
                  victimSide = side;
                  victimEntry = entry;
                  victimProof = { side: entry.side, attempt: entry.attempt, code: entry.code };
                  if (entry.pid !== undefined) victimProof.pid = entry.pid;
                  if (entry.start !== undefined) victimProof.start = entry.start;
                  if (entry.sql !== undefined) victimProof.sql = entry.sql;
                  if (entry.params !== undefined) victimProof.params = entry.params.slice();
                  if (entry.original !== undefined) victimProof.original = entry.original;
                  if (victimProof.params) Object.freeze(victimProof.params);
                  Object.freeze(victimProof);
                } else if (sql === "SELECT pg_advisory_xact_lock($1, $2)" && recorded && !driverAcked) {
                  seq.push(`lock2:${attempt}`);
                }
                throw original;
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
                } catch (snapshotErr) {
                  notePrivate(entry, snapshotErr);
                  if ((typeof original === "object" && original !== null) || typeof original === "function") {
                    notePrivate(original as object, snapshotErr);
                  }
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
      while (victimEntry === undefined && Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 25));
      }
      expect(victimSide === "A" || victimSide === "B").toBe(true);
      expect(victimEntry).toBeDefined();
      const opposingForVictim = victimSide === "A" ? [lockB, 1] : [lockA, 1];
      expect(victimEntry?.side).toBe(victimSide);
      expect(victimEntry?.attempt).toBe(1);
      expect(victimEntry?.code).toBe("40P01");
      expect(victimEntry?.sql).toBe("SELECT pg_advisory_xact_lock($1, $2)");
      expect(victimEntry?.params).toEqual(opposingForVictim);
      expect(victimEntry?.pid).toBe(backends[victimSide!]?.pid);
      expect(victimEntry?.start).toBe(backends[victimSide!]?.start);
      expect(codes).toHaveLength(1);
      expect(codes[0]).toBe(victimEntry);
      expect(codes.filter((c) => c.code === "40P01")).toHaveLength(1);
      expect(codes.filter((c) => c.code === "40P01")[0]).toBe(victimEntry);
      expect(exactOriginalLedger(codes, victimEntry, victimProof)).toBe(true);
      await victimRolledBack.promise;
      expect(exactOriginalLedger(codes, victimEntry, victimProof)).toBe(true);
      await expect(countReservedRows(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyA)).resolves.toBe(0);
      expect(exactOriginalLedger(codes, victimEntry, victimProof)).toBe(true);
      await expect(countReservedRows(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyB)).resolves.toBe(0);
      expect(exactOriginalLedger(codes, victimEntry, victimProof)).toBe(true);
      const victimBackend = backends[victimSide!];
      if (!victimBackend) throw new Error("missing victim backend identity");
      expect(victimBackend.pid).toBeGreaterThan(0);
      const leftover = await advisoryNamespace(fx.ownerUrl, [
        { classid: lockA, objid: 1 },
        { classid: lockB, objid: 1 },
      ]);
      expect(exactOriginalLedger(codes, victimEntry, victimProof)).toBe(true);
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
      expect(exactOriginalLedger(codes, victimEntry, victimProof)).toBe(true);
      allowSurvivorCommit.resolve();
      const settled = await Promise.race([
        runA.then((body) => ({ side: "A" as const, body })),
        runB.then((body) => ({ side: "B" as const, body })),
      ]);
      expect(exactOriginalLedger(codes, victimEntry, victimProof)).toBe(true);
      expect(settled.body).toEqual(STORED);
      const survivorKey = settled.side === "A" ? keyA : keyB;
      const survivorTag = settled.side === "A" ? tagA : tagB;
      const victimKey = settled.side === "A" ? keyB : keyA;
      const survivorFetched = await fetchReservedRow(
        fx.ownerUrl,
        fx.bookA,
        fx.loginA.actorId,
        survivorKey,
        () => exactOriginalLedger(codes, victimEntry, victimProof),
      );
      expect(exactOriginalLedger(codes, victimEntry, victimProof)).toBe(true);
      const survivorRow = expectRow(
        survivorFetched,
        fx.bookA,
        fx.loginA.actorId,
        survivorKey,
        survivorTag,
      );
      expect(exactOriginalLedger(codes, victimEntry, victimProof)).toBe(true);
      await expect(countReservedRows(fx.ownerUrl, fx.bookA, fx.loginA.actorId, victimKey)).resolves.toBe(0);
      expect(exactOriginalLedger(codes, victimEntry, victimProof)).toBe(true);
      allowVictimRetry.resolve();
      await expect(runA).resolves.toEqual(STORED);
      expect(exactOriginalLedger(codes, victimEntry, victimProof)).toBe(true);
      await expect(runB).resolves.toEqual(STORED);
      expect(exactOriginalLedger(codes, victimEntry, victimProof)).toBe(true);
      expect(acquiredA + acquiredB).toBe(3);
      expect(gatedA).toBe(acquiredA);
      expect(gatedB).toBe(acquiredB);
      expect(Math.max(acquiredA, acquiredB)).toBe(2);
      expect(Math.min(acquiredA, acquiredB)).toBe(1);
      expect(codes).toHaveLength(1);
      expect(codes[0]).toBe(victimEntry);
      expect(codes.filter((c) => c.code === "40P01")).toHaveLength(1);
      expect(codes.filter((c) => c.code === "40P01")[0]).toBe(victimEntry);
      expect(exactOriginalLedger(codes, victimEntry, victimProof)).toBe(true);
      const fetchedA = await fetchReservedRow(
        fx.ownerUrl,
        fx.bookA,
        fx.loginA.actorId,
        keyA,
        () => exactOriginalLedger(codes, victimEntry, victimProof),
      );
      expect(exactOriginalLedger(codes, victimEntry, victimProof)).toBe(true);
      const rowA = expectRow(fetchedA, fx.bookA, fx.loginA.actorId, keyA, tagA);
      const fetchedB = await fetchReservedRow(
        fx.ownerUrl,
        fx.bookA,
        fx.loginA.actorId,
        keyB,
        () => exactOriginalLedger(codes, victimEntry, victimProof),
      );
      expect(exactOriginalLedger(codes, victimEntry, victimProof)).toBe(true);
      const rowB = expectRow(fetchedB, fx.bookA, fx.loginA.actorId, keyB, tagB);
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
          if (!exactOriginalLedger(codes, victimEntry, victimProof)) {
            throw new Error("HOLD: replay checkout after ambiguous ledger");
          }
          const client = await replayRaw.connect();
          if (!exactOriginalLedger(codes, victimEntry, victimProof)) {
            client.release();
            throw new Error("HOLD: replay checkout result after ambiguous ledger");
          }
          let released = false;
          return {
            async query(sql: string, params?: readonly unknown[]) {
              const necessaryRollback = sql.startsWith("ROLLBACK");
              if (!necessaryRollback && !exactOriginalLedger(codes, victimEntry, victimProof)) {
                throw new Error("HOLD: replay query after ambiguous ledger");
              }
              const result = await client.query(sql, params);
              if (!necessaryRollback && !exactOriginalLedger(codes, victimEntry, victimProof)) {
                throw new Error("HOLD: replay query result after ambiguous ledger");
              }
              if (sql.startsWith("BEGIN")) {
                await observeIdentity(
                  client,
                  fixtures.loginA.name,
                  expectedLoginOid(fixtures.loginA),
                  () => exactOriginalLedger(codes, victimEntry, victimProof),
                );
              }
              return result;
            },
            release(err?: unknown) {
              if (released) return;
              released = true;
              client.release(err);
              if (!exactOriginalLedger(codes, victimEntry, victimProof)) {
                throw new Error("HOLD: replay release after ambiguous ledger");
              }
            },
          } satisfies PoolClientLike;
        },
        query: (sql, params) => replayRaw.query(sql, params),
        end: () => replayRaw.end(),
      };
      try {
        expect(exactOriginalLedger(codes, victimEntry, victimProof)).toBe(true);
        await expect(recordNonMoneyRefusal(replay, { idempotencyKey: keyA, requestTag: tagA })).resolves.toEqual(STORED);
        expect(exactOriginalLedger(codes, victimEntry, victimProof)).toBe(true);
        await expect(recordNonMoneyRefusal(replay, { idempotencyKey: keyA, requestTag: "dl-a-x" })).resolves.toEqual(
          MISMATCH,
        );
        expect(exactOriginalLedger(codes, victimEntry, victimProof)).toBe(true);
        await expect(recordNonMoneyRefusal(replay, { idempotencyKey: keyB, requestTag: tagB })).resolves.toEqual(STORED);
        expect(exactOriginalLedger(codes, victimEntry, victimProof)).toBe(true);
        await expect(recordNonMoneyRefusal(replay, { idempotencyKey: keyB, requestTag: "dl-b-x" })).resolves.toEqual(
          MISMATCH,
        );
      } finally {
        await replayRaw.close();
      }
      expect(exactOriginalLedger(codes, victimEntry, victimProof)).toBe(true);
      expect(
        await advisoryNamespace(fx.ownerUrl, [
          { classid: lockA, objid: 1 },
          { classid: lockB, objid: 1 },
        ]),
      ).toHaveLength(0);
      expect(exactOriginalLedger(codes, victimEntry, victimProof)).toBe(true);
      expect(
        await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyA, () =>
          exactOriginalLedger(codes, victimEntry, victimProof),
        ),
      ).toEqual(rowA);
      expect(exactOriginalLedger(codes, victimEntry, victimProof)).toBe(true);
      expect(
        await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyB, () =>
          exactOriginalLedger(codes, victimEntry, victimProof),
        ),
      ).toEqual(rowB);
      expect(exactOriginalLedger(codes, victimEntry, victimProof)).toBe(true);
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
      expect(codes[0]).toBe(victimEntry);
      expect(codes[0]?.code).toBe("40P01");
      expect(codes[0]?.attempt).toBe(1);
      expect(codes[0]?.side).toBe(victimSide);
      expect(codes[0]?.sql).toBe("SELECT pg_advisory_xact_lock($1, $2)");
      expect(codes[0]?.params).toEqual(opposingForVictim);
      expect(exactOriginalLedger(codes, victimEntry, victimProof)).toBe(true);
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
        notePrivate(error, failed.map((result) => result.reason));
        throw error;
      }
    }
  });
});
