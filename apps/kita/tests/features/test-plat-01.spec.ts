import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/**
 * TEST-PLAT-01 (KITA-PLAT-01) — "Exact patched locks and no server secrets in client bundle".
 * PACK-OPS, PACK-SECURITY, PACK-API; REQ-SC-01/02/03/14/15/16/19/20/21 where applicable,
 * including explicit no-op financial assertions for reads.
 *
 * Honesty rules for this file (Sol CONDITIONAL-PASS batch 1):
 *  - Assertions read the REAL repo state from disk (manifests, lockfile, client sources).
 *    If today's scaffold is not frozen, the corresponding test FAILS. Do not weaken it.
 *  - Where a check needs an artifact that does not exist yet (built bundles, generated
 *    contract-client bundle, CI lock recompute), the test asserts the CONTRACT OF THE
 *    VALIDATOR (fail-closed behaviour of @kita/platform validateBuildBaseline) instead of
 *    fabricating a pass. Those tests are marked "validator contract" in their titles.
 *  - No DB connection, no network, no install, no money effect anywhere in this suite.
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/* ------------------------------------------------------------------ *
 * Real-state readers
 * ------------------------------------------------------------------ */

interface ManifestFile {
  readonly workspacePath: string;
  readonly json: Record<string, never>;
  readonly bytes: Buffer;
}

/** Every package.json in the slice except node_modules and the workspace root itself. */
function discoverManifests(): ManifestFile[] {
  const out: ManifestFile[] = [];
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.next' || entry.name === '.expo') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === 'package.json') {
        const bytes = fs.readFileSync(full);
        out.push({
          workspacePath: path.relative(ROOT, full).split(path.sep).join('/').replace(/\/package\.json$/, ''),
          json: JSON.parse(bytes.toString('utf8')) as Record<string, never>,
          bytes,
        });
      }
    }
  };
  walk(ROOT);
  return out.sort((a, b) => a.workspacePath.localeCompare(b.workspacePath));
}

const rootManifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')) as {
  workspaces: string[];
};const declaredWorkspaces = [...rootManifest.workspaces].sort();
const manifests = discoverManifests();
const coveredManifests = manifests.filter((m) => declaredWorkspaces.includes(m.workspacePath));

/** A manifest outside the declared workspace set is not locked by the lockfile at all. */
const uncoveredManifestPaths = manifests.map((m) => m.workspacePath).filter((p) => !declaredWorkspaces.includes(p));

const sha256Hex = (buf: Buffer): string => crypto.createHash('sha256').update(buf).digest('hex');

/** Exact = a bare semver (optionally with prerelease/build). Anything else pins nothing. */
const EXACT_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.+-]+)?$/;
const INTERNAL_PKG_RE = /^@kita\//;

interface RequirementEntry {
  readonly workspacePath: string;
  readonly section: string;
  readonly packageName: string;
  readonly requirement: string;
  readonly exact: boolean;
  readonly internal: boolean;
}

function collectRequirements(onlyWorkspaces: boolean): RequirementEntry[] {
  const rows: RequirementEntry[] = [];
  for (const m of onlyWorkspaces ? coveredManifests : manifests) {
    for (const section of ['dependencies', 'devDependencies', 'peerDependencies'] as const) {
      const block = (m.json[section] ?? {}) as Record<string, string>;
      for (const [packageName, requirement] of Object.entries(block)) {
        rows.push({
          workspacePath: m.workspacePath,
          section,
          packageName,
          requirement,
          exact: EXACT_RE.test(requirement),
          internal: INTERNAL_PKG_RE.test(packageName),
        });
      }
    }
  }
  return rows;
}

const externalRequirements = collectRequirements(true).filter((r) => !r.internal);
const allRequirements = collectRequirements(false);

type Lock = { lockfileVersion: number; requires?: boolean; packages: Record<string, Record<string, unknown>> };
const lockPath = path.join(ROOT, 'package-lock.json');
const lockExists = fs.existsSync(lockPath);
const lock: Lock = lockExists
  ? (JSON.parse(fs.readFileSync(lockPath, 'utf8')) as Lock)
  : { lockfileVersion: 0, packages: {} };

const lockPackageKeys = Object.keys(lock.packages);
const externalLockNodes = lockPackageKeys.filter((k) => k.includes('node_modules/') && lock.packages[k]?.version !== undefined);
const workspaceLinkKeys = lockPackageKeys.filter(
  (k) => k.startsWith('apps/') || k.startsWith('packages/'),
);

/* ------------------------------------------------------------------ *
 * Client-source scanning (source substitute for the built bundle)
 * ------------------------------------------------------------------ */

const CLIENT_APPS = ['apps/customer', 'apps/admin', 'apps/mobile'];
const SOURCE_EXT = /\.(ts|tsx|js|jsx|mjs|cjs)$/;
const SKIP_DIRS = new Set(['node_modules', '.git', '.next', '.expo', 'dist', 'build', 'out']);

function sourceFiles(relDir: string): string[] {
  const abs = path.join(ROOT, relDir);
  if (!fs.existsSync(abs)) return [];
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (SOURCE_EXT.test(entry.name)) out.push(full);
    }
  };
  walk(abs);
  return out.sort();
}

const SERVER_SECRET_NAME_RE = /(SECRET|DATABASE_URL|API_KEY|APIKEY|PASSWORD|TOKEN|SIGNING_KEY|CREDENTIALS)/;
/** In Next.js/Expo only NEXT_PUBLIC_* / EXPO_PUBLIC_* reach the client tree. */
const CLIENT_SAFE_PREFIX_RE = /^(NEXT_PUBLIC_|EXPO_PUBLIC_)/;

interface EnvAccess {
  readonly file: string;
  readonly name: string;
  readonly raw: string;
}

function findEnvAccesses(files: string[]): EnvAccess[] {
  const hits: EnvAccess[] = [];
  for (const f of files) {
    const text = fs.readFileSync(f, 'utf8');
    const rel = path.relative(ROOT, f).split(path.sep).join('/');
    for (const m of text.matchAll(/process\.env\.([A-Za-z0-9_]+)/g)) {
      hits.push({ file: rel, name: m[1]!, raw: `process.env.${m[1]}` });
    }
    for (const m of text.matchAll(/process\.env\[\s*['"]([A-Za-z0-9_]+)['"]\s*\]/g)) {
      hits.push({ file: rel, name: m[1]!, raw: `process.env["${m[1]}"]` });
    }
    for (const m of text.matchAll(/import\.meta\.env\.([A-Za-z0-9_]+)/g)) {
      hits.push({ file: rel, name: m[1]!, raw: `import.meta.env.${m[1]}` });
    }
  }
  return hits;
}

/**
 * Server-only modules: importing node:crypto means the bundler cannot ship this
 * module to a browser, so its env reads are server-side by construction. This is
 * the structural fact behind the "no server secrets in client bundle" assertion;
 * the built-artifact scan (CI) is the authoritative version of the same check.
 */
function isServerOnlyModule(file: string): boolean {
  const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
  return /from ['"]node:(crypto|http|net|dns|fs|worker_threads)['"]/.test(text) || /require\(['"]node:/.test(text);
}

const FORBIDDEN_IDENTIFIER_RE =
  /\b(?:addSandboxFunds|simulatePartnerCompletion|adminComplete|markPaidOut|mark_paid_out|setBalance|set_balance)\b/;
/** A *call* of one of those names, or a back-office verb handed to a mutation. */
const FORBIDDEN_CALL_RE =
  /(?:\b(?:addSandboxFunds|simulatePartnerCompletion|adminComplete|markPaidOut|mark_paid_out|setBalance|set_balance)\s*\()|(?:\.(?:remittance|trpc|admin)\.(?:complete|fail)\s*\()|(?:action:\s*['"](?:complete|fail|mark_paid_out)['"])/;

/** Strip line comments, block comments and JSDoc so prose mentions are not read as code. */
function stripComments(text: string): string {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/^\s*\/\/.*$/gm, (m) => ' '.repeat(m.length));
}

interface IdentifierHit {
  readonly loc: string;
  readonly isCall: boolean;
}

function forbiddenIdentifierHits(dirs: readonly string[]): IdentifierHit[] {
  const hits: IdentifierHit[] = [];
  for (const dir of dirs) {
    for (const abs of sourceFiles(dir)) {
      const rel = path.relative(ROOT, abs).split(path.sep).join('/');
      if (rel.includes('/__tests__/') || rel.startsWith('tests/')) continue; // isolated test scope allowed
      const raw = fs.readFileSync(abs, 'utf8');
      const code = stripComments(raw);
      const lines = raw.split('\n');
      lines.forEach((line, i) => {
        if (!FORBIDDEN_IDENTIFIER_RE.test(line)) return;
        if (code.split('\n')[i] === line) return; // comment-only occurrence
        hits.push({ loc: `${rel}:${i + 1}`, isCall: FORBIDDEN_CALL_RE.test(code.split('\n')[i] ?? '') });
      });
    }
  }
  return hits;
}

/* ------------------------------------------------------------------ *
 * Validator under test — loaded by absolute path so the workspace export map
 * (which resolves @kita/contracts through node_modules) is not required here.
 * The validator is a PURE verifier: importing it executes nothing.
 * ------------------------------------------------------------------ */

type ValidateFn = (typeof import('../../packages/platform/validate-build-baseline.ts'))['validateBuildBaseline'];
type SecretSets = (typeof import('../../packages/platform/validate-build-baseline.ts'))['SECRET_SCAN_PATTERN_SETS'];
type WorkerMod = typeof import('../../packages/platform/workers/validate-build-baseline.worker.ts');

const VALIDATOR_PATH = path.join(ROOT, 'packages', 'platform', 'validate-build-baseline.ts');
const WORKER_PATH = path.join(ROOT, 'packages', 'platform', 'workers', 'validate-build-baseline.worker.ts');

async function loadValidator(): Promise<{ validateBuildBaseline: ValidateFn; SECRET_SCAN_PATTERN_SETS: SecretSets }> {
  return (await import(VALIDATOR_PATH)) as { validateBuildBaseline: ValidateFn; SECRET_SCAN_PATTERN_SETS: SecretSets };
}
async function loadWorker(): Promise<WorkerMod> {
  return (await import(WORKER_PATH)) as WorkerMod;
}

/** Deps that make every evidence probe succeed — used to isolate one failure mode at a time. */
const goodDeps = () => ({
  readClientBundle: async () => ({ artifactId: `sha256:${'a'.repeat(64)}`, text: '' }),
  recomputeLockDigest: async () => ({ lockDigest: 'b'.repeat(64), resolvedCount: 1 }),
  generatedClientsEvidence: async () => ({
    bundleDigest: 'c'.repeat(64),
    operationCount: 1,
    openApiHash: 'd'.repeat(64),
  }),
  nowIso: () => '2026-11-09T00:00:00.000Z',
});

/* ------------------------------------------------------------------ *
 * (a) every dependency pinned to an exact version, across all workspaces
 * ------------------------------------------------------------------ */

describe('TEST-PLAT-01(a) — exact patched pins across all workspaces', () => {
  it('every external requirement in every declared workspace is an exact version', () => {
    const violating = externalRequirements.filter((r) => !r.exact);
    // Honest gate: while manifests still carry ^/~ ranges this list is non-empty and fails.
    expect(
      violating.map((v) => `${v.workspacePath}#${v.section}:${v.packageName}@${v.requirement}`),
      `T-PLAT-01 pending: ${violating.length}/${externalRequirements.length} external requirements are ranges, not exact patches`,
    ).toEqual([]);
  });

  it('no requirement uses latest, *, or an open range operator', () => {
    const banned = externalRequirements.filter((r) =>
      /^(latest|\*|x|>=|<=|>|<|\^|~)/.test(r.requirement) || r.requirement.includes('||'),
    );
    expect(banned.map((b) => `${b.workspacePath}:${b.packageName}@${b.requirement}`)).toEqual([]);
  });

  it('workspace cross-links resolve to internal packages only, never to a registry range', () => {
    const externalStar = allRequirements.filter((r) => r.requirement === '*' && !r.internal);
    expect(externalStar.map((r) => `${r.workspacePath}:${r.packageName}`)).toEqual([]);
  });

  it('every declared workspace actually has a manifest on disk (no phantom pins)', () => {
    const present = new Set(manifests.map((m) => m.workspacePath));
    expect(declaredWorkspaces.filter((w) => !present.has(w))).toEqual([]);
  });

  it('no package.json lives outside the declared workspace set (unlocked dependencies fail closed)', () => {
    // Root self-reference is expected; anything else is a manifest the lock does not cover.
    expect(uncoveredManifestPaths.filter((p) => p !== '.')).toEqual([]);
  });

  it('pnpm-workspace.yaml and package.json workspaces agree (single source of truth)', () => {
    const pnpmFile = path.join(ROOT, 'pnpm-workspace.yaml');
    expect(fs.existsSync(pnpmFile)).toBe(true);
    const listed = fs
      .readFileSync(pnpmFile, 'utf8')
      .split('\n')
      .map((l) => l.replace(/^\s*-\s*/, '').replaceAll("'", '').replaceAll('"', '').trim())
      .filter((l) => l.length > 0 && !l.startsWith('packages:'));
    expect([...new Set(listed)].sort()).toEqual(declaredWorkspaces);
  });

  it('each reviewed manifest hash is reproducible sha256 over its own bytes (Plat01Input.manifests evidence)', () => {
    const evidence = coveredManifests.map((m) => ({
      path: m.workspacePath,
      hash: sha256Hex(m.bytes),
      coveredByLockfile: true,
    }));
    expect(evidence).toHaveLength(declaredWorkspaces.length);
    for (const e of evidence) expect(e.hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

/* ------------------------------------------------------------------ *
 * (b) lockfile presence and integrity hashes
 * ------------------------------------------------------------------ */

describe('TEST-PLAT-01(b) — lockfile presence and integrity', () => {
  it('a lockfile exists at the workspace root', () => {
    expect(lockExists, 'no package-lock.json under apps/kita').toBe(true);
  });

  it('the lockfile covers exactly the declared workspace set', () => {
    expect(workspaceLinkKeys.sort(), 'lockfile does not link every declared workspace').toEqual(declaredWorkspaces);
  });

  it('every resolved external node carries a sha512 integrity value', () => {
    const missing = externalLockNodes.filter((k) => {
      const node = lock.packages[k]!;
      return typeof node.integrity !== 'string' || !/^sha512-/.test(node.integrity);
    });
    expect(missing, `${missing.length} locked nodes lack sha512 integrity`).toEqual([]);
  });

  it('every resolved external node carries a registry `resolved` URL', () => {
    const missing = externalLockNodes.filter((k) => typeof lock.packages[k]!.resolved !== 'string');
    expect(missing).toEqual([]);
  });

  it('the lock resolves each externally-required direct dependency to one exact version', () => {
    // The lock is the pin of record: a caret requirement is acceptable ONLY because the
    // locked version below is exact. Unresolvable requirements are UNRESOLVED_VERSION.
    const unresolved: string[] = [];
    for (const req of externalRequirements) {
      const key = `node_modules/${req.packageName}`;
      const wsKey = `${req.workspacePath}/node_modules/${req.packageName}`;
      const node = lock.packages[wsKey] ?? lock.packages[key];
      if (!node || typeof node.version !== 'string' || !EXACT_RE.test(node.version)) {
        unresolved.push(`${req.workspacePath}:${req.packageName}@${req.requirement}`);
      }
    }
    expect(unresolved, `${unresolved.length} requirements have no exact locked version`).toEqual([]);
  });

  it('lockfile records the pinned toolchain used by this lane (typescript/vitest reproducibility)', () => {
    const ts = lock.packages['node_modules/typescript'];
    expect(typeof ts?.version).toBe('string');
    // Deterministic freeze requires the *declared* compiler pin to be exact too.
    const declaredTs = allRequirements.filter((r) => r.packageName === 'typescript');
    expect(
      declaredTs.filter((r) => !r.exact).map((r) => `${r.workspacePath}@${r.requirement}`),
      'typescript is range-pinned; builds are not reproducible until T-PLAT-01 freezes it',
    ).toEqual([]);
  });

  it('validator contract: absent lock-recompute evidence fails closed as COMPATIBILITY_FAILURE', async () => {
    const { validateBuildBaseline } = await loadValidator();
    const deps = goodDeps();
    const receipt = await validateBuildBaseline(workerContext(), plat01InputFixture(), {
      ...deps,
      recomputeLockDigest: async () => undefined, // CI did not produce a reproducible lock
    });
    expect(receipt.ok).toBe(false);
    if (!receipt.ok) expect(receipt.error.code).toBe('COMPATIBILITY_FAILURE');
  });
});

/* ------------------------------------------------------------------ *
 * (c) web vs native React peer sets are separate
 * ------------------------------------------------------------------ */

describe('TEST-PLAT-01(c) — separate web/native React peer sets', () => {
  const webApps = ['apps/customer', 'apps/admin'];
  const nativeApps = ['apps/mobile'];

  const reactReq = (dirs: string[]): string[] =>
    dirs.flatMap((d) => {
      const p = path.join(ROOT, d, 'package.json');
      if (!fs.existsSync(p)) return [];
      const j = JSON.parse(fs.readFileSync(p, 'utf8')) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
      return [j.dependencies?.react, j.devDependencies?.react].filter((v): v is string => typeof v === 'string');
    });

  it('the native app pins react-native and the web apps do not', () => {
    const mobile = JSON.parse(fs.readFileSync(path.join(ROOT, 'apps/mobile/package.json'), 'utf8')) as {
      dependencies?: Record<string, string>;
    };
    expect(typeof mobile.dependencies?.['react-native']).toBe('string');
    for (const d of webApps) {
      const j = JSON.parse(fs.readFileSync(path.join(ROOT, d, 'package.json'), 'utf8')) as { dependencies?: Record<string, string> };
      expect(j.dependencies?.['react-native'], `${d} must not carry react-native`).toBeUndefined();
    }
  });

  it('web and native react requirement sets are disjoint (one merged peer set is a compatibility failure)', () => {
    const web = new Set(reactReq(webApps));
    const native = new Set(reactReq(nativeApps));
    const shared = [...web].filter((v) => native.has(v));
    expect(shared, `web and native declare the same react requirement: ${shared.join(', ')}`).toEqual([]);
  });

  it('each environment declares exactly one distinct react major line in the lock', () => {
    const webLocked = lock.packages['node_modules/react']?.version;
    const nativeLocked = lock.packages['apps/mobile/node_modules/react']?.version;
    expect(typeof webLocked).toBe('string');
    expect(typeof nativeLocked).toBe('string');
    expect(webLocked, 'native and web must resolve to different react versions').not.toBe(nativeLocked);
  });

  it('validator contract: a single merged peer set is rejected as COMPATIBILITY_FAILURE', async () => {
    const { validateBuildBaseline } = await import('../packages/platform/validate-build-baseline.ts');
    const input = plat01InputFixture();
    const receipt = await validateBuildBaseline(workerContext(), { ...input, nativePeers: [input.nativePeers[0]!] }, {
      readClientBundle: async () => ({ artifactId: 'sha256:' + 'a'.repeat(64), text: '' }),
      recomputeLockDigest: async () => ({ lockDigest: 'b'.repeat(64), resolvedCount: 1 }),
      generatedClientsEvidence: async () => ({ bundleDigest: 'c'.repeat(64), operationCount: 1, openApiHash: 'd'.repeat(64) }),
      nowIso: () => '2026-11-09T00:00:00.000Z',
    });
    expect(receipt.ok).toBe(false);
    if (!receipt.ok) expect(receipt.error.code).toBe('COMPATIBILITY_FAILURE');
  });
});

/* ------------------------------------------------------------------ *
 * (d) no server-only secret identifier/env var in client bundle sources
 * ------------------------------------------------------------------ */

describe("TEST-PLAT-01(d) — no server secrets in client bundle", () => {
  const clientFiles = CLIENT_APPS.flatMap((d) => sourceFiles(d));

  it('client app sources exist to scan at all', () => {
    expect(clientFiles.length).toBeGreaterThan(0);
  });

  it('no secret-shaped process.env read survives inside a client-compilable module', () => {
    const violations = findEnvAccesses(clientFiles)
      .filter((h) => SERVER_SECRET_NAME_RE.test(h.name) && !CLIENT_SAFE_PREFIX_RE.test(h.name))
      .filter((h) => !isServerOnlyModule(h.file));
    expect(
      violations.map((v) => `${v.file}: ${v.raw}`),
      'a server-only env name is readable from a module the bundler can ship to the client',
    ).toEqual([]);
  });

  it('every server-only secret read sits in a module the bundler cannot ship (node builtin boundary)', () => {
    const secretReads = findEnvAccesses(clientFiles).filter(
      (h) => SERVER_SECRET_NAME_RE.test(h.name) && !CLIENT_SAFE_PREFIX_RE.test(h.name),
    );
    const unprotected = secretReads.filter((h) => !isServerOnlyModule(h.file));
    expect(unprotected.map((u) => `${u.file}:${u.name}`)).toEqual([]);
    // Sanity: the admin session signer really is one of these guarded reads.
    expect(secretReads.some((h) => h.name === 'KITA_ADMIN_SESSION_SECRET')).toBe(true);
  });

  it('no literal secret material appears in any client source', () => {
    const literalPatterns: RegExp[] = [
      /sk_live_[0-9a-zA-Z]{16,}/g,
      /sk_test_[0-9a-zA-Z]{16,}/g,
      /AKIA[0-9A-Z]{16}/g,
      /ghp_[0-9A-Za-z]{36}/g,
      /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
      /service_role/g,
    ];
    const findings: string[] = [];
    for (const f of clientFiles) {
      const rel = path.relative(ROOT, f).split(path.sep).join('/');
      const text = fs.readFileSync(f, 'utf8');
      for (const re of literalPatterns) {
        re.lastIndex = 0;
        const m = re.exec(text);
        if (m) findings.push(`${rel}: pattern[${re.source.slice(0, 24)}]@${m.index}`); // locator only
      }
    }
    expect(findings).toEqual([]);
  });

  it('client bundle artifacts are not built yet, so the authoritative scan is CI-owned (asserted as validator contract)', async () => {
    const artifactDirs = ['apps/customer/.next/static', 'apps/admin/.next/static', 'apps/mobile/dist'];
    const present = artifactDirs.filter((d) => fs.existsSync(path.join(ROOT, d)));
    expect(present, 'built bundles exist — replace the source-substitute scan with the artifact scan').toEqual([]);

    // Contract of the validator when the artifact is missing: SECURITY_FAILURE, never a pass.
    const { validateBuildBaseline } = await import('../packages/platform/validate-build-baseline.ts');
    const receipt = await validateBuildBaseline(workerContext(), plat01InputFixture(), {
      readClientBundle: async () => undefined,
      recomputeLockDigest: async () => ({ lockDigest: 'b'.repeat(64), resolvedCount: 1 }),
      generatedClientsEvidence: async () => ({ bundleDigest: 'c'.repeat(64), operationCount: 1, openApiHash: 'd'.repeat(64) }),
      nowIso: () => '2026-11-09T00:00:00.000Z',
    });
    expect(receipt.ok).toBe(false);
    if (!receipt.ok) {
      expect(receipt.error.code).toBe('SECURITY_FAILURE');
      expect(receipt.error.status).toBe(503);
      expect(receipt.error.retryable).toBe(true);
    }
  });

  it('secret-scan pattern set is version-pinned and unknown versions fail closed', async () => {
    const { SECRET_SCAN_PATTERN_SETS, validateBuildBaseline } = await import(
      '../packages/platform/validate-build-baseline.ts'
    );
    expect(Object.keys(SECRET_SCAN_PATTERN_SETS)).toContain('v1');
    const input = { ...plat01InputFixture(), secretScanPatternsVersion: 'v-does-not-exist' };
    const receipt = await validateBuildBaseline(workerContext(), input, {
      readClientBundle: async () => ({ artifactId: 'sha256:' + 'a'.repeat(64), text: '' }),
      recomputeLockDigest: async () => ({ lockDigest: 'b'.repeat(64), resolvedCount: 1 }),
      generatedClientsEvidence: async () => ({ bundleDigest: 'c'.repeat(64), operationCount: 1, openApiHash: 'd'.repeat(64) }),
      nowIso: () => '2026-11-09T00:00:00.000Z',
    });
    expect(receipt.ok).toBe(false);
    if (!receipt.ok) expect(receipt.error.code).toBe('SECURITY_FAILURE');
  });

  it('findings are reported as locators only, never echoing matched secret material', async () => {
    const { validateBuildBaseline } = await import('../packages/platform/validate-build-baseline.ts');
    const planted = 'before x-api-key="not-a-real-credential-value" after';
    const receipt = await validateBuildBaseline(workerContext(), plat01InputFixture(), {
      readClientBundle: async () => ({ artifactId: 'bundle-1', text: planted }),
      recomputeLockDigest: async () => ({ lockDigest: 'b'.repeat(64), resolvedCount: 1 }),
      generatedClientsEvidence: async () => ({ bundleDigest: 'c'.repeat(64), operationCount: 1, openApiHash: 'd'.repeat(64) }),
      nowIso: () => '2026-11-09T00:00:00.000Z',
    });
    expect(receipt.ok).toBe(false);
    if (!receipt.ok) {
      expect(receipt.error.code).toBe('SECURITY_FAILURE');
      expect(receipt.error.detail).not.toContain('not-a-real-credential-value');
    }
  });

  it('forbidden outcome-manufacturing identifiers appear nowhere as callable code in production-reachable paths', () => {
    const findings = forbiddenCallSites([...CLIENT_APPS, 'packages', 'database', 'sql']);
    expect(findings, `outcome-manufacturing call site(s): ${findings.join(' | ')}`).toEqual([]);
  });
});

/* ------------------------------------------------------------------ *
 * (e) explicit no-op financial assertion — the validator mutates nothing
 * ------------------------------------------------------------------ */

describe('TEST-PLAT-01(e) — explicit no-op financial assertions for reads', () => {
  it('validateBuildBaseline performs zero DB writes and zero money mutations (pure verification)', async () => {
    const before = snapshotMutableState();
    const traced: string[] = [];
    const receipt = await validateBuildBaseline(
      workerContext(traced),
      plat01InputFixture(),
      {
        readClientBundle: async () => ({ artifactId: 'sha256:' + 'a'.repeat(64), text: '' }),
        recomputeLockDigest: async () => ({ lockDigest: 'b'.repeat(64), resolvedCount: 1 }),
        generatedClientsEvidence: async () => ({ bundleDigest: 'c'.repeat(64), operationCount: 1, openApiHash: 'd'.repeat(64) }),
        nowIso: () => '2026-11-09T00:00:00.000Z',
      },
    );
    const after = snapshotMutableState();

    expect(receipt.ok, 'fixture input should satisfy the verifier; see earlier failures otherwise').toBe(true);
    expect(after).toEqual(before); // no file written, no DB touched, no balance changed
    expect(traced).toContain('build_baseline_validated');
    // A successful platform read returns proofs only — never a money figure.
    if (receipt.ok) {
      const serialized = JSON.stringify(receipt.value);
      expect(serialized).not.toMatch(/balance|amountMinor|journal/i);
      expect(serialized).not.toMatch(/"(credit|debit)"/i);
    }
  });

  it('the worker exposes no customer HTTP mutation and its default deps refuse to manufacture evidence', async () => {
    const worker = await import('../packages/platform/workers/validate-build-baseline.worker.ts');
    expect(worker.meta.httpMutable).toBe(false);
    expect(worker.meta.workerName).toBe('validate-build-baseline');

    const traced: string[] = [];
    const receipt = await worker.run(workerContext(traced), plat01InputFixture()); // disabled deps by default
    expect(receipt.ok).toBe(false);
    if (!receipt.ok) expect(receipt.error.code).toBe('dependency_unavailable');
    expect(traced).toContain('worker_evidence_unavailable');
  });

  it('no DB driver or money-writing surface is reachable from the platform lane source', async () => {
    const platformFiles = sourceFiles('packages/platform');
    const offenders: string[] = [];
    for (const f of platformFiles) {
      const rel = path.relative(ROOT, f).split(path.sep).join('/');
      const text = fs.readFileSync(f, 'utf8');
      if (/from ['"](pg|mysql2|better-sqlite3)['"]|createPool\(|new Pool\(/.test(text)) offenders.push(rel);
      if (/INSERT INTO|UPDATE\s+\w+\s+SET|DELETE FROM/.test(text)) offenders.push(`${rel} (SQL DML)`);
    }
    expect(offenders).toEqual([]);
  });

  it('empty/unreviewed input fails closed rather than freezing a baseline', async () => {
    const { validateBuildBaseline } = await import('../packages/platform/validate-build-baseline.ts');
    const empty = { ...plat01InputFixture(), manifests: [] };
    const receipt = await validateBuildBaseline(workerContext(), empty, {
      readClientBundle: async () => ({ artifactId: 'x', text: '' }),
      recomputeLockDigest: async () => ({ lockDigest: 'b'.repeat(64), resolvedCount: 0 }),
      generatedClientsEvidence: async () => ({ bundleDigest: 'c'.repeat(64), operationCount: 0, openApiHash: 'd'.repeat(64) }),
      nowIso: () => '2026-11-09T00:00:00.000Z',
    });
    expect(receipt.ok).toBe(false);
    if (!receipt.ok) expect(receipt.error.code).toBe('invalid_request');
  });

  it('a range-pinned pin is reported as UNRESOLVED_VERSION (backlog additional error)', async () => {
    const { validateBuildBaseline } = await import('../packages/platform/validate-build-baseline.ts');
    const input = plat01InputFixture();
    const receipt = await validateBuildBaseline(
      workerContext(),
      { ...input, pins: [{ ...input.pins[0]!, exactVersion: '^18.3.0' }] },
      {
        readClientBundle: async () => ({ artifactId: 'x', text: '' }),
        recomputeLockDigest: async () => ({ lockDigest: 'b'.repeat(64), resolvedCount: 1 }),
        generatedClientsEvidence: async () => ({ bundleDigest: 'c'.repeat(64), operationCount: 1, openApiHash: 'd'.repeat(64) }),
        nowIso: () => '2026-11-09T00:00:00.000Z',
      },
    );
    expect(receipt.ok).toBe(false);
    if (!receipt.ok) {
      expect(receipt.error.code).toBe('UNRESOLVED_VERSION');
      expect(receipt.error.status).toBe(422);
    }
  });

  it('generated contract clients are never fabricated: missing generator evidence fails closed', async () => {
    const { validateBuildBaseline } = await import('../packages/platform/validate-build-baseline.ts');
    const receipt = await validateBuildBaseline(workerContext(), plat01InputFixture(), {
      readClientBundle: async () => ({ artifactId: 'sha256:' + 'a'.repeat(64), text: '' }),
      recomputeLockDigest: async () => ({ lockDigest: 'b'.repeat(64), resolvedCount: 1 }),
      generatedClientsEvidence: async () => undefined, // T-CONTRACT-01 generator has not run
      nowIso: () => '2026-11-09T00:00:00.000Z',
    });
    expect(receipt.ok).toBe(false);
    if (!receipt.ok) expect(receipt.error.code).toBe('CAPABILITY_UNAVAILABLE');
  });
});

/* ------------------------------------------------------------------ *
 * Fixtures — evidence-shaped per Plat01Input, derived from real disk state
 * ------------------------------------------------------------------ */

function plat01InputFixture() {
  const manifests = coveredManifests.map((m) => ({
    path: m.workspacePath,
    name: String((m.json as { name?: string }).name ?? m.workspacePath),
    hash: sha256Hex(m.bytes),
    reviewedBy: 'TEST-PLAT-01',
    reviewCommit: '0'.repeat(40),
    coveredByLockfile: true,
  }));
  const pins = externalRequirements.map((r) => {
    const node =
      lock.packages[`${r.workspacePath}/node_modules/${r.packageName}`] ?? lock.packages[`node_modules/${r.packageName}`];
    return {
      packageName: r.packageName,
      exactVersion: typeof node?.version === 'string' ? node.version : r.requirement,
      integrity: typeof node?.integrity === 'string' ? node.integrity : '',
      patches: [] as string[],
    };
  });
  const nativePeers = [
    {
      environment: 'web' as const,
      reactVersion: String(lock.packages['node_modules/react']?.version ?? '0.0.0'),
      nativeModules: [] as { name: string; prebuiltHash: string }[],
      peerRequirement: reactPeerFor(['apps/customer']),
    },
    {
      environment: 'native' as const,
      reactVersion: String(lock.packages['apps/mobile/node_modules/react']?.version ?? '0.0.0'),
      nativeModules: [
        {
          name: 'react-native',
          prebuiltHash: sha256Hex(Buffer.from(String(lock.packages['apps/mobile/node_modules/react-native']?.integrity ?? ''))),
        },
      ],
      peerRequirement: reactPeerFor(['apps/mobile']),
    },
  ];
  return {
    manifests,
    pins,
    nativePeers,
    clientBundleArtifactId: 'sha256:' + 'a'.repeat(64),
    secretScanPatternsVersion: 'v1',
  };
}

function reactPeerFor(dirs: string[]): string {
  for (const d of dirs) {
    const p = path.join(ROOT, d, 'package.json');
    if (!fs.existsSync(p)) continue;
    const j = JSON.parse(fs.readFileSync(p, 'utf8')) as { dependencies?: Record<string, string> };
    if (j.dependencies?.react) return j.dependencies.react;
  }
  return 'unset';
}

function workerContext(sink?: string[]) {
  return {
    workId: '11111111-1111-4111-8111-111111111111',
    attemptGeneration: 1,
    correlationId: '22222222-2222-4222-8222-222222222222',
    startedAt: '2026-11-09T00:00:00.000Z',
    trace: (message: string) => sink?.push(message),
    capability: async () => ({ ok: true as const, value: false }),
  };
}

/** Everything the verifier could mutate: the whole slice tree minus ignored dirs, plus env. */
function snapshotMutableState(): string {
  const digest = crypto.createHash('sha256');
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else {
        const st = fs.statSync(full);
        digest.update(`${path.relative(ROOT, full)}|${st.size}|${sha256Hex(fs.readFileSync(full))}\n`);
      }
    }
  };
  walk(ROOT);
  digest.update(`env:${Object.keys(process.env).filter((k) => /KITA|PG|DATABASE/.test(k)).sort().join(',')}`);
  return digest.digest('hex');
}
