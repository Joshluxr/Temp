/*
 * tests/no-money-in-scaffold.test.mjs — T-PLAT-02 / SOL batch-1 negative test (offline).
 *
 * Sol's CONDITIONAL-PASS wording: "NO real money, NO fake KYC, NO
 * addSandboxFunds/simulatePartnerCompletion/admin complete-fail in production
 * target". This test greps the Kita scaffold under apps/kita/{apps,packages} and
 * proves none of it is WIRED to a money path.
 *
 * Deliberate design: prose about the prohibitions is ALLOWED — docs/FORBIDDEN.md,
 * isolation.md and several source headers cite these names precisely so reviewers
 * can see what is banned, and apps/admin/lib/secret-scan.ts stores the names as
 * string literals that a scanner compares against. Only IMPORT/CALL syntax counts
 * as a violation. To keep that distinction honest we strip comments before
 * scanning; string literals are handled by targeted rules (a bare string naming a
 * forbidden mutation is not a call), while an import specifier or a call expression
 * is always fatal.
 *
 * Offline: filesystem only. No pg, no DB, no network.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG_DIR = resolve(HERE, '..'); // apps/kita/database
const KITA_ROOT = resolve(PKG_DIR, '..'); // apps/kita
const SCAN_ROOTS = [join(KITA_ROOT, 'apps'), join(KITA_ROOT, 'packages')];

const EXTENSIONS = new Set(['.ts', '.tsx', '.mjs', '.json']);
const SKIP_DIRS = new Set([
  'node_modules',
  '.next',
  '.expo',
  'dist',
  'build',
  'coverage',
  '__tests__',
  '.git',
]);

/** Collect every scannable source file beneath the roots. */
function collect(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out; // root not created yet in this batch — asserted separately below
  }
  for (const name of entries) {
    const p = join(dir, name);
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (!SKIP_DIRS.has(name)) out.push(...collect(p));
    } else if (st.isFile() && EXTENSIONS.has(name.slice(name.lastIndexOf('.')))) {
      out.push(p);
    }
  }
  return out.sort();
}

/**
 * Remove /* ... *\/ and line comments so documentation of a prohibition never
 * reads like a use of it. String contents are preserved (that is what lets the
 * scanner still catch `import('addSandboxFunds')`).
 */
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

const files = SCAN_ROOTS.flatMap(collect);
const cache = new Map(files.map((f) => [f, stripComments(readFileSync(f, 'utf8'))]));
const rel = (f) => relative(KITA_ROOT, f).replace(/\\/g, '/');

function findings(predicate) {
  const hits = [];
  for (const [f, code] of cache) {
    code.split(/\r?\n/).forEach((line, i) => {
      const why = predicate(line);
      if (why) hits.push(`${rel(f)}:${i + 1}: ${why} — ${line.trim().slice(0, 140)}`);
    });
  }
  return hits;
}

// --- rules -------------------------------------------------------------------

// 1. tRPC client wiring. Batch 1 has no transport layer at all: no router type
//    import, no provider, no hook, no procedure call. Prose mentioning that tRPC
//    was removed is stripped with the comment it lives in.
const TRPC_RE = /\btrpc\b|\btRPC\b|createTRPC|@trpc\/|\.useQuery\(|\.useMutation\(/;

// 2. Forbidden outcome-manufacturing mutations used as identifiers: imported,
//    called, or referenced as a route/router symbol.
const MINTING_RE =
  /\b(?:addSandboxFunds|simulatePartnerCompletion|markPaidOut|mark_paid_out)\b/;

// 3. Provider / money-rail SDKs. A dependency on one is a live-money vector, so
//    neither an import nor a package.json entry may exist in batch 1.
const PROVIDER_SDK_RE =
  /(?:from\s+['"]|require\(\s*['"]|import\(\s*['"])((?:@[a-z0-9-]+\/)?[a-z0-9._-]+)['"]/gi;
const BANNED_PACKAGES = [
  'stripe',
  '@stripe/stripe-js',
  'ramp',
  '@ramp-network',
  'currencyapi',
  'currency-api',
  'paypal',
  '@paypal',
  'braintree',
  'wise',
  'circle',
  '@circle',
  'plaid',
  'dwolla',
  'moov',
  'coinbase',
  'squid-sdk',
  '@solana',
  'ethers',
  'viem',
  'mysql2',
  '@planetscale',
  'drizzle-orm/mysql-core',
];

// 4. Direct sandbox-money DML in scaffold code (the ledger gate says balances move
//    only through post_journal with verified evidence).
const MONEY_DML_RE =
  /\b(?:INSERT\s+INTO\s+(?:kita\.)?(?:account_balances|ledger_accounts|journals)|UPDATE\s+(?:kita\.)?account_balances|SET\s+LOCAL\s+role\s+'kita_posting')/i;

// 5. Production credentials reaching client bundles.
const CLIENT_SECRET_RE = /(process\.env\.NEXT_PUBLIC_[A-Z_]*(KEY|SECRET|TOKEN))|BEGIN (RSA|EC) PRIVATE KEY/;

test('scaffold scan actually found files to scan', () => {
  assert.ok(
    files.length >= 10,
    `expected a populated scaffold under apps/kita/{apps,packages}, got ${files.length} file(s). ` +
      `A vacuous pass here would silently un-gate the batch.`,
  );
  // Sanity: the scanner must be looking at the lanes that could carry money paths.
  const rels = files.map(rel);
  for (const lane of ['apps/', 'packages/']) {
    assert.ok(
      rels.some((r) => r.startsWith(lane)),
      `scan roots do not cover ${lane}; check SCAN_ROOTS`,
    );
  }
});

test('no tRPC client wiring anywhere in the scaffold', () => {
  const hits = findings((line) => (TRPC_RE.test(line) ? 'tRPC client wiring' : null));
  assert.deepEqual(hits, [], 'batch 1 must ship no tRPC/router transport (docs/FORBIDDEN.md)');
});

test('forbidden money mutations are never imported or called', () => {
  // Import/call shapes specifically — a string literal in a scanner blocklist or a
  // banner array is documentation of the ban, not a use of it.
  const hits = findings((line) => {
    if (!MINTING_RE.test(line)) return null;
    if (
      /import\s.*(?:addSandboxFunds|simulatePartnerCompletion|markPaidOut)/.test(line) ||
      /(?:addSandboxFunds|simulatePartnerCompletion|markPaidOut)\s*\(/.test(line) ||
      /(?:router|trpc|api|app|procedure|mutation)\s*\.\s*(?:addSandboxFunds|simulatePartnerCompletion|markPaidOut)/i.test(line) ||
      /^\s*(?:export\s+)?(?:async\s+)?function\s+(?:addSandboxFunds|simulatePartnerCompletion|markPaidOut)/.test(line)
    ) {
      return 'forbidden mutation imported/called/declared';
    }
    return null;
  });
  assert.deepEqual(hits, [], 'outcome manufacturing must be excluded from the build path, not disabled at runtime');
});

test('no provider/money-rail SDK dependency in the scaffold', () => {
  const hits = [];
  for (const [f, code] of cache) {
    for (const m of code.matchAll(PROVIDER_SDK_RE)) {
      const spec = m[1];
      const bad = BANNED_PACKAGES.find(
        (b) => spec === b || spec.startsWith(`${b}/`) || spec.startsWith(`${b}@`) || spec.startsWith(`${b}-`),
      );
      if (bad) hits.push(`${rel(f)}: provider SDK module "${spec}" (banned: ${bad})`);
    }
    // package.json dependencies are checked as data, not as import syntax.
    if (f.endsWith('package.json')) {
      const pkg = JSON.parse(code);
      for (const section of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
        for (const dep of Object.keys(pkg[section] ?? {})) {
          const bad = BANNED_PACKAGES.find(
            (b) => dep === b || dep.startsWith(`${b}/`) || dep.startsWith(`${b}-`) || dep.startsWith(`${b}@`),
          );
          if (bad) hits.push(`${rel(f)} [${section}]: "${dep}" (banned: ${bad})`);
        }
      }
    }
  }
  assert.deepEqual(hits, [], 'no live payment/fx/payout provider may be reachable from batch 1 scaffold');
});

test('no direct sandbox-balance DML or ledger writes in scaffold code', () => {
  const hits = findings((line) => (MONEY_DML_RE.test(line) ? 'direct money DML' : null));
  assert.deepEqual(hits, [], 'balances move only via kita.post_journal with verified evidence (isolation.md §2.2.6)');
});

test('no server secrets or private keys in scaffold sources', () => {
  const hits = findings((line) => (CLIENT_SECRET_RE.test(line) ? 'secret material' : null));
  assert.deepEqual(hits, [], 'TEST-PLAT-01: no server secrets in anything client-reachable');
});

test('migration/smoke tooling itself stays free of money-minting calls', async () => {
  // The suite's own package: coder-07's migrate.mjs and coder-10's smoke.mjs.
  const targets = ['src/migrate.mjs', 'src/smoke.mjs'].map((p) => join(PKG_DIR, p));
  for (const f of targets) {
    const code = stripComments(readFileSync(f, 'utf8'));
    assert.doesNotMatch(
      code,
      MINTING_RE,
      `${rel(f)} must not reference an outcome-manufacturing mutation even as an identifier`,
    );
    assert.doesNotMatch(code, MONEY_DML_RE, `${rel(f)} must not write ledger/balance rows directly`);
  }
});
