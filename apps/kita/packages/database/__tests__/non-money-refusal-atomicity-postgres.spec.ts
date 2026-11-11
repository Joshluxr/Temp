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

type ForwardedCall = {
  readonly phase: "checkout" | "begin" | "identity" | "query" | "commit" | "rollback" | "release";
  readonly sql: string;
  readonly params: readonly unknown[] | undefined;
  readonly side: string;
  readonly attempt: number;
  readonly backend: { readonly pid: number; readonly start: string; readonly oid: string } | undefined;
  status: "pending" | "fulfilled" | "rejected";
  original?: unknown;
};

const identityOperations = new WeakMap<PoolClientLike, OwnedOperation>();
const completedOperations = new WeakMap<object, OwnedOperation>();

/** One checkout owns its abort, raw settlements and necessary cleanup, even when
 * transaction.ts suppresses a cleanup error or the store maps the primary. */
class OwnedOperation {
  currentAbortPresent = false;
  currentAbort: unknown;
  terminal = false;
  invalid = false;
  readonly calls: ForwardedCall[] = [];
  readonly secondaries: unknown[] = [];
  backend: { readonly pid: number; readonly start: string; readonly oid: string } | undefined;
  private raw: PoolClientLike | undefined;
  private beginIssued = false;
  private transactionEnded = false;
  private releaseCall: ForwardedCall | undefined;
  private completion: object | undefined;
  private checkoutRequested = false;
  readonly login: string;
  readonly oid: string;
  readonly side: string;
  readonly attempt: number;
  private readonly proof: () => boolean;

  constructor(
    login: string,
    oid: string,
    side: string,
    attempt: number,
    proof: () => boolean,
  ) {
    this.login = login;
    this.oid = oid;
    this.side = side;
    this.attempt = attempt;
    this.proof = proof;
    notePrivate(this, this.calls);
    notePrivate(this, this.secondaries);
  }

  abort(original: unknown): void {
    if (!this.currentAbortPresent) {
      this.currentAbortPresent = true;
      this.currentAbort = original;
    } else if (!Object.is(this.currentAbort, original)) {
      this.secondaries.push(original);
    }
  }

  private refuse(message: string): never {
    this.invalid = true;
    this.abort(new Error(`HOLD: ${message}`));
    throw this.currentAbort;
  }

  check(): void {
    if (this.currentAbortPresent) throw this.currentAbort;
    // Refusing an old client's call must not revoke a different operation's
    // already consumed permission. The old client still forwards nothing.
    if (this.terminal) throw new Error("HOLD: operation is terminal");
    if (this.invalid) this.refuse("operation is invalid");
    try {
      if (!this.proof()) this.refuse("operation proof is no longer valid");
    } catch (original) {
      this.invalid = true;
      this.abort(original);
      throw this.currentAbort;
    }
  }

  private call(phase: ForwardedCall["phase"], sql: string, params?: readonly unknown[]): ForwardedCall {
    const copy = params === undefined ? undefined : snapshotTrustedParams(params);
    if (params !== undefined && copy === undefined) this.refuse("untrusted forwarded parameters");
    const call: ForwardedCall = {
      phase, sql, params: copy === undefined ? undefined : Object.freeze(copy),
      side: this.side, attempt: this.attempt, backend: this.backend, status: "pending",
    };
    this.calls.push(call);
    return call;
  }

  async connect(pool: PoolLike): Promise<PoolClientLike> {
    this.check();
    if (this.checkoutRequested) this.refuse("operation checkout permission already consumed");
    this.checkoutRequested = true;
    const call = this.call("checkout", "CONNECT");
    try {
      this.raw = await pool.connect();
      call.status = "fulfilled";
    } catch (original) {
      call.original = original;
      call.status = "rejected";
      this.abort(original);
      throw this.currentAbort;
    }
    try {
      this.check();
    } catch (primary) {
      try { this.release(); } catch (secondary) { this.secondaries.push(secondary); }
      throw primary;
    }
    const client: PoolClientLike = {
      query: (sql, params) => this.query(sql, params),
      release: (error) => this.release(error),
    };
    identityOperations.set(client, this);
    return client;
  }

  private async query(sql: string, params?: readonly unknown[]): Promise<{ rows: any[]; rowCount?: number }> {
    const rollback = sql === "ROLLBACK";
    if (rollback) {
      if (this.terminal) {
        if (this.currentAbortPresent) throw this.currentAbort;
        throw new Error("HOLD: terminal client has no cleanup obligation");
      }
      if (!this.raw || !this.beginIssued || this.transactionEnded) {
        this.refuse("ROLLBACK has no owned outstanding BEGIN");
      }
    } else {
      this.check();
      if (this.transactionEnded) this.refuse("normal SQL follows transaction completion");
    }
    if (!this.raw) this.refuse("SQL precedes owned acquisition");
    if (this.calls.some((call) => call.status === "pending")) this.refuse("another owned raw phase is pending");
    const phase = sql === "BEGIN ISOLATION LEVEL SERIALIZABLE" ? "begin"
      : rollback ? "rollback" : sql === "COMMIT" ? "commit"
      : sql === IDENTITY_SQL ? "identity" : "query";
    if (phase === "begin" && this.beginIssued) this.refuse("duplicate BEGIN");
    if (phase !== "begin" && !this.beginIssued) this.refuse("SQL precedes actual BEGIN");
    if (phase === "identity" && this.backend !== undefined) this.refuse("duplicate identity publication");
    if ((phase === "query" || phase === "commit") && this.backend === undefined) {
      this.refuse("normal SQL precedes authenticated identity");
    }
    const call = this.call(phase, sql, params);
    if (phase === "begin") this.beginIssued = true;
    let result;
    try {
      // No await, parameter resnapshot or metadata access between capture and forward.
      result = await this.raw.query(sql, params);
      call.status = "fulfilled";
      if (phase === "commit" || phase === "rollback") this.transactionEnded = true;
    } catch (original) {
      call.original = original;
      call.status = "rejected";
      this.abort(original);
      throw this.currentAbort;
    }
    if (!rollback) this.check();
    return result;
  }

  release(error?: unknown): void {
    if (this.releaseCall) {
      if (this.releaseCall.status === "rejected") throw this.currentAbort;
      return;
    }
    if (this.calls.some((call) => call.status === "pending") ||
        (this.beginIssued && !this.transactionEnded)) {
      this.invalid = true;
      this.abort(new Error("HOLD: release precedes owned raw work or transaction cleanup"));
    }
    this.terminal = true;
    const call = this.call("release", "RELEASE");
    this.releaseCall = call; // claim before invoking possibly reentrant driver code
    if (!this.raw) this.refuse("release precedes acquisition");
    try {
      this.raw.release(error);
      call.status = "fulfilled";
    } catch (original) {
      call.original = original;
      call.status = "rejected";
      this.abort(original);
      throw this.currentAbort;
    }
  }

  complete(expectedFailure?: { readonly sql: string; readonly params: readonly unknown[]; readonly code: string }): object {
    const failures = this.calls.filter((call) => call.status === "rejected");
    if (this.invalid || this.secondaries.length || !this.terminal ||
        this.releaseCall?.status !== "fulfilled" || !this.transactionEnded ||
        this.calls.some((call) => call.status === "pending")) {
      this.refuse("operation lacks completed once-only cleanup");
    }
    if (expectedFailure) {
      const raw = failures[0];
      if (failures.length !== 1 || !raw || raw.phase !== "query" ||
          raw.sql !== expectedFailure.sql || !raw.params ||
          raw.params.length !== expectedFailure.params.length ||
          raw.params.some((value, index) => value !== expectedFailure.params[index]) ||
          !this.currentAbortPresent || !Object.is(raw.original, this.currentAbort) ||
          !this.calls.some((call) => call.phase === "rollback" && call.status === "fulfilled") ||
          this.calls.some((call) => call.phase === "commit")) {
        this.refuse("expected refusal lacks exact raw phase and cleanup provenance");
      }
      try {
        if (isProxy(raw.original) || typeof raw.original !== "object" || raw.original === null) {
          this.refuse("native refusal original is not structured");
        }
        const descriptor = Object.getOwnPropertyDescriptor(raw.original, "code");
        if (!descriptor || !("value" in descriptor) || descriptor.value !== expectedFailure.code) {
          this.refuse("native refusal code is unavailable or unexpected");
        }
      } catch (secondary) {
        this.invalid = true;
        this.abort(secondary);
        throw this.currentAbort;
      }
    } else if (failures.length || this.currentAbortPresent ||
        !this.calls.some((call) => call.phase === "commit" && call.status === "fulfilled")) {
      this.refuse("healthy operation has an abort or lacks COMMIT");
    }
    if (!this.completion) {
      this.completion = Object.freeze({});
      completedOperations.set(this.completion, this);
    }
    return this.completion;
  }

  ownsCompletion(completion: object): boolean {
    return this.completion === completion && !this.invalid && !this.secondaries.length &&
      this.terminal && this.releaseCall?.status === "fulfilled" &&
      this.calls.every((call) => call.status !== "pending");
  }
}

function consumeCompletion(completion: object): () => boolean {
  const previous = completedOperations.get(completion);
  if (!previous?.ownsCompletion(completion)) throw new Error("HOLD: operation permission is not independently completed");
  completedOperations.delete(completion); // single consumption before asynchronous checkout
  return () => previous.ownsCompletion(completion);
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
  if (isProxy(params) || !Array.isArray(params)) return undefined;
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
const provisionedLoginOids = new WeakMap<object, string>();

function expectedLoginOid(login: { readonly name: string }): string {
  const oid = provisionedLoginOids.get(login);
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

const retainedWork = new Set<object>();

async function boundedResult<T>(work: Promise<T>, name: string, ms: number): Promise<T> {
  const ledger: { work: Promise<T>; outcome?: PromiseSettledResult<unknown> } = { work };
  retainedWork.add(ledger);
  const retire = () => {
    const timer = setTimeout(() => retainedWork.delete(ledger), 60_000);
    timer.unref();
  };
  // Observe construction-time rejection even when the first checkpoint fails.
  void work.then(
    () => { ledger.outcome = { status: "fulfilled", value: undefined }; retire(); },
    (reason: unknown) => { ledger.outcome = { status: "rejected", reason }; retire(); },
  );
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`timeout:${name}`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function boundedWait(work: Promise<unknown>, name: string, ms: number): Promise<void> {
  await boundedResult(work, name, ms);
}

async function withOwnerObserver<T>(ownerUrl: string, fn: (client: pg.Client) => Promise<T>): Promise<T> {
  const owner: { client?: pg.Client } = {};
  let connected = false;
  let failed = false;
  let closing = false;
  let primary: unknown;
  const work = Promise.resolve().then(async () => {
    const client = ownerClient(ownerUrl);
    owner.client = client;
    notePrivate(owner, client);
    const rawQuery = client.query.bind(client) as (sql: string, params?: readonly unknown[]) => Promise<pg.QueryResult>;
    client.query = (async (sql: string, params?: readonly unknown[]) => {
      if (closing) throw new Error("HOLD: observer is closing");
      const result = await rawQuery(sql, params);
      if (closing) throw new Error("HOLD: observer result follows closing");
      return result;
    }) as pg.Client["query"];
    await client.connect();
    if (closing) throw new Error("HOLD: late observer connection");
    connected = true;
    return fn(client);
  });
  try {
    return await boundedResult(work, "owner-observer.work", 20_000);
  } catch (err) {
    failed = true;
    primary = err;
    throw err;
  } finally {
    closing = true;
    try {
      const client = owner.client;
      if (client) {
        const ending = Promise.resolve().then(() => client.end());
        notePrivate(owner, ending);
        await boundedResult(ending, "owner-observer.end", 24_000);
      }
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
      notePrivate(owner, cleanup);
      notePrivate(owner, endErr);
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
  if (proofOk && !proofOk()) throw new Error("HOLD: row observation lacks current proof");
  const row = await withOwnerObserver(ownerUrl, async (client) => {
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
  if (proofOk && !proofOk()) throw new Error("HOLD: row observation follows observer close invalidation");
  return row;
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

const IDENTITY_SQL = `SELECT session_user AS session_user, current_user AS current_user,
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
            (SELECT backend_start::text FROM pg_stat_activity WHERE pid = pg_backend_pid()) AS start`;

async function observeIdentity(
  client: PoolClientLike,
  expectedLogin: string,
  expectedOid: string,
  proofOk: () => boolean,
): Promise<{ pid: number; start: string; oid: string }> {
  const operation = identityOperations.get(client);
  const check = () => {
    try {
      operation?.check();
      if (!proofOk()) throw new Error("HOLD: identity observed after ambiguous ledger");
      if (!operation || operation.login !== expectedLogin || operation.oid !== expectedOid) {
        throw new Error("HOLD: identity has no owned provisioned expectation");
      }
      operation.check();
    } catch (primary) {
      operation?.abort(primary);
      if (operation?.currentAbortPresent) throw operation.currentAbort;
      throw primary;
    }
  };
  check();
  let ident;
  try {
    ident = await client.query(IDENTITY_SQL);
  } catch (raw) {
    // The owned query retained the raw occurrence before this callback can throw.
    notePrivate(client, { phase: "identity", original: raw });
    check();
    throw raw;
  }
  check(); // no rows/cardinality/property access before both settlement guards
  try {
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
  if (typeof row?.start !== "string" || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d{1,6})?[+-]\d{2}(?::\d{2})?$/.test(row.start)) {
    throw new Error("HOLD: precise backend_start missing");
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
  check();
  const identity = Object.freeze({ pid, start: row.start as string, oid: row.login_oid as string });
  operation!.backend = identity;
  return identity;
  } catch (primary) {
    operation!.abort(primary);
    throw operation!.currentAbort;
  }
}

let expectedDatabaseOid: string | undefined;

async function assertSuitePreflight(ownerUrl: string): Promise<void> {
  let databaseOid: string | undefined;
  await withOwnerObserver(ownerUrl, async (client) => {
    const preflight = await client.query<{
        server_version_num: string;
        current_database: string;
        database_oid: string;
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
                (SELECT oid::text FROM pg_database WHERE datname = current_database()) AS database_oid,
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
    if (!/^[1-9]\d*$/.test(row.database_oid)) throw new Error("HOLD: database oid missing");
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
    databaseOid = row.database_oid;
  });
  expectedDatabaseOid = databaseOid; // publish only after the actual observer end
}

async function advisoryNamespace(
  ownerUrl: string,
  expected: ReadonlyArray<{ classid: number; objid: number }>,
  participants: ReadonlyArray<{ readonly pid: number; readonly start: string }> = [],
  proofOk: () => boolean = () => true,
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
  if (!proofOk()) throw new Error("HOLD: advisory observation lacks current proof");
  const rows = await withOwnerObserver(ownerUrl, async (client) => {
    const database = await client.query<{ oid: string }>(
      "SELECT oid::text AS oid FROM pg_database WHERE datname = current_database()",
    );
    if (!proofOk()) throw new Error("HOLD: advisory database result follows invalidation");
    if (!expectedDatabaseOid || database.rows.length !== 1 || database.rows[0]?.oid !== expectedDatabaseOid) {
      throw new Error("HOLD: advisory database identity changed or unavailable");
    }
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
    if (!proofOk()) throw new Error("HOLD: advisory namespace result follows invalidation");
    // Retain the whole namespace, including waiting rows, before tuple filtering.
    notePrivate(result, result.rows);
    const allowed = new Set(expected.map((row) => `${row.classid}:${row.objid}:2`));
    const outsiders = result.rows.filter(
      (row) => row.database !== expectedDatabaseOid ||
        !allowed.has(`${row.classid}:${row.objid}:${row.objsubid}`) ||
        !participants.some((participant) => participant.pid === row.pid && participant.start === row.start),
    );
    if (outsiders.length > 0) {
      throw new Error("HOLD: unexpected advisory lock participants");
    }
    return result.rows;
  });
  if (!proofOk()) throw new Error("HOLD: advisory observation follows observer close invalidation");
  return rows;
}

describe.skipIf(!selected)("non-money refusal atomicity PostgreSQL evidence", () => {
  let fx: RefusalPgFixtures | undefined;
  const pending: Promise<unknown>[] = [];
  const casePools: ReturnType<typeof createPool>[] = [];
  let suitePrimaryPresent = false;
  let suitePrimary: unknown;
  const failSuite = (primary: unknown) => {
    if (!suitePrimaryPresent) {
      suitePrimaryPresent = true;
      suitePrimary = primary;
    } else if (!Object.is(primary, suitePrimary)) {
      notePrivate(pending, primary);
    }
  };

  beforeAll(async () => {
    /* Native preflight and fixture provisioning run after controlled evidence in the first case. */
  });

  afterAll(async () => {
    try {
      // Start both work and close observation before the first matcher can fail.
      const close = fx ? fx.close() : Promise.resolve();
      const concurrent = fx ? fx.close() : Promise.resolve();
      const [drain, closure] = await Promise.allSettled([
        boundedWait(Promise.allSettled(pending), "suite-drain", 20_000),
        boundedResult(Promise.allSettled([
          close, concurrent,
          ...casePools.map((pool) => boundedWait(Promise.resolve().then(() => pool.close()), "suite-pool.close", 22_000)),
        ]), "suite-fixture-close", 24_000),
      ]);
      if (drain.status === "rejected") throw drain.reason;
      if (closure.status === "rejected") throw closure.reason;
      const settled = closure.value;
      expect(settled[0]?.status).toBe(settled[1]?.status);
      if (fx) {
        expect(() => fx!.poolFor("postgres://kita-refusal-closed/refused")).toThrow(/fixture closing/);
        const repeated = await boundedResult(
          Promise.allSettled([fx.close(), fx.close()]), "suite-repeated-close", 24_000,
        );
        expect(repeated[0]?.status).toBe(settled[0]?.status);
        expect(repeated[1]?.status).toBe(settled[0]?.status);
        if (settled[0]?.status === "rejected" && settled[1]?.status === "rejected") {
          expect(settled[0].reason).toBe(settled[1].reason);
        }
      }
      for (const result of settled) {
        if (result.status === "rejected") throw result.reason;
      }
    } catch (cleanup) {
      notePrivate(pending, cleanup);
      if (suitePrimaryPresent) throw suitePrimary;
      throw cleanup;
    }
  });

  it("Atomic refusal rollback on native KRF02", async () => {
    try {
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

      // These use the same owned checkout/query/release and raw identity path as
      // native wrappers. They are controlled cases, never native SQLSTATE proof.
      const originals: readonly unknown[] = [
        undefined, null, false, 0, "", () => undefined,
        Object.freeze({}), Object.preventExtensions({}),
        Object.defineProperty({}, "code", { get() { throw new Error("metadata trap"); } }),
      ];
      for (const side of ["A", "B"] as const) {
        for (const attempt of [1, 2, 3]) {
          for (const boundary of ["checkout", "begin", "identity"] as const) {
            for (const rejects of [false, true]) {
              for (let index = 0; index < originals.length; index += 1) {
                const primary = originals[index];
                const secondary = originals[(index + 1) % originals.length];
                const started = timedDeferred("controlled-owned-start");
                const held = timedDeferred<any>("controlled-owned-settlement");
                const sqlCalls: string[] = [];
                let releaseCalls = 0;
                let resultReads = 0;
                let client: PoolClientLike | undefined;
                const op = new OwnedOperation("controlled_login", "20001", side, attempt, () => true);
                const raw: PoolClientLike = {
                  async query(sql) {
                    sqlCalls.push(sql);
                    if ((boundary === "begin" && sql === "BEGIN ISOLATION LEVEL SERIALIZABLE") ||
                        (boundary === "identity" && sql === IDENTITY_SQL)) {
                      started.resolve();
                      return held.promise;
                    }
                    return { rows: [] };
                  },
                  release() {
                    releaseCalls += 1;
                    client?.release(); // deliberately reentrant
                  },
                };
                const pool: PoolLike = {
                  async connect() {
                    if (boundary === "checkout") { started.resolve(); return held.promise; }
                    return raw;
                  },
                  async query() { throw new Error("direct controlled query forbidden"); },
                  async end() { throw new Error("direct controlled end forbidden"); },
                };
                const work = (async () => {
                  client = await op.connect(pool);
                  await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
                  if (boundary === "identity") {
                    await client.query(IDENTITY_SQL);
                  }
                })();
                void work.catch(() => undefined);
                try {
                  await started.promise;
                  op.abort(primary);
                  if (rejects) held.reject(secondary);
                  else if (boundary === "checkout") held.resolve(raw);
                  else held.resolve({ get rows() { resultReads += 1; throw new Error("late result read"); } });
                  const result = await Promise.allSettled([work]);
                  expect(result[0]?.status).toBe("rejected");
                  if (result[0]?.status === "rejected") expect(result[0].reason).toBe(primary);
                  expect(op.currentAbortPresent).toBe(true);
                  expect(op.currentAbort).toBe(primary);
                  expect(op.backend).toBeUndefined();
                  expect(resultReads).toBe(0);
                  const call = op.calls.find((entry) => entry.phase === boundary);
                  expect(call?.status).toBe(rejects ? "rejected" : "fulfilled");
                  if (rejects) {
                    expect(Object.prototype.hasOwnProperty.call(call, "original")).toBe(true);
                    expect(call?.original).toBe(secondary);
                  }
                  if (client) {
                    const before = sqlCalls.length;
                    await expect(client.query("COMMIT")).rejects.toBe(primary);
                    expect(sqlCalls).toHaveLength(before);
                    await client.query("ROLLBACK"); // actual issued BEGIN owns this obligation
                    client.release();
                    client.release();
                    expect(releaseCalls).toBe(1);
                    await expect(client.query("SELECT 1")).rejects.toBe(primary);
                  } else {
                    expect(sqlCalls).toHaveLength(0);
                    expect(releaseCalls).toBe(rejects ? 0 : 1);
                  }
                } finally {
                  held.reject(primary);
                  started.reject(primary);
                  await boundedWait(Promise.allSettled([work, held.promise, started.promise]), "controlled-owned-drain", 20_000);
                  client?.release();
                }
              }
            }
          }
          let checkouts = 0;
          const refused = new OwnedOperation("controlled_login", "20001", side, attempt, () => false);
          const refusedPool: PoolLike = {
            async connect() { checkouts += 1; throw new Error("unexpected checkout"); },
            async query() { throw new Error("unexpected direct query"); },
            async end() {},
          };
          await expect(refused.connect(refusedPool)).rejects.toThrow(/HOLD/);
          expect(checkouts).toBe(0);
        }
      }
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
      let ownerEnds = 0;
      let failAt = -1;
      let suppress = false;
      let injected: unknown;
      const mutations: string[] = [];
      const issue = (kind: string): boolean => {
        mutations.push(kind);
        if (mutations.length !== failAt) return true;
        if (suppress) return false;
        throw injected;
      };
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
          if (!issue("book")) return { rows: [], rowCount: 0 };
          bookSeq += 1;
          const id = `00000000-0000-4000-8000-${String(bookSeq).padStart(12, "0")}`;
          issuedBooks.push({ id, status: "disabled", legal: String(params?.[0] ?? "") });
          return { rows: [{ id, status: "disabled" }] };
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
          if (!issue("role")) return { rows: [], rowCount: 0 };
          executedCreates.add(createExec[1]);
          return { rows: [], rowCount: 0 };
        }
        const grantExec = /^GRANT kita_refusal_recorder TO "([A-Za-z0-9_]+)" WITH INHERIT TRUE, SET FALSE$/.exec(sql);
        if (grantExec?.[1]) {
          if (!executedCreates.has(grantExec[1])) {
            throw new Error("HOLD: GRANT executed before CREATE");
          }
          if (!issue("grant")) return { rows: [], rowCount: 0 };
          executedGrants.add(grantExec[1]);
          return { rows: [], rowCount: 0 };
        }
        if ((sql.includes("CREATE ROLE") && !sql.includes("%I")) || (sql.includes("GRANT kita_refusal_recorder") && !sql.includes("%I"))) {
          throw new Error("HOLD: unrecognized CREATE/GRANT mutation");
        }
        if (sql.includes("INSERT INTO kita.non_money_refusal_principals")) {
          if (!issue("binding")) return { rows: [], rowCount: 0 };
          const bookId = String(params?.[0] ?? "");
          const actorId = String(params?.[1] ?? "");
          const loginName = String(params?.[2] ?? "");
          const loginOid = issuedOids.get(loginName);
          if (!loginOid) throw new Error("HOLD: principal insert name is not issued");
          issuedBindings.push({ login_name: loginName, login_oid: loginOid, book_id: bookId, actor_id: actorId });
          return { rowCount: 1, rows: [] };
        }
        if (sql.includes("AS oid") && sql.includes("FROM pg_catalog.pg_roles")) {
          const loginName = String(params?.[0] ?? "");
          if (!executedCreates.has(loginName)) return { rows: [], rowCount: 0 };
          const existing = issuedOids.get(loginName);
          const oid = existing ?? String(20_000 + ++roleSeq);
          issuedOids.set(loginName, oid);
          return { rows: [{
            oid, rolcanlogin: true, rolinherit: true, rolsuper: false, rolcreatedb: false,
            rolcreaterole: false, rolreplication: false, rolbypassrls: false,
            membership_count: executedGrants.has(loginName) ? "1" : "0",
          }] };
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
        if (sql.includes("pg_auth_members") && sql.includes("AS member_oid")) {
          const names = sql.includes("ANY($1") ? params?.[0] as readonly string[] : [params?.[0]];
          return {
            rows: [...executedGrants].filter((name) => names?.includes(name)).map((name) => ({
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
        throw new Error("HOLD: unmodeled controlled SQL");
      };
      class FakeClient {
        async connect() {}
        async end() { ownerEnds += 1; }
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
        expect(mutations).toEqual([
          "book", "book", "role", "grant", "binding", "role", "grant", "binding",
          "role", "grant", "binding", "role", "grant",
        ]);
        expect(issuedBooks.map((book) => book.status)).toEqual(["disabled", "disabled"]);
        expect(executedCreates.size).toBe(4);
        expect(executedGrants.size).toBe(4);
        expect(new Set(issuedOids.values()).size).toBe(4);
        expect(issuedBindings).toHaveLength(3);
        expect(issuedBindings.some((binding) => binding.login_name === fixtures!.loginUnbound.name)).toBe(false);
        const inventory = (fixtures as unknown as Record<symbol, { resources: Array<{ kind: string; outcome: string }> }>)[
          Symbol.for("kita.non-money-refusal.fixture-invocation")
        ];
        expect(inventory?.resources).toHaveLength(13);
        expect(inventory?.resources.every((resource) => resource.outcome === "fulfilled")).toBe(true);
        expect(ownerEnds).toBe(2);
        const retainedPool = fixtures.poolFor(fixtures.loginA.url);
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
        await expect(retainedPool.connect()).rejects.toThrow(/fixture closing/);
        await expect(retainedPool.query("SELECT 1")).rejects.toThrow(/fixture closing/);
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
        const reset = () => {
          bookSeq = 0;
          roleSeq = 0;
          ownerEnds = 0;
          mutations.length = 0;
          issuedBooks.length = 0;
          issuedBindings.length = 0;
          issuedOids.clear();
          executedCreates.clear();
          executedGrants.clear();
        };
        const rawOriginals: readonly unknown[] = [
          undefined, null, false, 0, "", () => undefined, Object.freeze({}), Object.preventExtensions({}),
          Object.defineProperty({}, "code", { get() { throw new Error("controlled metadata trap"); } }),
        ];
        for (failAt = 1; failAt <= 13; failAt += 1) {
          suppress = true;
          reset();
          await expect(provisionRefusalFixtures()).rejects.toThrow(/HOLD/);
          expect(mutations).toHaveLength(failAt);
          expect(ownerEnds).toBe(2);
          suppress = false;
          for (const original of rawOriginals) {
            reset();
            injected = original;
            await expect(provisionRefusalFixtures()).rejects.toBe(original);
            expect(mutations).toHaveLength(failAt);
            expect(ownerEnds).toBe(2);
          }
        }
      } finally {
        settle(heldEnd);
        try {
        await boundedWait(Promise.allSettled([
          held,
          driverEnds > 0 ? endStarted : Promise.resolve(),
          firstClose ?? Promise.resolve(),
          concurrentClose ?? Promise.resolve(),
          fixtures?.close() ?? Promise.resolve(),
        ]), "controlled-fixture-drain", 24_000);
        } finally {
        (pg as { Client: unknown }).Client = OriginalClient;
        if (originalPool === undefined) delete (pg as { Pool?: unknown }).Pool;
        else (pg as { Pool: unknown }).Pool = originalPool;
        if (previousOwnerUrl === undefined) delete process.env.KITA_REFUSAL_TEST_OWNER_URL;
        else process.env.KITA_REFUSAL_TEST_OWNER_URL = previousOwnerUrl;
        }
      }
    }
    const ownerUrl = requireRefusalOwnerUrl();
    await assertSuitePreflight(ownerUrl);
    fx = await provisionRefusalFixtures();
    if (!fx) throw new Error("fixtures missing");
    const fixtures = fx;
    // Capture only this actual helper return before any application work. A
    // caller-supplied Symbol.for tag cannot register an independent expectation.
    for (const login of [fixtures.loginA, fixtures.loginB, fixtures.loginC, fixtures.loginUnbound]) {
      const descriptor = Object.getOwnPropertyDescriptor(login, LOGIN_OID);
      if (!Object.isFrozen(login) || !descriptor || !("value" in descriptor) ||
          typeof descriptor.value !== "string" || !/^[1-9]\d*$/.test(descriptor.value)) {
        throw new Error("HOLD: privately captured provisioned login oid missing");
      }
      provisionedLoginOids.set(login, descriptor.value);
    }
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
    casePools.push(pool);
    const afterA = timedDeferred("afterA");
    const continueB = timedDeferred("continueB");
    let abortOccurred = false;
    let aborted: unknown;
    let wrappingAcquired = 0;
    let observingOp: OwnedOperation | undefined;
    let wrappingOp: OwnedOperation | undefined;
    let nextObservingPermission: {
      readonly kind: "setup" | "recovery" | "replay" | "conflict";
      readonly completion?: object;
    } | undefined = { kind: "setup" };
    const observing: PoolLike = {
      async connect() {
        const permission = nextObservingPermission;
        if (!permission || (observingOp && !observingOp.terminal)) {
          if (abortOccurred) throw aborted;
          throw new Error("HOLD: no distinct observing operation permission");
        }
        nextObservingPermission = undefined;
        const preceding = permission.kind === "setup" ? () => !abortOccurred
          : consumeCompletion(permission.completion!);
        const op: OwnedOperation = new OwnedOperation(
          fixtures.loginA.name, expectedLoginOid(fixtures.loginA), permission.kind, 1,
          () => observingOp === op && preceding(),
        );
        observingOp = op;
        const client = await op.connect(pool);
        return {
          async query(sql: string, params?: readonly unknown[]) {
            if (sql.startsWith("BEGIN")) {
              const result = await client.query(sql, params);
              await observeIdentity(client, fixtures.loginA.name, expectedLoginOid(fixtures.loginA), () => {
                op.check();
                return true;
              });
              return result;
            }
            return client.query(sql, params);
          },
          release(err?: unknown) {
            client.release(err);
          },
        } satisfies PoolClientLike;
      },
      async query() { throw new Error("HOLD: direct observing query has no operation owner"); },
      async end() { throw new Error("HOLD: observing end is owned by case cleanup"); },
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
      const setupCompletion = observingOp!.complete();
      let requested = 0;
      let acquired = 0;
      const sequence: string[] = [];
      let driverErr: unknown;
      const wrapping: PoolLike = {
        async connect() {
          if (abortOccurred) throw aborted;
          const preceding = consumeCompletion(setupCompletion);
          requested += 1;
          const op = new OwnedOperation(
            fixtures.loginA.name, expectedLoginOid(fixtures.loginA), "refusal", requested,
            () => {
              if (abortOccurred) throw aborted;
              return preceding();
            },
          );
          wrappingOp = op;
          const client = await op.connect(pool);
          acquired += 1;
          wrappingAcquired = acquired;
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
        async query() { throw new Error("HOLD: direct refusal query has no operation owner"); },
        async end() { throw new Error("HOLD: refusal end is owned by case cleanup"); },
      };
      const running = withSerializable(wrapping, async (client) => {
        await client.query("SELECT kita.record_non_money_refusal($1,$2) AS body", [keyA, tagA]);
        await client.query("SELECT kita.record_non_money_refusal($1,$2) AS body", [keyB, "atom-b-other"]);
        return STORED;
      });
      void running.catch((err) => {
        if (!abortOccurred) {
          abortOccurred = true;
          aborted = err;
        }
        wrappingOp?.abort(err);
        if (observingOp && !observingOp.terminal) observingOp.abort(err);
        afterA.reject(aborted);
        continueB.reject(aborted);
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
        if (!abortOccurred) {
          abortOccurred = true;
          aborted = err;
        }
        wrappingOp?.abort(err);
        continueB.reject(err);
      }
      expect(afterA.outcome()?.status).toBe("fulfilled");
      expect(helperErr).toBe(driverErr);
      expect((helperErr as { code?: string }).code).toBe("KRF02");
      expect(requested).toBe(1);
      expect(acquired).toBe(1);
      expect(wrappingAcquired).toBe(acquired);
      expect(sequence).toEqual(["begin", "function-a", "rollback", "release"]);
      expect((helperErr as { code?: string }).code).toBe("KRF02");
      await expect(countReservedRows(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyA)).resolves.toBe(0);
      expect(await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyB)).toEqual(rowB);
      if (
        requested === 1 &&
        acquired === 1 &&
        sequence.length === 4 &&
        sequence[0] === "begin" &&
        sequence[1] === "function-a" &&
        sequence[2] === "rollback" &&
        sequence[3] === "release" &&
        (helperErr as { code?: string }).code === "KRF02"
      ) {
        nextObservingPermission = {
          kind: "recovery",
          completion: wrappingOp!.complete({
            sql: "SELECT kita.record_non_money_refusal($1,$2) AS body",
            params: [keyB, "atom-b-other"], code: "KRF02",
          }),
        };
      }
      await expect(recordNonMoneyRefusal(observing, { idempotencyKey: keyA, requestTag: tagA })).resolves.toEqual(STORED);
      const rowA = expectRow(
        await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyA),
        fx.bookA,
        fx.loginA.actorId,
        keyA,
        tagA,
      );
      expect(await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyB)).toEqual(rowB);
      nextObservingPermission = { kind: "replay", completion: observingOp!.complete() };
      await expect(recordNonMoneyRefusal(observing, { idempotencyKey: keyA, requestTag: tagA })).resolves.toEqual(STORED);
      expect(await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyA)).toEqual(rowA);
      expect(await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyB)).toEqual(rowB);
      nextObservingPermission = { kind: "conflict", completion: observingOp!.complete() };
      await expect(recordNonMoneyRefusal(observing, { idempotencyKey: keyA, requestTag: "atom-a-other" })).resolves.toEqual(
        MISMATCH,
      );
      expect(await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyA)).toEqual(rowA);
      expect(await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyB)).toEqual(rowB);
      observingOp!.complete({
        sql: "SELECT kita.record_non_money_refusal($1,$2) AS body",
        params: [keyA, "atom-a-other"], code: "KRF02",
      });
    } catch (primary) {
      // Assertion/checkpoint failures are abort producers too. Do not wait for a
      // later driver rejection, or overwrite historical expected-refusal state.
      if (observingOp && !observingOp.terminal) observingOp.abort(primary);
      if (wrappingOp && !wrappingOp.terminal) wrappingOp.abort(primary);
      failSuite(primary);
      throw primary;
    } finally {
      afterA.reject(new Error("cleanup"));
      continueB.reject(new Error("cleanup"));
      const cleanup = await Promise.allSettled([
        boundedWait(Promise.allSettled(pending), "KRF02-drain", 20_000),
        boundedWait(Promise.resolve().then(() => pool.close()), "KRF02-pool.close", 22_000),
      ]);
      for (const result of cleanup) {
        if (result.status === "rejected") {
          notePrivate(pending, result.reason);
          if (suitePrimaryPresent) throw suitePrimary;
          failSuite(result.reason);
          throw result.reason;
        }
      }
    }
    } catch (primary) {
      failSuite(primary);
      throw primary;
    }
  });

  it("Native 40P01 rolls back refusal and replays the full callback", async () => {
    try {
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
    casePools.push(poolA);
    const poolB = createPool({
      databaseUrl: fx.loginA.url,
      poolMax: 1,
      statementTimeoutMs: 20_000,
      connectionTimeoutMs: 10_000,
      idleTimeoutMs: 20_000,
    });
    casePools.push(poolB);
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
    const ownedAttempts = new Map<string, OwnedOperation>();
    const retryPermissions = new Map<string, { victim: object; survivor: object }>();
    const opposingAcknowledged = new Set<string>();
    let survivorCommitOwner: OwnedOperation | undefined;
    let permanentlyAmbiguous = false;

    function currentLedgerOk(): boolean {
      if (codes.length !== 0 && !exactOriginalLedger(codes, victimEntry, victimProof)) {
        permanentlyAmbiguous = true;
      }
      return !permanentlyAmbiguous;
    }

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
          let preceding = () => true;
          if (next > 1) {
            await allowVictimRetry.promise;
            if (!exactOriginalLedger(codes, victimEntry, victimProof)) throw persistAbort ?? new Error("HOLD: retry permission after ambiguous ledger");
            if (abortOccurred) throw persistAbort;
            const permission = retryPermissions.get(`${side}:${next}`);
            if (!permission) throw new Error("HOLD: no independently produced retry permission");
            retryPermissions.delete(`${side}:${next}`);
            const victimComplete = consumeCompletion(permission.victim);
            const survivorComplete = consumeCompletion(permission.survivor);
            preceding = () => victimComplete() && survivorComplete();
          }
          const op = new OwnedOperation(
            fixtures.loginA.name, expectedLoginOid(fixtures.loginA), side, next,
            () => {
              if (abortOccurred) throw persistAbort;
              return currentLedgerOk() && preceding();
            },
          );
          ownedAttempts.set(`${side}:${next}`, op);
          let client: Awaited<ReturnType<typeof pool.connect>>;
          try {
            client = await op.connect(pool);
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
          if (next > 1 && !exactOriginalLedger(codes, victimEntry, victimProof)) {
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
                if (!phaseLedgerOk(attempt)) {
                  throw persistAbort ?? new Error("HOLD: BEGIN after ambiguous ledger");
                }
                let result;
                try {
                  callOwner.issued = true;
                  result = await client.query(sql, params);
                } catch (err) {
                  if (op.calls.at(-1)?.status !== "rejected") throw err;
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
                if (attempt === 1) {
                  backends[side] = ident;
                  if (backends.A && backends.B && backends.A.pid === backends.B.pid) {
                    permanentlyAmbiguous = true;
                    throw new Error("HOLD: first participants do not have distinct authenticated backends");
                  }
                }
                return result;
              }
              if (sql.startsWith("COMMIT") && !exactOriginalLedger(codes, victimEntry, victimProof)) {
                throw persistAbort ?? new Error("HOLD: COMMIT after ambiguous ledger");
              }
              if (sql === "COMMIT" && attempt === 1) {
                if (survivorCommitOwner !== op) throw new Error("HOLD: survivor has no private COMMIT permission");
                survivorCommitOwner = undefined;
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
                  opposingAcknowledged.add(`${side}:${attempt}`);
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
                // Coordination/proof failure after acknowledgement is not a raw SQL rejection.
                const rawCall = op.calls.at(-1);
                if (driverAcked || rawCall?.status !== "rejected") {
                  notePrivate(op, { phase: "coordination", original: err });
                  abort(err);
                  throw persistAbort;
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
        async query() { throw new Error("HOLD: direct deadlock query has no operation owner"); },
        async end() { throw new Error("HOLD: deadlock end is owned by case cleanup"); },
      };
    }

    let persistAbort: unknown;
    let abortOccurred = false;
    const abort = (err: unknown) => {
      if (!abortOccurred) {
        abortOccurred = true;
        persistAbort = err;
      }
      for (const operation of ownedAttempts.values()) {
        if (!operation.terminal) operation.abort(persistAbort);
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
      ], Object.values(backends), () => !abortOccurred && currentLedgerOk());
      expect(afterFirst).toHaveLength(2);
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
      ], Object.values(backends), () => !abortOccurred && currentLedgerOk());
      expect(leftover).toHaveLength(2);
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
      if (!opposingAcknowledged.has(`${survivorSide}:1`)) {
        throw new Error("HOLD: survivor opposing lock is not independently acknowledged");
      }
      survivorCommitOwner = ownedAttempts.get(`${survivorSide}:1`);
      if (!survivorCommitOwner) throw new Error("HOLD: survivor operation owner is absent");
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
      const victimOperation = ownedAttempts.get(`${victimSide}:1`);
      const survivorOperation = ownedAttempts.get(`${settled.side}:1`);
      if (!victimOperation || !survivorOperation || settled.side !== survivorSide) {
        throw new Error("HOLD: completed participant ownership is unavailable");
      }
      retryPermissions.set(`${victimSide}:2`, {
        victim: victimOperation.complete({
          sql: "SELECT pg_advisory_xact_lock($1, $2)", params: opposingForVictim, code: "40P01",
        }),
        survivor: survivorOperation.complete(),
      });
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
      casePools.push(replayRaw);
      const retried = ownedAttempts.get(`${victimSide}:2`);
      if (!retried) throw new Error("HOLD: completed victim retry owner is absent");
      let replayPermission: object | undefined = retried.complete();
      let replayNumber = 0;
      const replay: PoolLike = {
        async connect() {
          if (abortOccurred) throw persistAbort;
          if (!currentLedgerOk() || !exactOriginalLedger(codes, victimEntry, victimProof) || !replayPermission) {
            throw new Error("HOLD: replay checkout after ambiguous ledger");
          }
          const permission = replayPermission;
          replayPermission = undefined;
          const preceding = consumeCompletion(permission);
          replayNumber += 1;
          const op = new OwnedOperation(
            fixtures.loginA.name, expectedLoginOid(fixtures.loginA), "deadlock-replay", replayNumber,
            () => {
              if (abortOccurred) throw persistAbort;
              return preceding() && currentLedgerOk() && exactOriginalLedger(codes, victimEntry, victimProof);
            },
          );
          ownedAttempts.set(`replay:${replayNumber}`, op);
          const client = await op.connect(replayRaw);
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
        async query() { throw new Error("HOLD: direct replay query has no operation owner"); },
        async end() { throw new Error("HOLD: replay end is owned by case cleanup"); },
      };
      let replayFailed = false;
      let replayPrimary: unknown;
      try {
        for (const request of [
          { key: keyA, tag: tagA, conflict: false },
          { key: keyA, tag: "dl-a-x", conflict: true },
          { key: keyB, tag: tagB, conflict: false },
          { key: keyB, tag: "dl-b-x", conflict: true },
        ]) {
          expect(exactOriginalLedger(codes, victimEntry, victimProof)).toBe(true);
          await expect(recordNonMoneyRefusal(replay, {
            idempotencyKey: request.key, requestTag: request.tag,
          })).resolves.toEqual(request.conflict ? MISMATCH : STORED);
          expect(await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyA,
            () => !abortOccurred && currentLedgerOk())).toEqual(rowA);
          expect(await fetchReservedRow(fx.ownerUrl, fx.bookA, fx.loginA.actorId, keyB,
            () => !abortOccurred && currentLedgerOk())).toEqual(rowB);
          const replayOperation = ownedAttempts.get(`replay:${replayNumber}`);
          if (!replayOperation) throw new Error("HOLD: replay operation did not acquire its own client");
          replayPermission = replayOperation.complete(request.conflict ? {
            sql: "SELECT kita.record_non_money_refusal($1,$2) AS body",
            params: [request.key, request.tag], code: "KRF02",
          } : undefined);
        }
      } catch (primary) {
        replayFailed = true;
        replayPrimary = primary;
        throw primary;
      } finally {
        try {
          await boundedWait(Promise.resolve().then(() => replayRaw.close()), "replay-pool.close", 22_000);
        } catch (cleanup) {
          notePrivate(replayRaw, cleanup);
          if (replayFailed) throw replayPrimary;
          throw cleanup;
        }
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
      failSuite(err);
      abort(err);
      throw err;
    } finally {
      abort(new Error("cleanup"));
      const closes = await Promise.allSettled([
        boundedWait(Promise.allSettled([runA, runB]), "deadlock-drain", 20_000),
        boundedWait(Promise.resolve().then(() => poolA.close()), "deadlock-pool-A.close", 22_000),
        boundedWait(Promise.resolve().then(() => poolB.close()), "deadlock-pool-B.close", 22_000),
      ]);
      const failed = closes.filter((result): result is PromiseRejectedResult => result.status === "rejected");
      if (failed.length > 0) {
        notePrivate(pending, failed.map((result) => result.reason));
        if (suitePrimaryPresent) throw suitePrimary;
        throw failed[0]!.reason;
      }
    }
    } catch (primary) {
      failSuite(primary);
      throw primary;
    }
  });
});
