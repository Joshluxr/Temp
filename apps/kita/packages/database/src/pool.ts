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

/** Minimal structural driver shape accepted by createPool. Deliberately looser than
 * PoolDriver (config parameter may be typed `unknown`, return may be a promise) so test
 * recording doubles satisfy it without importing this module's types. */
export interface AcceptablePoolDriver {
  createPool(config: any): unknown | PromiseLike<unknown>;
}

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

function resolveConfig(bindings: DatabaseBindings): PoolConfigInput {
  if (typeof bindings.databaseUrl !== "string" || bindings.databaseUrl.trim().length === 0) {
    // Never echo the URL itself: it may carry credentials. Names the field, not the value.
    throw new PoolError("pool config: databaseUrl must be a non-empty string");
  }
  const numeric: Partial<Record<(typeof LIMIT_KEYS)[number][1], number>> = {};
  for (const [bindingKey, configKey] of LIMIT_KEYS) {
    const value = bindings[bindingKey];
    if (value === undefined) continue;
    if (!Number.isInteger(value) || value <= 0) {
      throw new PoolError(`pool config: ${bindingKey} must be a positive finite integer`);
    }
    numeric[configKey] = value;
  }
  return Object.freeze({ connectionString: bindings.databaseUrl, ...numeric }) as PoolConfigInput;
}

let defaultDriver: PoolDriver | undefined;

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

function pgDriver(): PoolDriver {
  if (defaultDriver === undefined) {
    defaultDriver = {
      createPool(config: PoolConfigInput): PoolLike {
        let inner: PgPoolLike | undefined;
        let pending: Promise<PgPoolLike> | undefined;
        const ensure = (): Promise<PgPoolLike> => {
          if (inner !== undefined) return Promise.resolve(inner);
          if (pending === undefined) {
            pending = loadPgPoolCtor().then((Pool) => (inner = new Pool(config)));
          }
          return pending;
        };
        return {
          connect: () => ensure().then((p) => p.connect()),
          query: (sql, params) => ensure().then((p) => p.query(sql, params)),
          end: () => ensure().then((p) => p.end()),
        };
      },
    };
  }
  return defaultDriver;
}

/** Redact credentials from a database URL so diagnostics, logs, and error messages
 * never leak userinfo or secret-looking query parameters. */
export function sanitizeDatabaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.password !== "") parsed.password = "***";
    // Username is host-identifying rather than secret material; only the password is masked.
    return parsed.toString();
  } catch {
    // Unparseable: assume it may still embed secrets and redact aggressively.
    return url.replace(/([?&](?:password|secret|token|apikey|api_key)=)[^&]*/gi, "$1***");
  }
}

export function createPool(
  bindings: DatabaseBindings,
  options?: { driver?: PoolDriver | AcceptablePoolDriver },
): ManagedPool {
  const config = resolveConfig(bindings);
  const driver = options?.driver ?? pgDriver();
  // Per-instance state only: nothing is registered in any module-level table, so
  // instances cannot observe or mutate each other's pools or configs.
  let poolPromise: Promise<PoolLike> | undefined;
  const getPool = (): Promise<PoolLike> => {
    if (poolPromise === undefined) {
      poolPromise = Promise.resolve(driver.createPool(config) as PoolLike);
    }
    return poolPromise;
  };
  let closed = false;

  const assertOpen = (what: string): void => {
    if (closed) {
      throw new PoolError(`${what}: pool is closed (${sanitizeDatabaseUrl(config.connectionString)})`);
    }
  };

  return {
    config,
    get isClosed(): boolean {
      return closed;
    },
    acquire(): Promise<PoolClientLike> {
      assertOpen("acquire");
      return getPool().then((p) => p.connect());
    },
    connect(): Promise<PoolClientLike> {
      assertOpen("connect");
      return getPool().then((p) => p.connect());
    },
    query(sql: string, params?: readonly unknown[]): Promise<unknown> {
      assertOpen("query");
      return getPool().then((p) => p.query(sql, params));
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
