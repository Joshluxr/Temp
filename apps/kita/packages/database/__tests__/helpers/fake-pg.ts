/**
 * T-CORE-01 acceptance harness — FAKE pg driver only.
 *
 * These specs must run with NO running database and NO network (T-CORE-01-BATCH.md
 * "Required tests and acceptance gates"). Every client here is a recording double: it appends
 * an ordered event to a shared log so tests can prove ordering properties the reviewer checks
 * (e.g. rollback+release strictly BEFORE the next `connect()`, backoff never held inside a
 * transaction). Nothing in this file opens a socket.
 */

export type FakeEvent =
  | { kind: "createPool"; bindingId: string; config: unknown }
  | { kind: "connect"; bindingId: string; client: string }
  | { kind: "query"; bindingId: string; client: string | null; sql: string; params?: readonly unknown[] }
  | { kind: "begin"; bindingId: string; client: string; sql: string }
  | { kind: "commit"; bindingId: string; client: string }
  | { kind: "rollback"; bindingId: string; client: string; ok: boolean }
  | { kind: "release"; bindingId: string; client: string; error: boolean }
  | { kind: "end"; bindingId: string };

export interface PgFailure {
  /** Fires when the client runs this SQL (case-insensitive prefix match). */
  readonly sql: string;
  readonly error: unknown;
}

export interface FakeClientOptions {
  beginError?: unknown;
  commitError?: unknown;
  rollbackError?: unknown;
  queryFailures?: readonly PgFailure[];
}

export interface FakeClientHandle {
  readonly id: string;
  readonly bindingId: string;
  readonly calls: string[];
  readonly releasedWith: unknown[];
  readonly releaseCount: () => number;
  readonly state: () => "open" | "released";
  readonly queries: () => string[];
}

export interface FakePoolHandle {
  readonly bindingId: string;
  readonly connectCount: () => number;
  readonly endCount: () => number;
  readonly clients: () => FakeClientHandle[];
  /** Queues behaviour for the NEXT client created by this driver. */
  readonly queueClient: (options?: FakeClientOptions) => void;
}

/** The structural pool surface `withSerializable` consumes (see src/pool.ts PoolLike). */
export interface PoolLike {
  connect(): Promise<PoolClientLike>;
  query(sql: string, params?: readonly unknown[]): Promise<unknown>;
  end(): Promise<void>;
}

/** pg-style checked-out client surface. */
export interface PoolClientLike {
  query(sql: string, params?: readonly unknown[]): Promise<{ rows: unknown[]; rowCount?: number }>;
  release(err?: unknown): void;
  [key: string]: unknown;
}

export interface FakeDriverHandle {
  readonly bindingId: string;
  readonly configs: unknown[];
  readonly createPoolCalls: number;
  readonly events: FakeEvent[];
  readonly pools: () => FakePoolHandle[];
  readonly lastClient: () => FakeClientHandle;
  readonly clientAt: (index: number) => FakeClientHandle;
  /** Client-side SQL that has already been issued outside a released client (leak detector). */
  readonly openClients: () => FakeClientHandle[];
}

/**
 * Driver extended with per-Pool checkout counters. `connectCount` lives on the POOL the
 * helper checked out from, not on the driver, so specs must reach it through `poolAt(i)`
 * (or `txHarness()`), never through the driver handle.
 */
export interface FakeDriverWithPools extends FakeDriverHandle {
  readonly poolAt: (index: number) => FakePoolHandle & PoolLike;
  readonly lastPool: () => FakePoolHandle & PoolLike;
  readonly totalConnects: () => number;
}

/** A fake `pg.Pool` widened to the structural `PoolLike` surface transaction code consumes. */
export type FakePool = FakePoolHandle & PoolLike;

const SQL_PREFIXES = ["BEGIN", "COMMIT", "ROLLBACK", "START TRANSACTION"];
const isControlSql = (sql: string): boolean => {
  const upper = sql.trim().toUpperCase();
  return SQL_PREFIXES.some((p) => upper.startsWith(p));
};

/** pg errors are structurally `{ code, message }`; retryability MUST come from `code`. */
export const pgError = (code: string, message: string, cause?: unknown): Error & { code: string; cause?: unknown } => {
  const error = new Error(message, cause === undefined ? undefined : { cause }) as Error & { code: string; cause?: unknown };
  error.code = code;
  if (cause !== undefined) error.cause = cause;
  return error;
};

export const SERIALIZATION_FAILURE = (): Error => pgError("40001", "could not serialize access due to read/write dependencies among transactions");
export const DEADLOCK_DETECTED = (): Error => pgError("40P01", "deadlock detected");

interface ClientRecord {
  handle: FakeClientHandle;
  beginError?: unknown;
  commitError?: unknown;
  rollbackError?: unknown;
  queryFailures: PgFailure[];
  consumed: Set<string>;
  events: FakeEvent[];
  releaseCount: number;
  state: "open" | "released";
}

const makeClient = (record: ClientRecord): { query: (sql: string, params?: readonly unknown[]) => Promise<{ rows: unknown[]; rowCount?: number }>; release: (err?: unknown) => void } => {
  const push = (event: FakeEvent): void => { record.events.push(event); };
  const failFor = (sql: string): PgFailure | undefined => {
    const trimmed = sql.trim().toUpperCase();
    return record.queryFailures.find(
      (f) => !record.consumed.has(f.sql) && trimmed.startsWith(f.sql.trim().toUpperCase()),
    );
  };

  return {
    async query(sql: string, params?: readonly unknown[]) {
      record.handle.calls.push(sql);
      push({ kind: "query", bindingId: record.handle.bindingId, client: record.handle.id, sql, ...(params === undefined ? {} : { params }) });
      const upper = sql.trim().toUpperCase();
      if (upper.startsWith("BEGIN") || upper.startsWith("START TRANSACTION")) {
        push({ kind: "begin", bindingId: record.handle.bindingId, client: record.handle.id, sql });
        if (record.beginError !== undefined) throw record.beginError;
        return { rows: [], rowCount: 0 };
      }
      if (upper.startsWith("COMMIT")) {
        if (record.commitError !== undefined) {
          push({ kind: "commit", bindingId: record.handle.bindingId, client: record.handle.id });
          throw record.commitError;
        }
        push({ kind: "commit", bindingId: record.handle.bindingId, client: record.handle.id });
        return { rows: [], rowCount: 0 };
      }
      if (upper.startsWith("ROLLBACK")) {
        if (record.rollbackError !== undefined) {
          push({ kind: "rollback", bindingId: record.handle.bindingId, client: record.handle.id, ok: false });
          throw record.rollbackError;
        }
        push({ kind: "rollback", bindingId: record.handle.bindingId, client: record.handle.id, ok: true });
        return { rows: [], rowCount: 0 };
      }
      const failure = failFor(sql);
      if (failure !== undefined) {
        record.consumed.add(failure.sql);
        throw failure.error;
      }
      return { rows: [{ sql }], rowCount: 1 };
    },
    release(error?: unknown) {
      record.releaseCount += 1;
      record.state = "released";
      record.handle.releasedWith.push(error);
      push({ kind: "release", bindingId: record.handle.bindingId, client: record.handle.id, error: error !== undefined });
    },
  };
};

export interface FakeDriverFactoryOptions {
  /** Optional spy seam for pool-level `query()` (non-checked-out traffic). */
  readonly poolQueryHandler?: (sql: string) => Promise<{ rows: unknown[]; rowCount?: number }>;
}

/**
 * Builds one mock `PoolDriver` bound to a single `bindingId`, so two drivers built with
 * different bindings can never be confused for each other.
 */
export function createFakeDriver(bindingId: string, options: FakeDriverFactoryOptions = {}): FakeDriverHandle {
  const events: FakeEvent[] = [];
  const configs: unknown[] = [];
  const records: ClientRecord[] = [];
  const pending: FakeClientOptions[] = [];
  let createPoolCalls = 0;
  let clientSeq = 0;
  let connectCount = 0;

  const newRecord = (opts: FakeClientOptions | undefined): ClientRecord => {
    const id = `${bindingId}#client-${(clientSeq += 1)}`;
    const record: ClientRecord = {
      handle: {
        id,
        bindingId,
        calls: [],
        releasedWith: [],
        releaseCount: () => record.releaseCount,
        state: () => record.state,
        queries: () => record.handle.calls.filter((c) => !isControlSql(c)),
      },
      ...(opts === undefined ? {} : { beginError: opts.beginError, commitError: opts.commitError, rollbackError: opts.rollbackError }),
      queryFailures: [...(opts?.queryFailures ?? [])],
      consumed: new Set<string>(),
      events,
      releaseCount: 0,
      state: "open" as const,
    };
    records.push(record);
    return record;
  };

  const pool: FakePoolHandle & PoolLike = {
    bindingId,
    connectCount: () => connectCount,
    endCount: () => events.filter((e) => e.kind === "end" && e.bindingId === bindingId).length,
    clients: () => records.map((r) => r.handle),
    queueClient(clientOptions?: FakeClientOptions) {
      if (records.length !== 0) {
        throw new Error(
          `pool.queueClient: refused to arm client #${String(records.length + 1)} — this pool has already handed out ${String(records.length)} checkout(s), so the queued failure would never fire`,
        );
      }
      pending.push(clientOptions ?? {});
    },
    async connect() {
      connectCount += 1;
      const queued = pending.shift();
      const record = newRecord(queued);
      events.push({ kind: "connect", bindingId, client: record.handle.id });
      const client = makeClient(record);
      // Spread the recording client so `[k: string]: unknown` index-signature conformance holds.
      return { ...client };
    },
    async query(sql: string, params?: readonly unknown[]) {
      events.push({ kind: "query", bindingId, client: null, sql, ...(params === undefined ? {} : { params }) });
      if (options.poolQueryHandler !== undefined) return options.poolQueryHandler(sql);
      return { rows: [], rowCount: 0 };
    },
    async end() {
      events.push({ kind: "end", bindingId });
    },
  };

  const driver: FakeDriverWithPools = {
    bindingId,
    configs,
    get createPoolCalls() {
      return createPoolCalls;
    },
    events,
    pools: () => [pool],
    poolAt: () => pool,
    lastPool: () => pool,
    totalConnects: () => connectCount,
    lastClient: () => records[records.length - 1]!.handle,
    clientAt: (index: number) => records[index]!.handle,
    // Driver-level arming is only meaningful while the driver owns a single Pool instance.
    queueClient(clientOptions?: FakeClientOptions) {
      pool.queueClient(clientOptions);
    },
    openClients: () => records.filter((r) => r.state === "open").map((r) => r.handle),
    createPool(config: unknown) {
      createPoolCalls += 1;
      configs.push(config);
      events.push({ kind: "createPool", bindingId, config });
      return pool;
    },
  };
  return driver;
}

/* ------------------------------------------------------- transaction harness */

/**
 * One-stop harness for `withSerializable`: a bound fake driver, the Pool it exposes, and a
 * `queueAttempt` that provably targets THAT pool (an unbounded `connect()` helper would
 * otherwise silently fall back to the lazy pg adapter and try to reach a real server).
 */
export interface TxHarness {
  readonly driver: FakeDriverWithPools;
  readonly pool: FakePool;
  readonly bindingId: string;
  /** Checkout count on the injected pool — the value under test's `pool.connect()` calls. */
  readonly connects: () => number;
  /** Queues behaviour for the next client this pool hands out. Always hits the fake. */
  readonly queueAttempt: (options?: FakeClientOptions) => void;
  readonly eventKinds: () => string[];
  readonly clientAt: (index: number) => FakeClientHandle;
  readonly openClients: () => FakeClientHandle[];
}

export function txHarness(bindingId = "TX"): TxHarness {
  const driver = createFakeDriver(bindingId);
  // Explicit injected pool: nothing here can construct a real pg.Pool.
  const pool = driver.createPool({ connectionString: `postgres://db.internal:5432/${bindingId.toLowerCase()}_lane` });
  return {
    driver,
    pool,
    bindingId,
    connects: () => pool.connectCount(),
    queueAttempt: (options?: FakeClientOptions) => {
      if (driver.createPoolCalls !== 1) throw new Error("txHarness: pool was not built through the fake driver");
      driver.queueClient(options);
    },
    eventKinds: () => driver.events.map((e) => e.kind),
    clientAt: (index: number) => driver.clientAt(index),
    openClients: () => driver.openClients(),
  };
}

/* ------------------------------------------------------------------ helpers */

export const sqlLog = (events: readonly FakeEvent[]): string[] =>
  events.filter((e) => e.kind === "query").map((e) => (e as { sql: string }).sql);

export const kinds = (events: readonly FakeEvent[]): string[] => events.map((e) => e.kind);

export const eventsOfKind = (events: readonly FakeEvent[], kind: FakeEvent["kind"]): FakeEvent[] =>
  events.filter((e) => e.kind === kind);

export const nthIndexOf = (list: readonly string[], value: string, n: number): number => {
  let index = -1;
  for (let i = 0; i < n; i += 1) {
    index = list.indexOf(value, index + 1);
    if (index === -1) return -1;
  }
  return index;
};

/** Deterministic sleep double: records the ms requested instead of waiting. */
export function fakeSleep(): { sleep: (ms: number) => Promise<void>; delays: () => number[] } {
  const delays: number[] = [];
  return {
    delays: () => [...delays],
    sleep: async (ms: number) => {
      delays.push(ms);
    },
  };
}
