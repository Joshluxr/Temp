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

const LOGIN_OID = Symbol.for("kita.non-money-refusal.login-oid");
const FIXTURE_INVOCATION = Symbol.for("kita.non-money-refusal.fixture-invocation");

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
    const late: LateOutcome = { status: "pending" };
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

type ResourceRecord = {
  readonly kind: "book" | "role" | "grant" | "binding";
  readonly name: string;
  prepared: boolean;
  issued: boolean;
  acknowledged: boolean;
  observed: boolean;
  uncertain: boolean;
  outcome: "pending" | "fulfilled" | "rejected";
};

type SingleUseOperationPermission = {
  consume(): boolean;
};

function produceValidatedOperationPermission(facts: {
  readonly code: string | undefined;
  readonly requested: number;
  readonly acquired: number;
  readonly sequence: readonly string[];
}): SingleUseOperationPermission | undefined {
  if (facts.code !== "KRF02") return undefined;
  if (facts.requested !== 1 || facts.acquired !== 1) return undefined;
  if (
    facts.sequence.length !== 4 ||
    facts.sequence[0] !== "begin" ||
    facts.sequence[1] !== "function-a" ||
    facts.sequence[2] !== "rollback" ||
    facts.sequence[3] !== "release"
  ) {
    return undefined;
  }
  let live = true;
  return {
    consume(): boolean {
      if (!live) return false;
      live = false;
      return true;
    },
  };
}

const invocationOwners = new WeakMap<object, {
  readonly ledgers: CloseLedger[];
  readonly resources: ResourceRecord[];
  operationPermission: SingleUseOperationPermission | undefined;
}>();

function invocationOf(owner: object): {
  readonly ledgers: CloseLedger[];
  readonly resources: ResourceRecord[];
  operationPermission: SingleUseOperationPermission | undefined;
} {
  const existing = invocationOwners.get(owner);
  if (existing) return existing;
  const created = {
    ledgers: [] as CloseLedger[],
    resources: [] as ResourceRecord[],
    operationPermission: undefined as SingleUseOperationPermission | undefined,
  };
  invocationOwners.set(owner, created);
  hideSecondary(owner, created);
  return created;
}

async function endOwnerClient(
  client: pg.Client,
  connected: boolean,
): Promise<{ account?: CloseAccount; raw?: unknown; ledger: CloseLedger }> {
  const invocation = invocationOf(client);
  let startExternal: () => void = () => undefined;
  const ending = new Promise<void>((resolve, reject) => {
    startExternal = () => {
      try {
        void Promise.resolve(client.end()).then(resolve, reject);
      } catch (sync) {
        reject(sync);
      }
    };
  });
  const ledger = watchUntilSettled(ending);
  invocation.ledgers.push(ledger);
  hideSecondary(client, ledger);
  startExternal();
  try {
    await bounded("owner-client.end", ending, 24_000);
    return { ledger };
  } catch (err) {
    const late: LateOutcome = { status: "pending" };
    const raw = { first: err, late, ledger };
    if (err && typeof err === "object") {
      hideSecondary(err, ledger);
      hideSecondary(err, raw);
    }
    return { account: closeAccount("owner-client.end", err, connected), raw, ledger };
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
  invocationOf(client);
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
    hideSecondary(client, ended.ledger);
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
    const preflight = await client.query<{
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
    );
    if (preflight.rows.length !== 1) throw new Error("HOLD: preflight cardinality is not one");
    const row = preflight.rows[0];
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

function createRefusalPoolRegistry(build: (url: string) => ManagedPool): {
  poolFor(url: string): ManagedPool;
  close(): Promise<void>;
} {
  const registryOwner = { kind: "refusal-pool-registry" as const };
  invocationOf(registryOwner);
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
    async close(): Promise<void> {
      closing = true;
      if (!closeReport) {
        closeReport = (async () => {
          const owned = [...pools.entries()];
          const ledgers = owned.map(([url, pool]) => {
            const prior = originalCloses.get(url);
            if (prior) return { url, work: prior.work, ledger: prior.ledger };
            let startExternal: () => void = () => undefined;
            const work = new Promise<void>((resolve, reject) => {
              startExternal = () => {
                try {
                  void Promise.resolve(pool.close()).then(resolve, reject);
                } catch (sync) {
                  reject({ status: "sync" as const, reason: sync });
                }
              };
            });
            const ledger = watchUntilSettled(work);
            originalCloses.set(url, { work, ledger });
            startExternal();
            invocationOf(registryOwner).ledgers.push(ledger);
            hideSecondary(registryOwner, ledger);
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
            ledgers.map((item) => bounded("pool.close", item.work, 22_000)),
          );
          const rejected = observed.filter((result): result is PromiseRejectedResult => result.status === "rejected");
          if (rejected.length === 0) return;
          const accounts = rejected.map((result, index) => closeAccount(`pool.close[${index}]`, result.reason, true));
          const error = cleanupError(accounts, rejected.map((result) => result.reason));
          hideSecondary(error, ledgers.map((item) => item.ledger));
          throw error;
        })();
      }
      try {
        await closeReport;
      } catch (err) {
        throw err;
      }
    },
  };
}

export async function provisionRefusalFixtures(): Promise<RefusalPgFixtures> {
  const lifecycle = { kind: "refusal-fixture-lifecycle" as const };
  const lifecycleState = invocationOf(lifecycle);
  hideSecondary(lifecycle, produceValidatedOperationPermission);
  lifecycleState.operationPermission = produceValidatedOperationPermission({
    code: undefined,
    requested: 0,
    acquired: 0,
    sequence: [],
  });
  let client: pg.Client | undefined;
  const provisioned = {
    booksPrepared: 0,
    booksIssued: 0,
    booksAcknowledged: 0,
    booksObserved: 0,
    booksUncertain: 0,
    rolesPrepared: 0,
    rolesIssued: 0,
    rolesAcknowledged: 0,
    rolesObserved: 0,
    rolesUncertain: 0,
    grantsPrepared: 0,
    grantsIssued: 0,
    grantsAcknowledged: 0,
    grantsObserved: 0,
    grantsUncertain: 0,
    bindingsPrepared: 0,
    bindingsIssued: 0,
    bindingsAcknowledged: 0,
    bindingsObserved: 0,
    bindingsUncertain: 0,
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
    await assertRefusalSecurityPreflight();
    const ownerUrl = requireRefusalOwnerUrl();
    client = ownerClient(ownerUrl);
    const owned = client;
    hideSecondary(lifecycle, owned);
    hideSecondary(owned, lifecycleState);
    invocationOf(owned);
    await owned.connect();
    connected = true;
    const version = await owned.query<{ version: string }>("SELECT version()");
    if (!version.rows[0]?.version.includes("PostgreSQL 18.")) {
      throw new Error(`expected PostgreSQL 18, got ${version.rows[0]?.version ?? "unknown"}`);
    }
    const suffix = randomBytes(4).toString("hex");
    async function insertDisabledBook(legalEntity: string): Promise<string> {
      const acknowledgedBefore = provisioned.booksAcknowledged;
      const issuedBefore = provisioned.booksIssued;
      const record: ResourceRecord = {
        kind: "book",
        name: legalEntity,
        prepared: false,
        issued: false,
        acknowledged: false,
        observed: false,
        uncertain: false,
        outcome: "pending",
      };
      lifecycleState.resources.push(record);
      provisioned.booksPrepared += 1;
      record.prepared = true;
      try {
        provisioned.booksIssued += 1;
        record.issued = true;
        const inserted = await owned.query<{ id: string }>(
          `INSERT INTO kita.books (legal_entity, functional_currency, status)
           VALUES ($1, 'USD', 'disabled') RETURNING id`,
          [legalEntity],
        );
        const id = inserted.rows[0]?.id;
        if (!id) throw new Error("HOLD: book insert returned no id");
        provisioned.booksAcknowledged += 1;
        record.acknowledged = true;
        provisioned.retainedBookIds.push(id);
        record.outcome = "fulfilled";
        return id;
      } catch (err) {
        record.outcome = "rejected";
        if (provisioned.booksIssued > issuedBefore && provisioned.booksAcknowledged === acknowledgedBefore) {
          provisioned.booksUncertain += 1;
          record.uncertain = true;
        }
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
      const rolesAckBefore = provisioned.rolesAcknowledged;
      const grantsAckBefore = provisioned.grantsAcknowledged;
      const bindingsAckBefore = provisioned.bindingsAcknowledged;
      const rolesIssuedBefore = provisioned.rolesIssued;
      const grantsIssuedBefore = provisioned.grantsIssued;
      const bindingsIssuedBefore = provisioned.bindingsIssued;
      provisioned.attemptedLoginNames.push(name);
      const roleRecord: ResourceRecord = {
        kind: "role",
        name,
        prepared: false,
        issued: false,
        acknowledged: false,
        observed: false,
        uncertain: false,
        outcome: "pending",
      };
      const grantRecord: ResourceRecord = {
        kind: "grant",
        name,
        prepared: false,
        issued: false,
        acknowledged: false,
        observed: false,
        uncertain: false,
        outcome: "pending",
      };
      const bindingRecord: ResourceRecord | undefined =
        actorId !== null && bookId !== null
          ? {
              kind: "binding",
              name,
              prepared: false,
              issued: false,
              acknowledged: false,
              observed: false,
              uncertain: false,
              outcome: "pending",
            }
          : undefined;
      lifecycleState.resources.push(roleRecord, grantRecord);
      if (bindingRecord) lifecycleState.resources.push(bindingRecord);
      try {
      provisioned.rolesPrepared += 1;
      roleRecord.prepared = true;
      const createSql = await owned.query<{ sql: string }>(
        `SELECT format(
           'CREATE ROLE %I LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE INHERIT NOREPLICATION NOBYPASSRLS',
           $1::text, $2::text
         ) AS sql`,
        [name, secret],
      );
      const createText = createSql.rows[0]?.sql;
      if (!createText) throw new Error("HOLD: CREATE ROLE sql missing");
      provisioned.rolesIssued += 1;
      roleRecord.issued = true;
      await owned.query(createText);
      provisioned.rolesAcknowledged += 1;
      roleRecord.acknowledged = true;
      provisioned.retainedLoginNames.push(name);
      const oidRow = await owned.query<{ oid: string }>(
        `SELECT oid::text AS oid FROM pg_catalog.pg_roles WHERE rolname = $1`,
        [name],
      );
      if (oidRow.rows.length !== 1) throw new Error("HOLD: login oid cardinality is not one");
      const loginOid = oidRow.rows[0]?.oid;
      if (!loginOid) throw new Error("HOLD: login oid missing after CREATE ROLE");
      if (provisioned.retainedLoginOids.includes(loginOid)) {
        throw new Error("HOLD: login oid is not distinct");
      }
      provisioned.rolesObserved += 1;
      roleRecord.observed = true;
      roleRecord.outcome = "fulfilled";
      provisioned.retainedLoginOids.push(loginOid);
      provisioned.grantsPrepared += 1;
      grantRecord.prepared = true;
      const grantSql = await owned.query<{ sql: string }>(
        `SELECT format('GRANT kita_refusal_recorder TO %I WITH INHERIT TRUE, SET FALSE', $1::text) AS sql`,
        [name],
      );
      const grantText = grantSql.rows[0]?.sql;
      if (!grantText) throw new Error("HOLD: GRANT recorder sql missing");
      provisioned.grantsIssued += 1;
      grantRecord.issued = true;
      await owned.query(grantText);
      provisioned.grantsAcknowledged += 1;
      grantRecord.acknowledged = true;
      grantRecord.outcome = "fulfilled";
      if (actorId !== null && bookId !== null && bindingRecord) {
        provisioned.bindingsPrepared += 1;
        bindingRecord.prepared = true;
        provisioned.bindingsIssued += 1;
        bindingRecord.issued = true;
        const principalInsert = await owned.query(
          `INSERT INTO kita.non_money_refusal_principals (login_oid, login_name, book_id, actor_id)
           SELECT r.oid, r.rolname, $1::uuid, $2
           FROM pg_catalog.pg_roles r
           WHERE r.rolname = $3`,
          [bookId, actorId, name],
        );
        if (principalInsert.rowCount !== 1) {
          throw new Error("HOLD: principal insert did not acknowledge one row");
        }
        provisioned.bindingsAcknowledged += 1;
        bindingRecord.acknowledged = true;
        provisioned.retainedBindings.push({ loginName: name, loginOid, bookId, actorId });
        bindingRecord.outcome = "fulfilled";
      }
      const login: RestrictedLogin = { name, url: loginUrl(ownerUrl, name, secret), actorId: actorId ?? "" };
      Object.defineProperty(login, LOGIN_OID, { value: loginOid, enumerable: false, configurable: false, writable: false });
      return login;
      } catch (err) {
        if (roleRecord.outcome === "pending") {
          if (roleRecord.issued && !roleRecord.acknowledged) {
            roleRecord.uncertain = true;
            provisioned.rolesUncertain += 1;
          } else if (!roleRecord.issued) {
            roleRecord.outcome = "rejected";
          }
        }
        if (grantRecord.outcome === "pending") {
          if (grantRecord.issued && !grantRecord.acknowledged) {
            grantRecord.uncertain = true;
            provisioned.grantsUncertain += 1;
          } else if (grantRecord.prepared && !grantRecord.issued) {
            grantRecord.outcome = "rejected";
          }
        }
        if (bindingRecord && bindingRecord.outcome === "pending") {
          if (bindingRecord.issued && !bindingRecord.acknowledged) {
            bindingRecord.uncertain = true;
            provisioned.bindingsUncertain += 1;
          } else if (bindingRecord.prepared && !bindingRecord.issued) {
            bindingRecord.outcome = "rejected";
          }
        }
        if (provisioned.rolesIssued > rolesIssuedBefore && provisioned.rolesAcknowledged === rolesAckBefore && !roleRecord.uncertain) {
          provisioned.rolesUncertain += 1;
          roleRecord.uncertain = true;
        }
        if (provisioned.grantsIssued > grantsIssuedBefore && provisioned.grantsAcknowledged === grantsAckBefore && !grantRecord.uncertain) {
          provisioned.grantsUncertain += 1;
          grantRecord.uncertain = true;
        }
        if (
          provisioned.bindingsIssued > bindingsIssuedBefore &&
          provisioned.bindingsAcknowledged === bindingsAckBefore &&
          bindingRecord &&
          !bindingRecord.uncertain
        ) {
          provisioned.bindingsUncertain += 1;
          bindingRecord.uncertain = true;
        }
        throw err;
      }
    }

    const loginA = await makeLogin(`kita_refusal_test_a_${suffix}`, `refusal-service:a-${suffix}`, bookAId);
    const loginB = await makeLogin(`kita_refusal_test_b_${suffix}`, `refusal-service:b-${suffix}`, bookAId);
    const loginC = await makeLogin(`kita_refusal_test_c_${suffix}`, `refusal-service:c-${suffix}`, bookCId);
    const loginUnbound = await makeLogin(`kita_refusal_test_unbound_${suffix}`, null, null);

    const observedBooks = await owned.query<{ id: string; status: string }>(
      `SELECT id::text AS id, status FROM kita.books WHERE id = ANY($1::uuid[]) ORDER BY legal_entity`,
      [[bookAId, bookCId]],
    );
    if (observedBooks.rows.length !== 2) throw new Error("HOLD: disabled book cardinality is not two");
    if (!observedBooks.rows.every((row) => row.status === "disabled")) {
      throw new Error("HOLD: provisioned books are not independently disabled");
    }
    const observedBookIds = new Set(observedBooks.rows.map((row) => row.id));
    if (observedBookIds.size !== 2 || !observedBookIds.has(bookAId) || !observedBookIds.has(bookCId)) {
      throw new Error("HOLD: observed books do not match the retained disabled pair");
    }
    provisioned.booksObserved += observedBooks.rows.length;
    for (const record of lifecycleState.resources.filter((item) => item.kind === "book")) {
      record.observed = true;
    }

    const observedBindings = await owned.query<{
      login_name: string;
      login_oid: string;
      book_id: string;
      actor_id: string;
    }>(
      `SELECT login_name, login_oid::text AS login_oid, book_id::text AS book_id, actor_id
         FROM kita.non_money_refusal_principals
        WHERE login_name = ANY($1::text[])`,
      [[loginA.name, loginB.name, loginC.name, loginUnbound.name]],
    );
    if (observedBindings.rows.length !== 3) {
      throw new Error("HOLD: immutable binding cardinality is not three");
    }
    const expectedBindings = provisioned.retainedBindings;
    if (expectedBindings.length !== 3) throw new Error("HOLD: retained binding cardinality is not three");
    for (const expected of expectedBindings) {
      const matched = observedBindings.rows.filter(
        (row) =>
          row.login_name === expected.loginName &&
          row.login_oid === expected.loginOid &&
          row.book_id === expected.bookId &&
          row.actor_id === expected.actorId,
      );
      if (matched.length !== 1) throw new Error("HOLD: immutable binding is not independently matched");
    }
    if (observedBindings.rows.some((row) => row.login_name === loginUnbound.name)) {
      throw new Error("HOLD: unbound login unexpectedly bound");
    }
    provisioned.bindingsObserved += observedBindings.rows.length;
    for (const record of lifecycleState.resources.filter((item) => item.kind === "binding")) {
      record.observed = true;
    }
    const expectedRecorderGrantor = "kita_test";
    const expectedLogins = [
      { name: loginA.name, oid: provisioned.retainedLoginOids[0] },
      { name: loginB.name, oid: provisioned.retainedLoginOids[1] },
      { name: loginC.name, oid: provisioned.retainedLoginOids[2] },
      { name: loginUnbound.name, oid: provisioned.retainedLoginOids[3] },
    ];
    if (expectedLogins.some((login) => !login.oid)) {
      throw new Error("HOLD: retained login oid missing before grant observation");
    }
    const observedGrants = await owned.query<{
      member: string;
      member_oid: string;
      role: string;
      grantor: string;
      admin_option: boolean;
      inherit_option: boolean;
      set_option: boolean;
    }>(
      `SELECT r.rolname AS member, r.oid::text AS member_oid, g.rolname AS role,
              grantor.rolname AS grantor, m.admin_option, m.inherit_option, m.set_option
         FROM pg_auth_members m
         JOIN pg_roles r ON r.oid = m.member
         JOIN pg_roles g ON g.oid = m.roleid
         JOIN pg_roles grantor ON grantor.oid = m.grantor
        WHERE g.rolname = 'kita_refusal_recorder'`,
    );
    for (const expected of expectedLogins) {
      const forLogin = observedGrants.rows.filter((row) => row.member === expected.name);
      if (forLogin.length !== 1) {
        throw new Error("HOLD: recorder membership cardinality is not one per expected login");
      }
      const row = forLogin[0];
      if (
        !row ||
        row.member_oid !== expected.oid ||
        row.role !== "kita_refusal_recorder" ||
        row.grantor !== expectedRecorderGrantor ||
        row.admin_option !== false ||
        row.inherit_option !== true ||
        row.set_option !== false
      ) {
        throw new Error("HOLD: recorder membership grantor or options mismatch");
      }
    }
    const unexpectedMembers = observedGrants.rows.filter(
      (row) => !expectedLogins.some((login) => login.name === row.member),
    );
    if (unexpectedMembers.length > 0) {
      throw new Error("HOLD: unexpected recorder membership row");
    }
    provisioned.grantsObserved += expectedLogins.length;
    for (const record of lifecycleState.resources.filter((item) => item.kind === "grant")) {
      record.observed = true;
    }

    const registry = createRefusalPoolRegistry((url) =>
      createPool({
        databaseUrl: url,
        poolMax: 4,
        statementTimeoutMs: 15_000,
        connectionTimeoutMs: 10_000,
      }),
    );
    const fixtures: RefusalPgFixtures = {
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
    invocationOwners.set(fixtures, lifecycleState);
    hideSecondary(fixtures, lifecycle);
    hideSecondary(fixtures, lifecycleState);
    Object.defineProperty(fixtures, FIXTURE_INVOCATION, {
      value: lifecycleState,
      enumerable: false,
      configurable: false,
      writable: false,
    });
    return fixtures;
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
    hideSecondary(lifecycle, inventory);
    hideSecondary(lifecycleState, err);
    if (client) {
      hideSecondary(client, inventory);
      hideSecondary(client, err);
    }
    if ((typeof err === "object" && err !== null) || typeof err === "function") {
      hideSecondary(err as object, inventory);
      hideSecondary(err as object, lifecycleState);
    }
    throw err;
  } finally {
    if (!client) {
      /* construction never produced a client; lifecycle already owns the failure */
    } else {
      const ended = await endOwnerClient(client, connected);
      hideSecondary(client, ended.ledger);
      hideSecondary(client, { ...provisioned });
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
}
