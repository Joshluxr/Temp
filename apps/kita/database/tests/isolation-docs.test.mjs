/*
 * tests/isolation-docs.test.mjs — T-PLAT-02 isolation-contract test (offline).
 *
 * config/isolation.json is the machine-readable twin of config/isolation.md and is
 * what CI/gates parse. This test asserts the contract actually contains the
 * prohibitions Sol made blocking in SOL-REVIEW.md:
 *   - forbiddenEndpoints covers addSandboxFunds, simulatePartnerCompletion and the
 *     admin complete / fail / mark_paid_out outcome-manufacturing mutations;
 *   - the isolated target triple is kita_core_test on 127.0.0.1:54339;
 *   - batch 1 carries no real money, no fake KYC, no live provider calls;
 *   - the promotion gate that stops a sandbox balance becoming live cash exists,
 *     is blocking, and expects zero rows.
 * It then checks the human document (isolation.md) states the same numbers, so the
 * two files cannot drift apart while a reviewer reads only one of them.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG_DIR = resolve(HERE, '..');
const CONFIG_DIR = join(PKG_DIR, 'config');

const cfg = JSON.parse(readFileSync(join(CONFIG_DIR, 'isolation.json'), 'utf8'));
const md = readFileSync(join(CONFIG_DIR, 'isolation.md'), 'utf8');

// Endpoints/mutations that must be named as forbidden. Grouped by the wording used
// in docs/kita-plan/SOL-REVIEW.md and apps/kita/docs/FORBIDDEN.md.
const REQUIRED_FORBIDDEN = [
  'addSandboxFunds',
  'simulatePartnerCompletion',
  'admin.complete',
  'admin.fail',
  'admin.mark_paid_out',
];

function names(list) {
  return list.map((e) => String(e?.name ?? e));
}

test('isolation.json pins the isolated test target triple', () => {
  assert.equal(cfg.task, 'T-PLAT-02');
  assert.equal(cfg.database, 'kita_core_test', 'database must be exactly kita_core_test');
  assert.equal(cfg.host, '127.0.0.1', 'host must be loopback only');
  assert.equal(cfg.port, 54339, 'port must be the dedicated Kita test port');
  assert.notEqual(cfg.port, 5432, 'the system Postgres port is never the Kita test target');
  assert.equal(cfg.topology.loopbackOnly, true);
  assert.equal(cfg.topology.cluster, 'throwaway');
  assert.equal(cfg.topology.toolingLoginRole, 'kita_test');
});

test('forbiddenEndpoints lists every outcome-manufacturing mutation', () => {
  assert.ok(Array.isArray(cfg.forbiddenEndpoints), 'forbiddenEndpoints must be an array');
  const listed = names(cfg.forbiddenEndpoints);
  for (const required of REQUIRED_FORBIDDEN) {
    assert.ok(
      listed.includes(required),
      `forbiddenEndpoints must include "${required}" (found: ${listed.join(', ')})`,
    );
  }

  // Coverage check independent of naming style: the raw text of the section must
  // name all five verbs Sol enumerated, including bare complete/fail/mark_paid_out.
  const blob = JSON.stringify(cfg.forbiddenEndpoints);
  for (const token of ['addSandboxFunds', 'simulatePartnerCompletion', 'mark_paid_out']) {
    assert.ok(blob.includes(token), `forbiddenEndpoints text lost "${token}"`);
  }
  for (const verb of ['complete', 'fail']) {
    assert.match(
      blob,
      new RegExp(`"name"\\s*:\\s*"admin\\.${verb}"`),
      `admin ${verb} outcome-mutation must be listed as its own forbidden entry`,
    );
  }
});

test('each forbidden endpoint states a production disposition', () => {
  for (const entry of cfg.forbiddenEndpoints) {
    const name = String(entry?.name ?? '(unnamed)');
    assert.ok(entry.production, `${name}: no "production" disposition recorded`);
    assert.match(String(entry.production), /forbidden/i, `${name}: disposition must say forbidden`);
    if (['addSandboxFunds', 'simulatePartnerCompletion'].includes(name)) {
      assert.ok(entry.origin, `${name}: must cite the archived source it is banned from porting`);
      assert.match(String(entry.origin), /kimi-archive/, `${name}: origin should cite kimi-archive`);
    }
  }
});

test('fake KYC and live provider money instructions are explicitly out of scope', () => {
  const listed = names(cfg.forbiddenEndpoints);
  assert.ok(listed.includes('fakeKycApproval'), 'no fake-KYC prohibition recorded');
  assert.ok(
    listed.includes('liveProviderMoneyInstruction'),
    'no live-provider-money prohibition recorded',
  );
  assert.equal(cfg.batchOneScope.realMoney, false);
  assert.equal(cfg.batchOneScope.fakeKyc, false);
  assert.equal(cfg.batchOneScope.liveProviderCalls, false);
});

test('sandbox seeding vectors are recorded as blocked, with the live-cash gate', () => {
  const sources = JSON.stringify(cfg.forbiddenSeedingSources);
  for (const pattern of ["status='sandbox'", 'account_balances', 'fixture:%', 'test-only://']) {
    assert.ok(sources.includes(pattern), `forbiddenSeedingSources must mention ${pattern}`);
  }

  const gate = cfg.promotionGate;
  assert.ok(gate, 'promotionGate missing — nothing stops sandbox books reaching live');
  assert.equal(gate.blocking, true, 'promotionGate must be blocking, not advisory');
  assert.match(gate.query, /FROM\s+kita\.books\s+WHERE\s+status\s*=\s*'sandbox'/i);
  assert.equal(gate.expected, 0, 'promotion gate expected value must be 0 rows');
  assert.ok(
    gate.supportingQueries.length >= 4,
    'promotion gate needs the supporting fixture/evidence/provider-account checks',
  );
  for (const q of gate.supportingQueries) {
    assert.equal(q.expected, 0, `${q.id}: supporting gate assertion must expect 0`);
  }
  // The test triple itself must be rejected on the LIVE side too, otherwise a
  // mis-set env var can promote kita_core_test contents into a release path.
  assert.match(JSON.stringify(gate.structuralChecks), /54339/, 'structural checks must reject the test triple');
  assert.match(JSON.stringify(gate.structuralChecks), /kita_core_test/);

  // Only the isolated database may ever hold sandbox books.
  const sandboxBooks = cfg.forbiddenSeedingSources.find((s) =>
    JSON.stringify(s).includes("status='sandbox'"),
  );
  assert.deepEqual(sandboxBooks.allowedDatabases, ['kita_core_test']);
});

test('the runtime roles stay NOLOGIN and hold no direct ledger writes', () => {
  for (const role of cfg.topology.runtimeRoles) {
    assert.equal(role.login, false, `${role.name} must be NOLOGIN`);
    assert.equal(role.createdBy, 'ddl', `${role.name} is created by 001_core.sql, not by ops scripts`);
  }
  const noWrites = cfg.topology.noRuntimeDirectLedgerWrites;
  for (const t of ['journals', 'journal_lines', 'ledger_accounts', 'account_balances']) {
    assert.ok(noWrites.tables.includes(t), `${t} must be on the no-direct-write list`);
  }
  assert.equal(cfg.topology.composeHasPostgresService, false);
});

test('isolation.md agrees with isolation.json on the numbers and the ban list', () => {
  assert.match(md, /kita_core_test/);
  assert.match(md, /54339/);
  assert.match(md, /127\.0\.0\.1/);
  assert.match(md, /kita_test/);
  for (const required of ['addSandboxFunds', 'simulatePartnerCompletion', 'mark_paid_out']) {
    assert.ok(md.includes(required), `isolation.md must document the ${required} prohibition`);
  }
  assert.match(md, /SELECT count\(\*\) FROM kita\.books WHERE status = 'sandbox';/);
  // Both files must be presented as twins; a doc-only change would silently un-gate CI.
  assert.match(md, /isolation\.json/);
});
