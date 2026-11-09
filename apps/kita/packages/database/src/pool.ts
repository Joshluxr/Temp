/**
 * T-CORE-01 pool ownership and isolation.
 *
 * createPool() receives an already-validated, frozen bindings object and returns an
 * instance that owns its pool outright: no import-time connections, no hidden global
 * pool, no process-wide binding cache, no implicit database URLs. The driver is
 * injectable so tests construct pools against mocks without any network; the default
 * pg adapter resolves `pg` lazily so merely importing this file connects to nothing.
 * Closing one instance never touches another's configuration or clients.
 */

/** Frozen, validated bindings handed to createPool. Produced by the runtime config
 * module (T-CORE-01 scope); declared here so pool.ts owns its input contract and
 * stays testable without importing a config layer. */
export interface DatabaseBindings {
  readonly databaseUrl: string;
  readonly poolMax?: number;
  readonly statementTimeoutMs?: number;
  readonly connectionTimeoutMs?: number;
  readonly idleTimeoutMs?: number;
}

/** The resolved, validated configuration handed to a PoolDriver. */
export interface PoolConfigInput {
  readonly connectionString: string;
  readonly max?: number;
  readonly statementTimeoutMs?: number;
  readonly connectionTimeoutMs?: number;
  readonly idleTimeoutMs?: number;
}

export interface PoolClientLike {
  query(sql: string, params?: readonly unknown[]): Promise<{ rows: any[]; rowCount?: number }>;
  release(err?: unknown): void; // driver-style release; MUST be called exactly once per checkout by callers
  [key: string]: unknown; // pass-through so pg.PoolClient satisfies it structurally
}

export interface PoolLike {
  connect(): Promise<PoolClientLike>;
  query(sql: string, params?: readonly unknown[]): Promise<unknown>;
  end(): Promise<void>;
}

export interface PoolDriver {
  /** Synchronous by contract: mock drivers stay deterministic; the built-in pg adapter
   * defers its lazy module load to the first awaited operation instead. */
  createPool(config: PoolConfigInput): PoolLike;
}

/** The driver surface createPool consumes: a duck-typed `createPool` member (extra
 * members allowed, config parameter may be typed `unknown`, return may be a promise) so
 * test recording doubles satisfy it without importing this module's types. */
export type AcceptablePoolDriver = {
  createPool(config: any): unknown | PromiseLike<unknown>;
};

export interface ManagedPool extends PoolLike {
  readonly config: Readonly<PoolConfigInput>;
  acquire(): Promise<PoolClientLike>;
  close(): Promise<void>;
  readonly isClosed: boolean;
}

export class PoolError extends Error {}

const LIMIT_KEYS = [
  ["poolMax", "max"],
  ["statementTimeoutMs", "statementTimeoutMs"],
  ["connectionTimeoutMs", "connectionTimeoutMs"],
  ["idleTimeoutMs", "idleTimeoutMs"],
] as const;

type ConfigLimitKey = (typeof LIMIT_KEYS)[number][1];

function resolveConfig(bindings: DatabaseBindings): PoolConfigInput {
  if (typeof bindings.databaseUrl !== "string" || bindings.databaseUrl.trim().length === 0) {
    // Never echo the URL itself: it may carry credentials. Names the field, not the value.
    throw new PoolError("pool config: databaseUrl must be a non-empty string");
  }
  // Fail closed on every limit BEFORE any driver is consulted.
  let max: number | undefined;
  let statementTimeoutMs: number | undefined;
  let connectionTimeoutMs: number | undefined;
  let idleTimeoutMs: number | undefined;
  for (const [bindingKey, configKey] of LIMIT_KEYS) {
    const value = bindings[bindingKey];
    if (value === undefined) continue;
    if (!Number.isInteger(value) || value <= 0) {
      throw new PoolError(`pool config: ${bindingKey} must be a positive finite integer`);
    }
    switch (configKey satisfies ConfigLimitKey) {
      case "max":
        max = value;
        break;
      case "statementTimeoutMs":
        statementTimeoutMs = value;
        break;
      case "connectionTimeoutMs":
        connectionTimeoutMs = value;
        break;
      case "idleTimeoutMs":
        idleTimeoutMs = value;
        break;
    }
  }
  // Built explicitly rather than spread-cast: under exactOptionalPropertyTypes an absent
  // limit must stay truly absent (not present-and-undefined) in the frozen config.
  return Object.freeze({
    connectionString: bindings.databaseUrl,
    ...(max !== undefined ? { max } : {}),
    ...(statementTimeoutMs !== undefined ? { statementTimeoutMs } : {}),
    ...(connectionTimeoutMs !== undefined ? { connectionTimeoutMs } : {}),
    ...(idleTimeoutMs !== undefined ? { idleTimeoutMs } : {}),
  });
}

interface PgPoolLike {
  connect(): Promise<PoolClientLike>;
  query(sql: string, params?: readonly unknown[]): Promise<unknown>;
  end(): Promise<void>;
}

interface PgPoolCtor {
  new (config: unknown): PgPoolLike;
}

async function loadPgPoolCtor(): Promise<PgPoolCtor> {
  // Dynamic specifier + @vite-ignore: `pg` is required only when a pool actually
  // builds, so importing pool.ts never loads a driver that could open connections.
  const pg: any = await import(/* @vite-ignore */ "pg");
  const ctor = (pg?.default?.Pool ?? pg?.Pool) as PgPoolCtor | undefined;
  if (typeof ctor !== "function") {
    throw new PoolError("pool driver: installed pg module exposes no Pool constructor");
  }
  return ctor;
}

// Module-level memo of the stateless pg *driver factory* — not a pool, binding, or config
// cache. Every createPool() call still gets its own lazily-built Pool below, so instances
// share nothing but this immutable lookup closure; nothing here mutates per-instance state.
let defaultDriverMemo: PoolDriver | undefined;

function pgDriver(): PoolDriver {
  if (defaultDriverMemo === undefined) {
    defaultDriverMemo = Object.freeze<PoolDriver>({
      createPool(config: PoolConfigInput): PoolLike {
        // Per-pool state, captured by these closures only: two pools built by the same
        // factory never observe or end each other's underlying pg.Pool.
        let inner: PgPoolLike | undefined;
        let pending: Promise<PgPoolCtor> | undefined;
        const ensure = (): Promise<PgPoolLike> => {
          if (inner !== undefined) return Promise.resolve(inner);
          if (pending === undefined) {
            pending = loadPgPoolCtor();
          }
          return pending.then((Pool) => (inner ??= new Pool(config)));
        };
        return {
          connect: () => ensure().then((p) => p.connect()),
          query: (sql, params) => ensure().then((p) => p.query(sql, params)),
          end: () => ensure().then((p) => p.end()),
        };
      },
    });
  }
  return defaultDriverMemo;
}

/** Query-parameter names whose values are secret material rather than behaviour switches. */
const SECRET_QUERY_KEY = /(?:^|[^a-z])(?:pass|secret|token|key|credential|password|authorization)(?:$|[^a-z])/iu;
const MASK = "***";

function maskQueryParams(search: string): string {
  // Deterministic, order-preserving re-emission: split on raw `&` pairs so a value
  // containing `=` survives untouched.
  return search
    .replace(/^\?/, "")
    .split("&")
    .map((pair) => {
      if (pair.length === 0) return pair;
      const eq = pair.indexOf("=");
      const name = (eq === -1 ? pair : pair.slice(0, eq)).toLowerCase();
      return SECRET_QUERY_KEY.test(name) ? `${name}=${MASK}` : pair;
    })
    .join("&");
}

/** Redact credentials from a database URL so diagnostics, logs, and error messages
 * never leak userinfo or secret-looking query parameters. Total: never throws. */
export function sanitizeDatabaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Both halves of userinfo are credential-bearing in DATABASE_URL-style strings,
    // so neither survives into a diagnostic.
    if (parsed.username !== "") parsed.username = MASK;
    if (parsed.password !== "") parsed.password = MASK;
    if (parsed.search.length > 0) parsed.search = maskQueryParams(parsed.search);
    return parsed.toString();
  } catch {
    // Unparseable: assume it may still embed secrets and redact aggressively, covering
    // both the userinfo run and secret-bearing query values without touching host/path.
    return url
      .replace(/\/\/[^/@:?#]*:[^/@?#]*@/u, "//[invalid-url]")
      .replace(
        /([?&](?:[^=&]*(?:pass|secret|token|key|credential|authoriz)[^=&]*)=)[^&]*/giu,
        `$1${MASK}`,
      );
  }
}

export function createPool(
  bindings: DatabaseBindings,
  options?: { driver?: PoolDriver | AcceptablePoolDriver },
): ManagedPool {
  // Validation happens first, so a bad binding fails closed before any driver call.
  const config = resolveConfig(bindings);
  // Structural view of the injected driver: only the createPool member is consumed, so
  // mock handles carrying extra recording surface stay assignable.
  const driver: AcceptablePoolDriver | PoolDriver = options?.driver ?? pgDriver();
  if (typeof driver.createPool !== "function") {
    throw new PoolError("pool driver: injected driver must expose createPool(config)");
  }

  // Per-instance state only: nothing is registered in any module-level table, so
  // instances cannot observe or mutate each other's pools or configs.
  let poolPromise: Promise<PoolLike> | undefined;
  const getPool = (): Promise<PoolLike> => {
    if (poolPromise === undefined) {
      poolPromise = Promise.resolve(driver.createPool(config) as PoolLike);
    }
    return poolPromise;
  };
  // Build this instance's driver pool now, from this instance's own frozen config. The pg
  // adapter stays lazy here: createPool() only closes over the specifier, and `pg` itself
  // loads on first awaited operation, so construction still opens no connection.
  void getPool();
  let closed = false;

  const assertOpen = (what: string): void => {
    if (closed) {
      throw new PoolError(`${what}: pool is closed (${sanitizeDatabaseUrl(config.connectionString)})`);
    }
  };

  const guarded = <T>(what: string, run: (p: PoolLike) => Promise<T>): Promise<T> => {
    assertOpen(what);
    return getPool().then(run);
  };

  return {
    config,
    get isClosed(): boolean {
      return closed;
    },
    acquire(): Promise<PoolClientLike> {
      return guarded("acquire", (p) => p.connect());
    },
    connect(): Promise<PoolClientLike> {
      return guarded("connect", (p) => p.connect());
    },
    query(sql: string, params?: readonly unknown[]): Promise<unknown> {
      return guarded("query", (p) => p.query(sql, params));
    },
    async close(): Promise<void> {
      if (closed) return; // idempotent shutdown
      closed = true;
      await (await getPool()).end();
    },
    end(): Promise<void> {
      return this.close();
    },
  };
}
