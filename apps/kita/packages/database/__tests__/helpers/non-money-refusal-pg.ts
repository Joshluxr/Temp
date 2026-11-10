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
};

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

export async function provisionRefusalFixtures(): Promise<RefusalPgFixtures> {
  const ownerUrl = requireRefusalOwnerUrl();
  const client = new pg.Client({ connectionString: ownerUrl });
  await client.connect();
  try {
    const version = await client.query<{ version: string }>("SELECT version()");
    if (!version.rows[0]?.version.includes("PostgreSQL 18.")) {
      throw new Error(`expected PostgreSQL 18, got ${version.rows[0]?.version ?? "unknown"}`);
    }
    const suffix = randomBytes(4).toString("hex");
    const bookA = await client.query<{ id: string }>(
      `INSERT INTO kita.books (legal_entity, functional_currency, status)
       VALUES ($1, 'USD', 'disabled') RETURNING id`,
      [`refusal-a-${suffix}`],
    );
    const bookC = await client.query<{ id: string }>(
      `INSERT INTO kita.books (legal_entity, functional_currency, status)
       VALUES ($1, 'USD', 'disabled') RETURNING id`,
      [`refusal-c-${suffix}`],
    );
    const bookAId = bookA.rows[0].id;
    const bookCId = bookC.rows[0].id;

    async function makeLogin(
      name: string,
      actorId: string | null,
      bookId: string | null,
    ): Promise<RestrictedLogin> {
      const secret = password();
      const createSql = await client.query<{ sql: string }>(
        `SELECT format(
           'CREATE ROLE %I LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE INHERIT NOREPLICATION NOBYPASSRLS',
           $1::text, $2::text
         ) AS sql`,
        [name, secret],
      );
      await client.query(createSql.rows[0].sql);
      const grantSql = await client.query<{ sql: string }>(
        `SELECT format('GRANT kita_refusal_recorder TO %I WITH INHERIT TRUE, SET FALSE', $1::text) AS sql`,
        [name],
      );
      await client.query(grantSql.rows[0].sql);
      if (actorId !== null && bookId !== null) {
        await client.query(
          `INSERT INTO kita.non_money_refusal_principals (login_oid, login_name, book_id, actor_id)
           SELECT r.oid, r.rolname, $1::uuid, $2
           FROM pg_catalog.pg_roles r
           WHERE r.rolname = $3`,
          [bookId, actorId, name],
        );
      }
      return { name, url: loginUrl(ownerUrl, name, secret), actorId: actorId ?? "" };
    }

    const loginA = await makeLogin(`kita_refusal_test_a_${suffix}`, `refusal-service:a-${suffix}`, bookAId);
    const loginB = await makeLogin(`kita_refusal_test_b_${suffix}`, `refusal-service:b-${suffix}`, bookAId);
    const loginC = await makeLogin(`kita_refusal_test_c_${suffix}`, `refusal-service:c-${suffix}`, bookCId);
    const loginUnbound = await makeLogin(`kita_refusal_test_unbound_${suffix}`, null, null);

    const pools = new Map<string, ManagedPool>();
    return {
      ownerUrl,
      bookA: bookAId,
      bookC: bookCId,
      loginA,
      loginB,
      loginC,
      loginUnbound,
      poolFor(url: string): ManagedPool {
        const existing = pools.get(url);
        if (existing) return existing;
        const pool = createPool({ databaseUrl: url, poolMax: 4 });
        pools.set(url, pool);
        return pool;
      },
    };
  } finally {
    await client.end();
  }
}
