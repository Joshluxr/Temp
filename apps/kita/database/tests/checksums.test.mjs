/*
 * tests/checksums.test.mjs — T-PLAT-02 verbatim-copy provenance (offline).
 *
 * Proves three things without touching a database:
 *   1. apps/kita/sql/CHECKSUMS.txt records the sha256 of every migration it names,
 *      and the bytes on disk still match those recorded values (coder-07's
 *      parseChecksums() is used so this test cannot drift from the runner's view);
 *   2. each copy under apps/kita/sql/ is BYTE-FOR-BYTE identical to its
 *      docs/kita-plan/sql/ original — the plan of record was copied, not edited;
 *   3. CHECKSUMS.txt itself declares that provenance mapping, and the declared
 *      source hashes equal the hashes of the files actually present.
 *
 * Why it matters for "sandbox balances never become live cash": the DDL is the
 * thing that decides whether a runtime role can write account_balances at all
 * (config/isolation.md §1.3). If the applied copy differs by one byte from the
 * reviewed original, every grant/immutability claim in that document is void.
 *
 * Offline: no pg, no DB, no network. Fails closed if any file is missing.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG_DIR = resolve(HERE, '..'); // apps/kita/database
const SQL_DIR = resolve(PKG_DIR, '..', 'sql'); // apps/kita/sql
// apps/kita/database -> apps/kita -> apps -> <repo root>
const PLAN_SQL_DIR = resolve(PKG_DIR, '..', '..', '..', 'docs', 'kita-plan', 'sql');

// The migrations CHECKSUMS.txt must cover. roles.sql is deliberately NOT listed:
// coder-07's runner refuses to apply an unrecorded migration, so adding it here
// would be a policy change, not a fix.
const MIGRATIONS = ['001_core.sql', '002_core_smoke.sql'];

const sha256File = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

function readOrDie(p) {
  try {
    return readFileSync(p);
  } catch (err) {
    throw new Error(
      `required artifact missing/unreadable: ${p} (${err.message}). ` +
        `Offline TEST-PLAT-02 fails closed rather than skipping provenance.`,
      { cause: err },
    );
  }
}

async function loadMigrate() {
  try {
    return await import('../src/migrate.mjs');
  } catch (err) {
    assert.fail(
      `cannot import src/migrate.mjs to reuse its CHECKSUMS.txt parser: ${err.message}`,
    );
  }
}

test('CHECKSUMS.txt exists and declares the expected shape', async () => {
  const text = readOrDie(join(SQL_DIR, 'CHECKSUMS.txt')).toString('utf8');
  const mod = await loadMigrate();

  const table = mod.parseChecksums(text);
  const entries = typeof table?.entries === 'function' ? [...table.entries()] : table;
  const keys = Array.isArray(entries) ? entries.map(([k]) => k) : Object.keys(entries);

  for (const m of MIGRATIONS) {
    assert.ok(keys.includes(m), `CHECKSUMS.txt has no line for ${m}`);
  }
  // No stray migration names pointing at files that do not exist.
  const listed = Array.isArray(entries) ? entries : Object.entries(entries);
  for (const [name, hash] of listed) {
    if (!name.endsWith('.sql')) continue;
    assert.match(String(hash), /^[0-9a-f]{64}$/, `${name}: recorded checksum is not 64 hex`);
    readOrDie(join(SQL_DIR, name));
  }
});

test('on-disk sha256 matches the checksum recorded in CHECKSUMS.txt', async () => {
  const text = readOrDie(join(SQL_DIR, 'CHECKSUMS.txt')).toString('utf8');
  const mod = await loadMigrate();
  const table = mod.parseChecksums(text);

  for (const m of MIGRATIONS) {
    const expected = typeof table?.get === 'function' ? table.get(m) : table[m];
    assert.ok(expected, `no recorded checksum for ${m}`);
    const actual = sha256File(join(SQL_DIR, m));
    assert.equal(
      actual,
      expected,
      `${m} drifted from CHECKSUMS.txt (${actual} != ${expected}). ` +
        `Restore the verbatim copy from docs/kita-plan/sql/ — do not re-record the hash.`,
    );
  }
});

test('apps/kita/sql copies are byte-for-byte identical to docs/kita-plan/sql originals', () => {
  for (const m of MIGRATIONS) {
    const copy = readOrDie(join(SQL_DIR, m));
    const original = readOrDie(join(PLAN_SQL_DIR, m));
    assert.equal(
      copy.length,
      original.length,
      `${m}: size differs from the plan-of-record original (${copy.length} vs ${original.length})`,
    );
    assert.ok(
      copy.equals(original),
      `${m}: bytes differ from docs/kita-plan/sql/${m} — the reviewed DDL was edited after approval.`,
    );
  }
});

test('CHECKSUMS.txt provenance lines match the sources they cite', () => {
  const text = readOrDie(join(SQL_DIR, 'CHECKSUMS.txt')).toString('utf8');

  for (const m of MIGRATIONS) {
    const decl = new RegExp(
      `docs/kita-plan/sql/${m.replace('.', '\\.')}\\s+->\\s+apps/kita/sql/${m.replace('.', '\\.')}`,
    );
    assert.ok(
      decl.test(text),
      `CHECKSUMS.txt does not declare ${m} as a verbatim copy of docs/kita-plan/sql/${m}`,
    );

    // The provenance block carries the source hash on the following indented line.
    const hashLine = text
      .split(/\r?\n/)
      .slice(
        text.split(/\r?\n/).findIndex((l) => decl.test(l)),
        text.split(/\r?\n/).findIndex((l) => decl.test(l)) + 3,
      )
      .find((l) => /sha256\s+([0-9a-f]{64})/.test(l));
    assert.ok(hashLine, `no source sha256 recorded under the ${m} provenance line`);
    const declaredSourceHash = /sha256\s+([0-9a-f]{64})/.exec(hashLine)[1];
    const actualSourceHash = sha256File(join(PLAN_SQL_DIR, m));
    assert.equal(
      actualSourceHash,
      declaredSourceHash,
      `docs/kita-plan/sql/${m} no longer matches the hash CHECKSUMS.txt recorded for it ` +
        `(${actualSourceHash} != ${declaredSourceHash})`,
    );

    // And therefore: copy hash == declared source hash == original on disk.
    assert.equal(
      sha256File(join(SQL_DIR, m)),
      actualSourceHash,
      `${m}: copy and original disagree — provenance chain broken`,
    );
  }
});

test('the DDL copies carry their own isolation headers and roll back the fixture', () => {
  const core = readOrDie(join(SQL_DIR, '001_core.sql')).toString('utf8');
  const smoke = readOrDie(join(SQL_DIR, '002_core_smoke.sql')).toString('utf8');

  // Structure-only claims from config/isolation.md §2.1 / README.
  for (const t of ['books', 'journal_lines', 'account_balances', 'post_journal']) {
    assert.ok(core.includes(t), `001_core.sql does not define ${t} — wrong file copied?`);
  }
  assert.match(
    core,
    /status\s+text[^)]*CHECK\(status IN \([^)]*'sandbox'[^)]*\)\)/i,
    '001_core.sql: books.status sandbox/live CHECK list is gone — the promotion gate in ' +
      'config/isolation.md §2.3 keys on exactly this constraint',
  );

  // The smoke fixture must be self-reverting even inside kita_core_test.
  assert.match(smoke, /^\s*BEGIN\s*;/im, '002_core_smoke.sql has no BEGIN — fixture would persist');
  assert.match(
    smoke,
    /^\s*ROLLBACK\s*;/im,
    '002_core_smoke.sql has no ROLLBACK — sandbox fixture rows could survive into a real book',
  );
  assert.match(
    smoke,
    /not a production seed/i,
    '002_core_smoke.sql lost its "not a production seed" header',
  );
});
