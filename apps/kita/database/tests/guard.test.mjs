/*
 * tests/guard.test.mjs — T-PLAT-02 fail-closed migration guard (offline).
 *
 * Table-driven proof that src/migrate.mjs's assertTestTarget() accepts ONLY the
 * kita_test@127.0.0.1:54339/kita_core_test shape and rejects everything else —
 * production database names, other hosts/ports, mysql:// URLs, empty strings,
 * garbage, TLS endpoints, managed-service markers, extra query parameters.
 *
 * It also pins the policy constants to config/isolation.json so the code and the
 * machine-readable contract cannot drift apart silently, and it proves the two
 * cheapest real bypass attempts stay closed: importing migrate.mjs must not open
 * a connection, and migrate() must throw from the guard before any pg import.
 *
 * Offline by construction: `pg` is NOT installed here and nothing connects. If
 * this file ever needs a live database, the guard has already failed.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG_DIR = resolve(HERE, '..');
const CONFIG_JSON = join(PKG_DIR, 'config', 'isolation.json');

let migrate;
try {
  // Importing coder-07's module must be side-effect-free (no socket, no pg load).
  migrate = await import('../src/migrate.mjs');
} catch (err) {
  assert.fail(`cannot import src/migrate.mjs: ${err.message}`);
}

const { assertTestTarget, ALLOWED_SHAPE, ALLOWED_DATABASE, ALLOWED_HOST, ALLOWED_PORT, ALLOWED_USER } =
  migrate;

if (typeof assertTestTarget !== 'function') {
  assert.fail(
    'src/migrate.mjs does not export assertTestTarget — the fail-closed guard is not ' +
      'testable offline. GAP: ask coder-07 to export it (do not edit migrate.mjs from this lane).',
  );
}

// The canonical allowed target, spelled both ways the driver accepts.
const GOOD = [
  'postgresql://kita_test@127.0.0.1:54339/kita_core_test',
  'postgres://kita_test@127.0.0.1:54339/kita_core_test',
];

// --- REJECT table ------------------------------------------------------------
// Each case: [label, url, expectedReasonRegex]. The regex asserts WHICH check
// fired, so a guard that throws for an unrelated reason still fails the suite.
const REJECT = [
  // production / non-test database names
  ['prod db name', 'postgresql://kita_test@127.0.0.1:54339/kita_core', /database/i],
  ['production db name', 'postgresql://kita_test@127.0.0.1:54339/production', /marker|database/i],
  ['live db name', 'postgresql://kita_test@127.0.0.1:54339/kita_core_live', /marker|database/i],
  ['mainnet db name', 'postgresql://kita_test@127.0.0.1:54339/kita_mainnet', /marker|database/i],
  ['prod user', 'postgresql://kita_prod@127.0.0.1:54339/kita_core_test', /marker|user/i],
  ['empty database', 'postgresql://kita_test@127.0.0.1:54339/', /database/i],
  ['wrong database only', 'postgresql://kita_test@127.0.0.1:54339/postgres', /database/i],

  // other hosts
  ['remote host', 'postgresql://kita_test@db.internal.example.com:54339/kita_core_test', /host/i],
  ['loopback localhost alias', 'postgresql://kita_test@localhost:54339/kita_core_test', /host/i],
  ['ipv6 loopback', 'postgresql://kita_test@[::1]:54339/kita_core_test', /host/i],
  ['aws rds', 'postgresql://kita_test@mydb.abc123.rds.amazonaws.com:54339/kita_core_test', /marker|host/i],
  ['neon', 'postgresql://kita_test@ep-cool-123.neon.tech:54339/kita_core_test', /marker|host/i],
  ['supabase', 'postgresql://kita_test@db.supabase.co:54339/kita_core_test', /marker|host/i],

  // other ports
  ['default port omitted', 'postgresql://kita_test@127.0.0.1/kita_core_test', /port/i],
  ['stock 5432', 'postgresql://kita_test@127.0.0.1:5432/kita_core_test', /port/i],
  ['near-miss 54340', 'postgresql://kita_test@127.0.0.1:54340/kita_core_test', /port/i],

  // wrong scheme
  ['mysql scheme', 'mysql://kita_test@127.0.0.1:54339/kita_core_test', /scheme/i],
  ['mysqlx scheme', 'mysqlx://kita_test@127.0.0.1:54339/kita_core_test', /scheme/i],
  ['sqlite file', 'sqlite:///home/administrator/prod.db', /scheme/i],
  ['http url', 'http://kita_test@127.0.0.1:54339/kita_core_test', /scheme/i],
  ['bare host string', '127.0.0.1:54339/kita_core_test', /parseable|scheme/i],

  // empty / garbage / wrong types
  ['empty string', '', /missing or empty/i],
  ['whitespace only', '   ', /missing or empty/i],
  ['garbage bytes', 'not a url at all $$$', /parseable/i],
  ['null', null, /missing or empty/i],
  ['undefined', undefined, /missing or empty/i],
  ['number', 54339, /missing or empty/i],
  ['object', { connectionString: GOOD[0] }, /missing or empty/i],

  // TLS / parameter smuggling
  ['sslmode require', `${GOOD[0]}?sslmode=require`, /TLS|sslmode/i],
  ['ssl=true', `${GOOD[0]}?ssl=true`, /TLS|sslmode|query/i],
  ['arbitrary param', `${GOOD[0]}?application_name=kita_api`, /query/i],

  // missing identity
  ['no user', 'postgresql://127.0.0.1:54339/kita_core_test', /user/i],
  ['wrong user', 'postgresql://postgres@127.0.0.1:54339/kita_core_test', /user/i],
  ['superuser postgres on test triple', 'postgresql://postgres@127.0.0.1:54339/kita_core_test', /user/i],
];

test('policy constants match the machine-readable isolation contract', () => {
  const cfg = JSON.parse(readFileSync(CONFIG_JSON, 'utf8'));
  assert.equal(ALLOWED_DATABASE, cfg.database, 'migrate.mjs db != isolation.json database');
  assert.equal(ALLOWED_HOST, cfg.host, 'migrate.mjs host != isolation.json host');
  assert.equal(ALLOWED_PORT, cfg.port, 'migrate.mjs port != isolation.json port');
  assert.equal(
    ALLOWED_USER,
    cfg.topology.toolingLoginRole,
    'migrate.mjs user != isolation.json topology.toolingLoginRole',
  );
  assert.equal(
    ALLOWED_SHAPE,
    `postgresql://${ALLOWED_USER}@${ALLOWED_HOST}:${ALLOWED_PORT}/${ALLOWED_DATABASE}`,
    'ALLOWED_SHAPE is not the concatenation of its parts',
  );
});

test('accepts only the kita_core_test@127.0.0.1:54339 shapes', () => {
  for (const url of GOOD) {
    let parsed;
    assert.doesNotThrow(() => {
      parsed = assertTestTarget(url);
    }, `${url} must be accepted as the isolated test target`);
    assert.equal(parsed.hostname, ALLOWED_HOST);
    assert.equal(Number(parsed.port), ALLOWED_PORT);
    assert.equal(decodeURIComponent(parsed.pathname.replace(/^\//, '')), ALLOWED_DATABASE);
    assert.equal(decodeURIComponent(parsed.username), ALLOWED_USER);
  }

  // A password on the trust-auth loopback cluster is tolerated but not required.
  assert.doesNotThrow(() =>
    assertTestTarget('postgresql://kita_test:test-only@127.0.0.1:54339/kita_core_test'),
  );
});

test('rejects every non-test target (fail-closed table)', () => {
  for (const [label, url, reason] of REJECT) {
    let thrown = null;
    try {
      assertTestTarget(url);
    } catch (err) {
      thrown = err;
    }
    if (thrown === null) {
      assert.fail(`REJECTED CASE LEAKED: ${label} — "${String(url)}" was accepted by the guard`);
    }
    assert.match(
      thrown.message,
      reason,
      `${label}: guard threw, but for the wrong reason (${thrown.message}) — expected /${reason}/`,
    );
    // Every rejection must tell the operator what the allowed shape is.
    assert.match(
      thrown.message,
      /kita_core_test/,
      `${label}: rejection message must name the allowed target`,
    );
  }
});

test('the guard aborts before any database driver or socket is touched', async () => {
  // This environment has NO pg installed. If migrate() reached for a client first,
  // we would see ERR_MODULE_NOT_FOUND instead of the guard's own error.
  for (const bad of ['', 'mysql://kita_test@127.0.0.1:54339/kita_core_test', 'postgresql://kita_test@db.prod.example.com:5432/kita_core']) {
    let err;
    try {
      await migrate.migrate({ url: bad });
      assert.fail(`migrate() must not proceed with target "${bad}"`);
    } catch (e) {
      err = e;
    }
    assert.doesNotMatch(
      String(err?.code ?? ''),
      /ERR_MODULE_NOT_FOUND|MODULE_NOT_FOUND/,
      `migrate("${bad}") tried to load the pg driver before validating the target`,
    );
    assert.match(String(err?.message ?? ''), /kita_core_test/, 'guard message must state the allowed shape');
  }
});

test('a DATABASE_URL pointing at the parent security product is refused', () => {
  // t3mp3st ships no database service at all (config/isolation.md §1.4); the
  // Kita tooling must never be repointed into the security product stack.
  for (const url of [
    'postgresql://t3mp3st@127.0.0.1:5432/t3mp3st',
    'postgresql://kita_test@127.0.0.1:54339/t3mp3st',
    'postgresql://kita_test@127.0.0.1:3333/kita_core_test',
  ]) {
    assert.throws(() => assertTestTarget(url), /Refusing|Unsupported|not a parseable/i, `${url} must be refused`);
  }
});
