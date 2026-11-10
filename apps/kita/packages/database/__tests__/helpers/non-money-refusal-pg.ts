/**
 * Isolated PostgreSQL 18 harness for the non-money refusal-record slice.
 * Requires an explicit KITA_REFUSAL_TEST_OWNER_URL. No default credentials.
 */

import { randomBytes } from "node:crypto";

import pg from "pg";

import { createPool, type ManagedPool } from "../../src/pool.js";

const PINNED_HOST = "127.0.0.1";
const PINNED_PORT = "54339";
const PINNED_USER = "kita_test";
const PINNED_DB = "kita_core_test";

export function requireRefusalOwnerUrl(): string {
  const urlText = process.env.KITA_REFUSAL_TEST_OWNER_URL;
  if (typeof urlText !== "string" || urlText.length === 0) {
    throw new Error("KITA_REFUSAL_TEST_OWNER_URL is required");
  }
  let parsed: URL;
  try {
    parsed = new URL(urlText);
  } catch {
    throw new Error("KITA_REFUSAL_TEST_OWNER_URL is not a valid URL");
  }
  if (parsed.hostname !== PINNED_HOST) {
    throw new Error("KITA_REFUSAL_TEST_OWNER_URL host is not the pinned test host");
  }
  if (parsed.port !== PINNED_PORT) {
    throw new Error("KITA_REFUSAL_TEST_OWNER_URL port is not the pinned test port");
  }
  if (parsed.username !== PINNED_USER) {
    throw new Error("KITA_REFUSAL_TEST_OWNER_URL login is not the pinned test owner");
  }
  const database = parsed.pathname.replace(/^\//, "");
  if (database !== PINNED_DB) {
    throw new Error("KITA_REFUSAL_TEST_OWNER_URL database is not the pinned test database");
  }
  return urlText;
}

export function postgresSuiteSelected(): boolean {
  return process.env.KITA_REFUSAL_PG_TEST === "1";
}

export type RestrictedLogin = {
  readonly name: string;
  readonly url: string;
  readonly actorId: string;
};

export type RefusalPgFixtures = {
  readonly ownerUrl: string;
  readonly bookA: string;
  readonly bookC: string;
  readonly loginA: RestrictedLogin;
  readonly loginB: RestrictedLogin;
  readonly loginC: RestrictedLogin;
  readonly loginUnbound: RestrictedLogin;
  poolFor(url: string): ManagedPool;
  close(): Promise<void>;
};

const CLIENT_TIMEOUT = {
  connectionTimeoutMillis: 10_000,
  statement_timeout: 15_000,
} as const;

type CloseAccount = {
  readonly stage: string;
  readonly code: string;
  readonly connected: boolean;
};

function closeAccount(stage: string, err: unknown, connected: boolean): CloseAccount {
  let code = "CLOSE_FAILED";
  try {
    if (typeof err === "object" && err !== null && "code" in err) {
      const value = (err as { code?: unknown }).code;
      if (typeof value === "string") code = value;
    }
  } catch {
    code = "CLOSE_FAILED";
  }
  return { stage, code, connected };
}

const hiddenSecondaries = new WeakMap<object, unknown[]>();

function hideSecondary(owner: object, err: unknown): void {
  const prior = hiddenSecondaries.get(owner) ?? [];
  prior.push(err);
  hiddenSecondaries.set(owner, prior);
}

function cleanupError(accounts: readonly CloseAccount[], raw: unknown): Error {
  const summary = accounts.map((a) => `${a.stage}:${a.code}:connected=${a.connected}`).join(";");
  const error = new Error(`cleanup failed ${summary}`);
  (error as { closeAccounts?: readonly CloseAccount[] }).closeAccounts = accounts;
  hideSecondary(error, raw);
  return error;
}

function retainCleanup<T>(owner: object, primary: T, accounts: readonly CloseAccount[], raw: unknown): T {
  hideSecondary(owner, accounts);
  hideSecondary(owner, raw);
  hideSecondary(owner, primary);
  if ((typeof primary === "object" && primary !== null) || typeof primary === "function") {
    hideSecondary(primary as object, accounts);
    hideSecondary(primary as object, raw);
    return primary;
  }
  throw primary;
}

type LateOutcome =
  | { readonly status: "fulfilled"; readonly value?: unknown }
  | { readonly status: "rejected"; readonly reason: unknown; readonly reasonDefined: boolean }
  | { readonly status: "pending" }
  | { readonly status: "sync"; readonly reason: unknown };

type CloseLedger = { current: LateOutcome; readonly work: Promise<unknown> };

function watchUntilSettled(work: Promise<unknown>): CloseLedger {
  const ledger: CloseLedger = { current: { status: "pending" }, work };
  void work.then(
    (value) => {
      ledger.current = { status: "fulfilled", value };
    },
    (reason: unknown) => {
      ledger.current = { status: "rejected", reason, reasonDefined: reason !== undefined };
    },
  );
  return ledger;
}

async function observeLate(work: Promise<unknown>, ms: number): Promise<LateOutcome> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work.then(
        (value) => ({ status: "fulfilled" as const, value }),
        (reason: unknown) => ({
          status: "rejected" as const,
          reason,
          reasonDefined: reason !== undefined,
        }),
      ),
      new Promise<LateOutcome>((resolve) => {
        timer = setTimeout(() => resolve({ status: "pending" }), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function bounded<T>(stage: string, work: Promise<T>, ms = 20_000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutErr = Object.assign(new Error(`timeout:${stage}`), { kitaWatchdog: true as const });
  const timeout = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(timeoutErr), ms);
  });
  try {
    return await Promise.race([work, timeout]);
  } catch (err) {
    const late = await observeLate(work, 1_000);
    const watchdog = err === timeoutErr;
    if (!watchdog) {
      if (err && typeof err === "object") {
        hideSecondary(err, late);
        throw err;
      }
      const boxed = new Error(`close-rejected:${stage}`);
      hideSecondary(boxed, err);
      hideSecondary(boxed, late);
      throw boxed;
    }
    if (timeoutErr && typeof timeoutErr === "object") {
      hideSecondary(timeoutErr, late);
      throw timeoutErr;
    }
    throw timeoutErr;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function endOwnerClient(
  client: pg.Client,
  connected: boolean,
): Promise<{ account?: CloseAccount; raw?: unknown; ledger?: CloseLedger }> {
  let ending: Promise<void>;
  try {
    ending = Promise.resolve(client.end());
  } catch (sync) {
    ending = Promise.reject(sync);
  }
  const ledger = watchUntilSettled(ending);
  try {
    await bounded("owner-client.end", ending, 22_000);
    return { ledger };
  } catch (err) {
    const late = await observeLate(ending, 1_000);
    const raw = { first: err, late, ledger };
    if (err && typeof err === "object") {
      hideSecondary(err, ledger);
      hideSecondary(err, raw);
    }
    return { account: closeAccount("owner-client.end", err, connected), raw };
  }
}

export function ownerClient(ownerUrl: string): pg.Client {
  return new pg.Client({
    connectionString: ownerUrl,
    connectionTimeoutMillis: CLIENT_TIMEOUT.connectionTimeoutMillis,
    statement_timeout: CLIENT_TIMEOUT.statement_timeout,
  });
}

async function withOwnerClient<T>(ownerUrl: string, fn: (client: pg.Client) => Promise<T>): Promise<T> {
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
    const ended = await endOwnerClient(client, connected);
    if (ended.account) {
      if (failed) {
        retainCleanup(client, primary, [ended.account], ended.raw);
      } else {
        throw cleanupError([ended.account], ended.raw);
      }
    }
  }
}

export async function assertRefusalSecurityPreflight(): Promise<void> {
  const ownerUrl = requireRefusalOwnerUrl();
  await withOwnerClient(ownerUrl, async (client) => {
    const row = (
      await client.query<{
        server_version_num: string;
        current_database: string;
        session_user: string;
        current_user: string;
        schema_owner: string;
        fsync: string;
        full_page_writes: string;
        synchronous_commit: string;
        rolsuper: boolean;
        rolcreaterole: boolean;
        replication_role: string;
        fn_owner: string;
        fn_hash: string;
        fn_len: string;
        prosecdef: boolean;
        temp_grant: string;
      }>(
        `SELECT current_setting('server_version_num') AS server_version_num,
                current_database() AS current_database,
                session_user AS session_user,
                current_user AS current_user,
                (SELECT pg_get_userbyid(n.nspowner) FROM pg_namespace n WHERE n.nspname = 'kita') AS schema_owner,
                current_setting('fsync') AS fsync,
                current_setting('full_page_writes') AS full_page_writes,
                current_setting('synchronous_commit') AS synchronous_commit,
                (SELECT rolsuper FROM pg_roles WHERE rolname = current_user) AS rolsuper,
                (SELECT rolcreaterole FROM pg_roles WHERE rolname = current_user) AS rolcreaterole,
                current_setting('session_replication_role') AS replication_role,
                (SELECT pg_get_userbyid(p.proowner)
                   FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                  WHERE n.nspname = 'kita' AND p.proname = 'record_non_money_refusal'
                    AND pg_get_function_identity_arguments(p.oid) = 'p_key text, p_tag text') AS fn_owner,
                (SELECT encode(sha256(convert_to(p.prosrc, 'UTF8')), 'hex')
                   FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                  WHERE n.nspname = 'kita' AND p.proname = 'record_non_money_refusal'
                    AND pg_get_function_identity_arguments(p.oid) = 'p_key text, p_tag text') AS fn_hash,
                (SELECT length(p.prosrc)::text
                   FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                  WHERE n.nspname = 'kita' AND p.proname = 'record_non_money_refusal'
                    AND pg_get_function_identity_arguments(p.oid) = 'p_key text, p_tag text') AS fn_len,
                (SELECT p.prosecdef
                   FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                  WHERE n.nspname = 'kita' AND p.proname = 'record_non_money_refusal'
                    AND pg_get_function_identity_arguments(p.oid) = 'p_key text, p_tag text') AS prosecdef,
                (SELECT count(*)::text
                   FROM pg_auth_members m
                   JOIN pg_roles r ON r.oid = m.member
                   JOIN pg_roles g ON g.oid = m.roleid
                   JOIN pg_roles grantor ON grantor.oid = m.grantor
                  WHERE r.rolname = 'kita_test'
                    AND g.rolname = 'kita_refusal_definer'
                    AND grantor.rolname = 'kita_test') AS temp_grant`,
      )
    ).rows[0];
    if (!row) throw new Error("HOLD: preflight returned no row");
    if (row.server_version_num !== "180006") throw new Error("HOLD: not PostgreSQL 18.6");
    if (row.current_database !== "kita_core_test") throw new Error("HOLD: wrong database");
    if (row.session_user !== "kita_test" || row.current_user !== "kita_test") {
      throw new Error("HOLD: owner session is not kita_test");
    }
    if (row.rolsuper || !row.rolcreaterole) throw new Error("HOLD: installer attributes unexpected");
    if (row.schema_owner !== "kita_test") throw new Error("HOLD: schema owner is not kita_test");
    if (row.fsync !== "on" || row.full_page_writes !== "on" || row.synchronous_commit !== "on") {
      throw new Error("HOLD: durability settings are not on");
    }
    if (row.replication_role !== "origin") throw new Error("HOLD: session_replication_role is not origin");
    if (row.fn_owner !== "kita_refusal_definer" || row.prosecdef !== true) {
      throw new Error("HOLD: function owner/security mismatch");
    }
    if (row.fn_len !== "3950" || row.fn_hash !== "a6140caff93ff7a014ee33ae6c32bb669f8bd75322580fdaafc9c3179f76898a") {
      throw new Error("HOLD: installed 006 body hash mismatch");
    }
    if (row.temp_grant !== "0") throw new Error("HOLD: temporary definer membership is present");
  });
}

function quoteIdent(name: string): string {
  if (!/^[A-Za-z0-9_]+$/.test(name)) {
    throw new Error("invalid ident");
  }
  return `"${name}"`;
}

function password(): string {
  return `pw_${randomBytes(16).toString("hex")}`;
}

function loginUrl(ownerUrl: string, name: string, secret: string): string {
  const parsed = new URL(ownerUrl);
  parsed.username = name;
  parsed.password = secret;
  return parsed.toString();
}

export async function fetchReservedHash(
  ownerUrl: string,
  bookId: string,
  actorId: string,
  key: string,
): Promise<string | undefined> {
  return withOwnerClient(ownerUrl, async (client) => {
    const result = await client.query<{ request_hash: string }>(
      `SELECT request_hash
       FROM kita.command_keys
       WHERE book_id = $1 AND actor_id = $2 AND operation = 'recordNonMoneyRefusal.v1' AND key = $3`,
      [bookId, actorId, key],
    );
    return result.rows[0]?.request_hash;
  });
}

export async function countReservedRows(
  ownerUrl: string,
  bookId: string,
  actorId: string,
  key: string,
): Promise<number> {
  return withOwnerClient(ownerUrl, async (client) => {
    const result = await client.query<{ n: string }>(
      `SELECT count(*)::text AS n
       FROM kita.command_keys
       WHERE book_id = $1 AND actor_id = $2 AND operation = 'recordNonMoneyRefusal.v1' AND key = $3`,
      [bookId, actorId, key],
    );
    return Number(result.rows[0]?.n ?? "0");
  });
}

export function createRefusalPoolRegistry(build: (url: string) => ManagedPool): {
  poolFor(url: string): ManagedPool;
  close(): Promise<void>;
} {
  const pools = new Map<string, ManagedPool>();
  const originalCloses = new Map<string, { work: Promise<unknown>; ledger: CloseLedger }>();
  let closing = false;
  let closeReport: Promise<void> | undefined;
  return {
    poolFor(url: string): ManagedPool {
      if (closing) {
        throw new Error("HOLD: fixture closing; pool acquisition refused");
      }
      const existing = pools.get(url);
      if (existing) return existing;
      const pool = build(url);
      pools.set(url, pool);
      return pool;
    },
    close(): Promise<void> {
      closing = true;
      if (closeReport) return closeReport;
      closeReport = (async () => {
        const owned = [...pools.entries()];
        const ledgers = owned.map(([url, pool]) => {
          const prior = originalCloses.get(url);
          if (prior) return { url, work: prior.work, ledger: prior.ledger };
          let work: Promise<void>;
          try {
            work = Promise.resolve(pool.close());
          } catch (sync) {
            work = Promise.reject({ status: "sync" as const, reason: sync });
          }
          const ledger = watchUntilSettled(work);
          originalCloses.set(url, { work, ledger });
          void work.then(
            () => {
              pools.delete(url);
            },
            () => {
              pools.delete(url);
            },
          );
          return { url, work, ledger };
        });
        const observed = await Promise.allSettled(
          ledgers.map((item) => bounded("pool.close", item.work, 21_000)),
        );
        const rejected = observed.filter((result): result is PromiseRejectedResult => result.status === "rejected");
        if (rejected.length === 0) return;
        const accounts = rejected.map((result, index) => closeAccount(`pool.close[${index}]`, result.reason, true));
        const error = cleanupError(accounts, rejected.map((result) => result.reason));
        hideSecondary(error, ledgers.map((item) => item.ledger));
        throw error;
      })();
      return closeReport;
    },
  };
}

export async function provisionRefusalFixtures(): Promise<RefusalPgFixtures> {
  await assertRefusalSecurityPreflight();
  const ownerUrl = requireRefusalOwnerUrl();
  const client = ownerClient(ownerUrl);
  const provisioned = {
    booksAttempted: 0,
    booksAcknowledged: 0,
    booksUncertain: 0,
    loginsAttempted: 0,
    loginsAcknowledged: 0,
    loginsUncertain: 0,
    grantsAttempted: 0,
    grantsAcknowledged: 0,
    grantsUncertain: 0,
    principalsAttempted: 0,
    principalsAcknowledged: 0,
    principalsUncertain: 0,
    retainedBookIds: [] as string[],
    retainedLoginNames: [] as string[],
    attemptedLoginNames: [] as string[],
    retainedLoginOids: [] as string[],
    retainedBindings: [] as Array<{ loginName: string; loginOid: string; bookId: string; actorId: string }>,
  };
  let connected = false;
  let failed = false;
  let primary: unknown;
  try {
    await client.connect();
    connected = true;
    const version = await client.query<{ version: string }>("SELECT version()");
    if (!version.rows[0]?.version.includes("PostgreSQL 18.")) {
      throw new Error(`expected PostgreSQL 18, got ${version.rows[0]?.version ?? "unknown"}`);
    }
    const suffix = randomBytes(4).toString("hex");
    async function insertDisabledBook(legalEntity: string): Promise<string> {
      const acknowledgedBefore = provisioned.booksAcknowledged;
      provisioned.booksAttempted += 1;
      try {
        const inserted = await client.query<{ id: string }>(
          `INSERT INTO kita.books (legal_entity, functional_currency, status)
           VALUES ($1, 'USD', 'disabled') RETURNING id`,
          [legalEntity],
        );
        const id = inserted.rows[0]?.id;
        if (!id) throw new Error("HOLD: book insert returned no id");
        provisioned.booksAcknowledged += 1;
        provisioned.retainedBookIds.push(id);
        return id;
      } catch (err) {
        if (provisioned.booksAcknowledged === acknowledgedBefore) provisioned.booksUncertain += 1;
        throw err;
      }
    }
    const bookAId = await insertDisabledBook(`refusal-a-${suffix}`);
    const bookCId = await insertDisabledBook(`refusal-c-${suffix}`);

    async function makeLogin(
      name: string,
      actorId: string | null,
      bookId: string | null,
    ): Promise<RestrictedLogin> {
      const secret = password();
      const loginsAckBefore = provisioned.loginsAcknowledged;
      const grantsAckBefore = provisioned.grantsAcknowledged;
      const principalsAckBefore = provisioned.principalsAcknowledged;
      provisioned.loginsAttempted += 1;
      provisioned.attemptedLoginNames.push(name);
      try {
      const createSql = await client.query<{ sql: string }>(
        `SELECT format(
           'CREATE ROLE %I LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE INHERIT NOREPLICATION NOBYPASSRLS',
           $1::text, $2::text
         ) AS sql`,
        [name, secret],
      );
      const createText = createSql.rows[0]?.sql;
      if (!createText) throw new Error("HOLD: CREATE ROLE sql missing");
      await client.query(createText);
      provisioned.loginsAcknowledged += 1;
      provisioned.retainedLoginNames.push(name);
      const oidRow = await client.query<{ oid: string }>(
        `SELECT oid::text AS oid FROM pg_catalog.pg_roles WHERE rolname = $1`,
        [name],
      );
      const loginOid = oidRow.rows[0]?.oid;
      if (!loginOid) throw new Error("HOLD: login oid missing after CREATE ROLE");
      provisioned.retainedLoginOids.push(loginOid);
      provisioned.grantsAttempted += 1;
      const grantSql = await client.query<{ sql: string }>(
        `SELECT format('GRANT kita_refusal_recorder TO %I WITH INHERIT TRUE, SET FALSE', $1::text) AS sql`,
        [name],
      );
      const grantText = grantSql.rows[0]?.sql;
      if (!grantText) throw new Error("HOLD: GRANT recorder sql missing");
      await client.query(grantText);
      provisioned.grantsAcknowledged += 1;
      if (actorId !== null && bookId !== null) {
        provisioned.principalsAttempted += 1;
        const principalInsert = await client.query(
          `INSERT INTO kita.non_money_refusal_principals (login_oid, login_name, book_id, actor_id)
           SELECT r.oid, r.rolname, $1::uuid, $2
           FROM pg_catalog.pg_roles r
           WHERE r.rolname = $3`,
          [bookId, actorId, name],
        );
        if (principalInsert.rowCount !== 1) {
          throw new Error("HOLD: principal insert did not acknowledge one row");
        }
        provisioned.principalsAcknowledged += 1;
        provisioned.retainedBindings.push({ loginName: name, loginOid, bookId, actorId });
      }
      return { name, url: loginUrl(ownerUrl, name, secret), actorId: actorId ?? "" };
      } catch (err) {
        if (provisioned.loginsAcknowledged === loginsAckBefore) provisioned.loginsUncertain += 1;
        if (provisioned.grantsAcknowledged === grantsAckBefore && provisioned.grantsAttempted > grantsAckBefore) {
          provisioned.grantsUncertain += 1;
        }
        if (
          provisioned.principalsAcknowledged === principalsAckBefore &&
          provisioned.principalsAttempted > principalsAckBefore
        ) {
          provisioned.principalsUncertain += 1;
        }
        throw err;
      }
    }

    const loginA = await makeLogin(`kita_refusal_test_a_${suffix}`, `refusal-service:a-${suffix}`, bookAId);
    const loginB = await makeLogin(`kita_refusal_test_b_${suffix}`, `refusal-service:b-${suffix}`, bookAId);
    const loginC = await makeLogin(`kita_refusal_test_c_${suffix}`, `refusal-service:c-${suffix}`, bookCId);
    const loginUnbound = await makeLogin(`kita_refusal_test_unbound_${suffix}`, null, null);

    const registry = createRefusalPoolRegistry((url) =>
      createPool({
        databaseUrl: url,
        poolMax: 4,
        statementTimeoutMs: 15_000,
        connectionTimeoutMs: 10_000,
      }),
    );
    return {
      ownerUrl,
      bookA: bookAId,
      bookC: bookCId,
      loginA,
      loginB,
      loginC,
      loginUnbound,
      poolFor: (url: string) => registry.poolFor(url),
      close: () => registry.close(),
    };
  } catch (err) {
    const inventory = {
      ...provisioned,
      retainedBookIds: [...provisioned.retainedBookIds],
      retainedLoginNames: [...provisioned.retainedLoginNames],
      attemptedLoginNames: [...provisioned.attemptedLoginNames],
      retainedLoginOids: [...provisioned.retainedLoginOids],
      retainedBindings: [...provisioned.retainedBindings],
    };
    failed = true;
    primary = err;
    hideSecondary(client, inventory);
    hideSecondary(client, err);
    if ((typeof err === "object" && err !== null) || typeof err === "function") {
      hideSecondary(err as object, inventory);
    }
    throw err;
  } finally {
    const ended = await endOwnerClient(client, connected);
    if (ended.account) {
      if (failed) {
        retainCleanup(client, primary, [ended.account], ended.raw);
        if ((typeof primary === "object" && primary !== null) || typeof primary === "function") {
          hideSecondary(primary as object, { ...provisioned });
        }
      } else {
        const error = cleanupError([ended.account], ended.raw);
        hideSecondary(error, { ...provisioned });
        throw error;
      }
    }
  }
}
