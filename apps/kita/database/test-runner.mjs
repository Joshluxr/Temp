#!/usr/bin/env node
/*
 * apps/kita/database/test-runner.mjs — T-PLAT-02 / TEST-PLAT-02 offline test runner.
 *
 * ISOLATED TEST ONLY. Zero-dependency: this runner needs NO `pg`, NO running
 * Postgres cluster, NO network and NO pnpm workspace install. It is the "offline"
 * half of TEST-PLAT-02 — the evidence that the fail-closed isolation guard, the
 * verbatim SQL provenance chain and the production-isolation policy contract all
 * hold *before* anybody provisions kita_core_test on 127.0.0.1:54339. The live
 * halves (fresh install + rolled-back smoke fixture) belong to src/migrate.mjs and
 * src/smoke.mjs and require a provisioned cluster; nothing here reaches for them.
 *
 * What it does
 *   1. discovers every ./tests/*.test.mjs file, sorted by name;
 *   2. runs each in its OWN child process (`node <file>`), so a test that pokes
 *      process.exit() or leaks an open handle cannot poison the rest of the suite;
 *   3. streams the child's stdout/stderr through with a `[file]` prefix and
 *      collects TAP-13 result lines (the shape node:test emits);
 *   4. prints a per-file summary plus aggregate counts and exits non-zero if any
 *      file failed, produced no assertions, or timed out.
 *
 * Exit codes
 *   0  every test file passed
 *   1  at least one test file failed / crashed / timed out / asserted nothing
 *   2  configuration error — the tests/ directory or a test file is missing
 *
 * Usage
 *   node apps/kita/database/test-runner.mjs              # run everything
 *   node apps/kita/database/test-runner.mjs guard        # only files matching "guard"
 *   node apps/kita/database/test-runner.mjs --list       # list discovered files
 *   NODE=test node apps/kita/database/test-runner.mjs    # child = `node --test <file>`
 *
 * Owned by coder-10. Sibling files (src/, config/, package.json) belong to others.
 */

import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const TESTS_DIR = join(HERE, 'tests');

// A test file that hangs longer than this is killed and counted as a failure.
// Offline tests are pure filesystem + string work; two minutes means something
// is blocking on a socket, which is exactly what this suite must never do.
const PER_FILE_TIMEOUT_MS = Number(process.env?.KITA_TEST_TIMEOUT_MS ?? 120_000);

const args = process.argv.slice(2);
const LIST_ONLY = args.includes('--list') || args.includes('-l');
const filters = args.filter((a) => !a.startsWith('-'));
const CHILD_MODE = process.env.NODE === 'test' ? 'test' : 'run';

// --- discovery ---------------------------------------------------------------

function discoverTestFiles(dir) {
  if (!existsSync(dir)) return null;
  return readdirSync(dir)
    .filter((f) => f.endsWith('.test.mjs'))
    .filter((f) => statSync(join(dir, f)).isFile())
    .sort()
    .map((f) => join(dir, f));
}

// --- TAP-13 collection -------------------------------------------------------
//
// node:test writes TAP. We only need four things from it, so we parse narrowly
// and ignore everything else: top-level `ok`/`not ok` results (assertions and
// subtests), the trailing `# fail N` / `# pass N` summary, and the `tests N`
// plan count. Fallback counters are used when a file does not emit TAP at all.

function parseTap(lines) {
  let pass = 0;
  let fail = 0;
  let skip = 0;
  let todo = 0;
  let topLevelResults = 0;
  let seenTap = false;

  for (const raw of lines) {
    const line = raw.trimEnd();
    // Top-level results only: TAP indentates nested ones with leading spaces.
    const m = /^(ok|not ok)\s+(\d+)\s*(.*)$/.exec(line);
    if (m) {
      seenTap = true;
      if (m[1] === 'ok') pass += 1;
      else fail += 1;
      topLevelResults += 1;
      const directive = m[3] ?? '';
      if (/#\s*SKIP/i.test(directive)) skip += 1;
      if (/#\s*TODO/i.test(directive)) todo += 1;
      continue;
    }
    const fm = /^# (pass|fail|skipped|todo)\s+(\d+)/.exec(line);
    if (fm) {
      seenTap = true;
      // node's own summary is authoritative when present; keep it separately.
      if (fm[1] === 'pass') pass = Math.max(pass, Number(fm[2]));
      if (fm[1] === 'fail') fail = Math.max(fail, Number(fm[2]));
      if (fm[1] === 'skipped') skip = Math.max(skip, Number(fm[2]));
      if (fm[1] === 'todo') todo = Math.max(todo, Number(fm[2]));
    }
  }

  return { pass, fail, skip, todo, topLevelResults, seenTap };
}

// --- child runner ------------------------------------------------------------

function runFile(file) {
  return new Promise((res) => {
    const rel = relative(HERE, file) || file;
    const label = rel.replace(/\\/g, '/');
    const childArgs =
      CHILD_MODE === 'test' ? ['--test', '--test-reporter=tap', file] : [file];
    const child = spawn(process.execPath, childArgs, {
      cwd: HERE,
      env: { ...process.env, KITA_OFFLINE_TEST: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, PER_FILE_TIMEOUT_MS);

    child.stdout.on('data', (b) => {
      stdout += b.toString('utf8');
      for (const l of b.toString('utf8').split('\n')) {
        if (l.trim() !== '') process.stdout.write(`  [${label}] ${l}\n`);
      }
    });
    child.stderr.on('data', (b) => {
      stderr += b.toString('utf8');
      for (const l of b.toString('utf8').split('\n')) {
        if (l.trim() !== '') process.stderr.write(`  [${label}] ${l}\n`);
      }
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      res({
        file: label,
        exitCode: null,
        spawnError: err.message,
        crash: true,
        timedOut: false,
        ...parseTap([]),
        assertions: 0,
        stdout,
        stderr,
      });
    });

    child.on('close', (code, signal) => {
      clearTimeout(timer);
      const tap = parseTap(stdout.split('\n'));
      const hardFail =
        timedOut ||
        Boolean(signal) ||
        tap.fail > 0 ||
        (code !== 0 && tap.fail === 0) ||
        // A green-looking file that ran zero assertions proves nothing.
        tap.pass === 0;
      res({
        file: label,
        exitCode: code,
        signal: signal ?? null,
        timedOut,
        crash: false,
        assertions: tap.pass + tap.fail,
        ...tap,
        stdout,
        stderr,
      });
    });
  });
}

// --- main --------------------------------------------------------------------

async function main() {
  const files = discoverTestFiles(TESTS_DIR);
  if (files === null) {
    console.error(`test-runner: no tests directory at ${TESTS_DIR}`);
    return 2;
  }
  const selected =
    filters.length === 0
      ? files
      : files.filter((f) => filters.some((needle) => f.includes(needle)));

  if (selected.length === 0) {
    console.error(
      `test-runner: no test file matches [${filters.join(', ')}] in ${TESTS_DIR}`,
    );
    return 2;
  }

  if (LIST_ONLY) {
    for (const f of selected) console.log(relative(HERE, resolve(f)));
    return 0;
  }

  console.log('=== @kita/database offline tests — T-PLAT-02 (TEST-PLAT-02) ===');
  console.log(`runner : ${relative(process.cwd(), fileURLToPath(import.meta.url))}`);
  console.log(`node   : ${process.version}`);
  console.log(`mode   : child = ${CHILD_MODE === 'test' ? 'node --test <file>' : 'node <file>'}`);
  console.log(
    `deps   : pg NOT required (${pgInstalled() ? 'present but deliberately unused' : 'absent, as expected'}); ` +
      'no DB connection attempted, no network, no money path',
  );
  console.log(`files  : ${selected.length} (${files.length} discovered)`);
  console.log('');

  const results = [];
  for (const f of selected) results.push(await runFile(f));

  console.log('');
  console.log('--- summary ---');
  const width = Math.max(...results.map((r) => r.file.length));
  let totalPass = 0;
  let totalFail = 0;
  const bad = [];
  for (const r of results) {
    const ok = !r.crash && !r.timedOut && r.exitCode === 0 && r.fail === 0 && r.pass > 0;
    totalPass += r.pass;
    totalFail += ok ? 0 : Math.max(1, r.fail);
    if (!ok) bad.push(r);
    console.log(
      `${ok ? 'PASS' : 'FAIL'}  ${r.file.padEnd(width)}  ` +
        `assertions=${r.pass}/${r.pass + r.fail}` +
        (r.skip ? ` skipped=${r.skip}` : '') +
        (r.todo ? ` todo=${r.todo}` : '') +
        (r.exitCode === 0 ? '' : ` exit=${r.exitCode ?? 'null'}`) +
        (r.signal ? ` signal=${r.signal}` : '') +
        (r.timedOut ? ' (timed out)' : '') +
        (r.spawnError ? ` (spawn error: ${r.spawnError})` : ''),
    );
  }

  console.log('');
  console.log(
    `files: ${results.length - bad.length}/${results.length} passed · ` +
      `assertions: ${totalPass} passed, ${totalFail} failed`,
  );

  if (bad.length > 0) {
    console.log('');
    console.log(`RESULT: FAIL (${bad.length} file(s): ${bad.map((b) => b.file).join(', ')})`);
    console.log(
      '  Fix the failing assertion(s) above. If the failure says the migration guard',
    );
    console.log(
      '  or the isolation contract disagrees with src/migrate.mjs / config/isolation.json,',
    );
    console.log(
      '  report the gap to Sol instead of relaxing this suite — these tests are the',
    );
    console.log('  offline half of TEST-PLAT-02 and are meant to be inconvenient.');
    return 1;
  }

  console.log('RESULT: PASS — offline TEST-PLAT-02 guards verified without pg or a live DB.');
  return 0;
}

function pgInstalled() {
  // Presence check ONLY — this runner deliberately never imports the driver, so
  // the suite stays green on a machine with no node_modules at all. Resolution
  // goes through a throwaway module so no ESM import cache is touched.
  try {
    createRequire(join(HERE, 'noop.cjs')).resolve('pg');
    return true;
  } catch {
    return false;
  }
}

process.exitCode = await main();
