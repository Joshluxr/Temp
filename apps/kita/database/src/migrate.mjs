// @kita/database — T-PLAT-02 core schema migration runner.
//
// ISOLATED TEST ONLY. This tool refuses to run against anything that is not the
// dedicated Kita test database. It never touches production and it never seeds
// real or sandbox money: 001_core.sql creates empty structure only, and
// 002_core_smoke.sql (run by src/smoke.mjs, owned by coders 09/10) wraps its
// synthetic fixture in a transaction that is rolled back.
//
// The guard below is FAIL-CLOSED: if the target cannot be proven to be the
// isolated test database with an exact-shape connection string, we throw before
// opening any socket. Unknown hosts, unknown users, extra parameters, SSL
// endpoints, managed/production markers and any database name other than
// `kita_core_test` are all rejected.
//
// CREATEROLE OWNER NOTE: docs/kita-plan/sql/001_core.sql (copied verbatim to
// apps/kita/sql/001_core.sql) runs `CREATE ROLE kita_api / kita_worker /
// kita_posting / kita_auditor` inside its single BEGIN..COMMIT transaction. The
// connecting role therefore MUST have the CREATEROLE attribute, otherwise
// Postgres raises `permission denied to create role` and the whole migration
// rolls back. Provision the test cluster so the login role owns schema `kita`
// and can create roles, for example:
//
//   CREATE ROLE kita_test LOGIN PASSWORD '...' CREATEROLE;
//
// Roles are cluster-wide objects, so applying 001_core.sql a second time on a
// cluster that already has them is safe (the DO block is IF NOT EXISTS guarded)
// but this runner still skips re-applying a recorded version.

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
// apps/kita/database/src -> apps/kita/sql (the verbatim copies + CHECKSUMS.txt).
const SQL_DIR = resolve(HERE, '..', '..', 'sql');

// --- Isolation policy -------------------------------------------------------

export const ALLOWED_DATABASE = 'kita_core_test';
export const ALLOWED_USER = 'kita_test';
export const ALLOWED_HOST = '127.0.0.1';
export const ALLOWED_PORT = 54339;
export const ALLOWED_SHAPE =
  'postgresql://kita_test@127.0.0.1:54339/kita_core_test';

// Any of these appearing anywhere in the connection string marks a non-test
// target. Matched case-insensitively against the raw string as well as against
// the parsed host / user / database fields.
const PRODUCTION_MARKERS = [
  'prod',
  'production',
  'live',
  'mainnet',
  'master',
  'primary',
  'rds.amazonaws.com',
  'aurora',
  'neon.tech',
  'supabase',
  'render',
  'fly.io',
  'heroku',
  'aliyuncs',
  'cloudsql',
  'redshift',
  'pgpool',
  'replica',
  'standby',
  'pgbouncer',
];

class MigrationGuardError extends Error {}
class ChecksumError extends Error {}

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

/**
 * Fail-closed validation of a candidate DATABASE_URL.
 * Returns the parsed URL on success; throws MigrationGuardError otherwise.
 */
export function assertTestTarget(rawUrl) {
  if (typeof rawUrl !== 'string' || rawUrl.trim() === '') {
    throw new MigrationGuardError(
      `DATABASE_URL is missing or empty. Allowed shape: ${ALLOWED_SHAPE}`,
    );
  }

  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new MigrationGuardError(
      `DATABASE_URL is not a parseable URL. Allowed shape: ${ALLOWED_SHAPE}`,
    );
  }

  if (url.protocol !== 'postgres:' && url.protocol !== 'postgresql:') {
    throw new MigrationGuardError(
      `Unsupported scheme "${url.protocol}". Allowed shape: ${ALLOWED_SHAPE}`,
    );
  }

  const lower = rawUrl.toLowerCase();

  // Production / managed-service markers in the raw string are fatal.
  const markerHits = PRODUCTION_MARKERS.filter((marker) =>
    lower.includes(marker),
  );
  if (markerHits.length > 0) {
    throw new MigrationGuardError(
      `Refusing to migrate: connection string contains production marker(s) ` +
        `[${markerHits.join(', ')}]. Allowed shape: ${ALLOWED_SHAPE}`,
    );
  }

  // TLS endpoints are treated as non-isolated: the test cluster is plaintext
  // loopback only, and sslmode options are commonly how prod URLs differ.
  const params = [...url.searchParams.keys()].map((k) => k.toLowerCase());
  if (params.some((k) => k.startsWith('ssl'))) {
    throw new MigrationGuardError(
      `Refusing to migrate: TLS/sslmode parameters indicate a non-isolated ` +
        `target. Allowed shape: ${ALLOWED_SHAPE}`,
    );
  }
  if (url.search !== '' && url.search !== '?') {
    throw new MigrationGuardError(
      `Refusing to migrate: unexpected query parameter(s) ` +
        `[${[...url.searchParams.keys()].join(', ')}]. Allowed shape: ${ALLOWED_SHAPE}`,
    );
  }

  // Database name must be EXACTLY kita_core_test.
  const dbName = decodeURIComponent(url.pathname.replace(/^\//, ''));
  if (dbName !== ALLOWED_DATABASE) {
    throw new MigrationGuardError(
      `Refusing to migrate: database "${dbName}" is not exactly ` +
        `"${ALLOWED_DATABASE}". Allowed shape: ${ALLOWED_SHAPE}`,
    );
  }

  // Host must be the loopback address of the dedicated test cluster.
  const host = url.hostname;
  if (host !== ALLOWED_HOST) {
    throw new MigrationGuardError(
      `Refusing to migrate: host "${host}" is not the isolated test host ` +
        `"${ALLOWED_HOST}". Allowed shape: ${ALLOWED_SHAPE}`,
    );
  }

  // Port must be the dedicated test port.
  const port = url.port === '' ? 5432 : Number(url.port);
  if (port !== ALLOWED_PORT) {
    throw new MigrationGuardError(
      `Refusing to migrate: port ${port} is not the dedicated test port ` +
        `${ALLOWED_PORT}. Allowed shape: ${ALLOWED_SHAPE}`,
    );
  }

  // User must be the provisioned test role.
  const user = decodeURIComponent(url.username);
  if (user !== ALLOWED_USER) {
    throw new MigrationGuardError(
      `Refusing to migrate: user "${user || '(none)'}" is not the test role ` +
        `"${ALLOWED_USER}". Allowed shape: ${ALLOWED_SHAPE}`,
    );
  }

  return url;
}

// --- CHECKSUMS.txt ----------------------------------------------------------

/**
 * Parse apps/kita/sql/CHECKSUMS.txt into { "<file>.sql": "<sha256>" }.
 * Only lines shaped like `<64 hex>  <name>` are considered; comment and prose
 * lines are ignored so the file stays human-readable.
 */
export function parseChecksums(text) {
  const table = new Map();
  for (const line of text.split(/\r?\n/)) {
    const m = /^([0-9a-f]{64})\s+\*?(\S+)$/.exec(line.trim());
    if (m) table.set(m[2], m[1]);
  }
  return table;
}

function checksumFor(fileName) {
  const text = readFileSync(resolve(SQL_DIR, 'CHECKSUMS.txt'), 'utf8');
  const expected = parseChecksums(text).get(fileName);
  if (!expected) {
    throw new ChecksumError(
      `CHECKSUMS.txt has no entry for ${fileName}; refusing to apply an ` +
        `unrecorded migration.`,
    );
  }
  return expected;
}

/**
 * Read a SQL file and confirm its bytes still match CHECKSUMS.txt.
 * Drift here means somebody edited or swapped the DDL after review.
 */
function loadVerifiedSql(fileName) {
  const sqlPath = resolve(SQL_DIR, fileName);
  const bytes = readFileSync(sqlPath);
  const actual = sha256(bytes);
  const expected = checksumFor(fileName);
  if (actual !== expected) {
    throw new ChecksumError(
      `Checksum mismatch for ${fileName}: CHECKSUMS.txt says ${expected} but ` +
        `the file on disk is ${actual}. Refusing to migrate. Restore the ` +
        `verbatim copy from docs/kita-plan/sql/.`,
    );
  }
  return { sqlPath, sql: bytes.toString('utf8'), checksum: actual };
}

// --- Migration bookkeeping --------------------------------------------------

const ENSURE_TABLE = `
CREATE TABLE IF NOT EXISTS kita.schema_migrations (
  version    text PRIMARY KEY,
  checksum   text,
  applied_at timestamptz NOT NULL DEFAULT now()
)`;

async function currentChecksum(client, version) {
  const res = await client.query(
    'SELECT checksum FROM kita.schema_migrations WHERE version = $1',
    [version],
  );
  return res.rowCount === 0 ? null : res.rows[0].checksum;
}

async function recordVersion(client, version, checksum) {
  await client.query(
    `INSERT INTO kita.schema_migrations(version, checksum) VALUES ($1, $2)
     ON CONFLICT (version) DO UPDATE SET checksum = EXCLUDED.checksum`,
    [version, checksum],
  );
}

/**
 * Apply apps/kita/sql/001_core.sql to the isolated test database and record it.
 *
 * @param {{ url?: string }} [options] target connection string; defaults to
 *   process.env.DATABASE_URL. Always validated by the fail-closed guard.
 * @returns {Promise<{version:string, checksum:string, applied:boolean,
 *   skipped:boolean, database:string}>}
 */
export async function migrate({ url = process.env.DATABASE_URL } = {}) {
  const target = assertTestTarget(url);
  const database = decodeURIComponent(target.pathname.replace(/^\//, ''));

  const { sql, checksum } = loadVerifiedSql('001_core.sql');
  const version = '001_core';

  const { default: pg } = await import('pg');
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    // Belt-and-braces: the URL said test, ask the server what it actually is.
    const srv = await client.query(
      'SELECT current_database() AS db, inet_server_addr()::text AS addr, ' +
        'current_setting(\'port\') AS port',
    );
    const { db, port } = srv.rows[0];
    if (db !== ALLOWED_DATABASE) {
      throw new MigrationGuardError(
        `Server reports database "${db}", not "${ALLOWED_DATABASE}". Aborting.`,
      );
    }
    if (Number(port) !== ALLOWED_PORT) {
      throw new MigrationGuardError(
        `Server reports port ${port}, not the dedicated test port ` +
          `${ALLOWED_PORT}. Aborting.`,
      );
    }

    const recorded = await applyVersion(client, version, checksum, sql, {
      // 001_core.sql carries its own BEGIN..COMMIT, so it must be run outside a
      // wrapper transaction; ensure the bookkeeping table exists first.
      preflight: () => client.query(ENSURE_TABLE),
    });

    return { ...recorded, database };
  } finally {
    await client.end();
  }
}

async function applyVersion(client, version, checksum, sql, { preflight }) {
  await preflight();

  const recorded = await currentChecksum(client, version);
  if (recorded !== null) {
    if (recorded !== checksum) {
      throw new ChecksumError(
        `Migration ${version} is already recorded with checksum ${recorded}, ` +
          `but CHECKSUMS.txt says ${checksum}. The applied DDL and the reviewed ` +
          `DDL disagree — reconcile manually instead of migrating.`,
      );
    }
    return { version, checksum, applied: false, skipped: true };
  }

  await client.query(sql);

  // Re-read after the fact so a tampered file cannot pass by claiming a hash.
  const after = await currentChecksum(client, version);
  if (after !== null && after !== checksum) {
    throw new ChecksumError(
      `Post-apply verification failed for ${version}: recorded ${after}, ` +
        `expected ${checksum}.`,
    );
  }
  await recordVersion(client, version, checksum);

  return { version, checksum, applied: true, skipped: false };
}

// --- CLI --------------------------------------------------------------------

const isMain =
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isMain) {
  const url = process.argv[2] ?? process.env.DATABASE_URL;
  try {
    const result = await migrate({ url });
    console.log(
      JSON.stringify(
        {
          ok: true,
          mode: 'ISOLATED TEST ONLY',
          ...result,
        },
        null,
        2,
      ),
    );
  } catch (err) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          error: err?.constructor?.name ?? 'Error',
          message: err?.message ?? String(err),
          allowedShape: ALLOWED_SHAPE,
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
  }
}
