#!/usr/bin/env node
/**
 * Kita migration inventory check — T-MIG-01 (docs/kita-plan/13-backlog.md).
 * STUB: it performs static, read-only verification only. It connects to nothing,
 * executes no SQL, calls no provider and posts no money — batch 1 carries none
 * (docs/FORBIDDEN.md).
 *
 * Implements the planned contract:
 *   verifyMigration(inventory: SourceInventory, dispositions: Disposition[]): MigrationReport
 *
 * Checks:
 *   1. Coverage — docs/kita-plan/evidence/app-inventory.json (the frozen 142-file
 *      SHA-256 inventory) and docs/migration/disposition-manifest.json agree
 *      exactly: no missing path, no duplicate, no extra, one primary disposition
 *      per physical file from { replace | remove | port-ui-only }. The manifest's
 *      recorded inventory_sha256 must match the inventory on disk.
 *   2. Archive preservation — every inventoried path still exists under
 *      docs/kita-sources/kimi-archive/app. A "remove" disposition means omit
 *      from the target, NEVER delete the supplied archive; a vanished source row
 *      is evidence destruction and fails closed.
 *   3. addSandboxFunds export gate — register F-01 (docs/FORBIDDEN-PATHS.md):
 *      addSandboxFunds must never be a production export. Any module reachable
 *      from a workspace package entrypoint that exports the identifier fails.
 *      Ban-naming is legal: comments, quoted strings/regex, and deny-shaped
 *      occurrences (`allowed: false` / `CAPABILITY_UNAVAILABLE` lines), matching
 *      scripts/guard-no-outcome-manufacturing.mjs semantics.
 *
 * Any violation → exit 1 with a report. Clean tree → pass message.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

type SourceInventoryRow = { path: string; sha256?: string; decision?: string; target?: string };
type DispositionRow = { path: string; disposition: string; sha256?: string };
export type MigrationReport = { ok: boolean; findings: string[]; inventoried: number; dispositioned: number };

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..'); // apps/kita
const REPO = resolve(ROOT, '..', '..');
const INVENTORY_PATH = join(REPO, 'docs/kita-plan/evidence/app-inventory.json');
const MANIFEST_PATH = join(ROOT, 'docs/migration/disposition-manifest.json');
const ARCHIVE_ROOT = join(REPO, 'docs/kita-sources/kimi-archive/app');
const FORBIDDEN_EXPORT = 'addSandboxFunds';
const ALLOWED_DISPOSITIONS = new Set(['replace', 'remove', 'port-ui-only']);

/** Paths whose content is test scope only — an export there is not production-reachable. */
function isTestPath(rel: string): boolean {
  return rel.includes('__tests__/') || rel.startsWith('tests/') || /\.(test|spec)\.[cm]?[jt]sx?$/.test(rel);
}

function readJson(file: string): any {
  return JSON.parse(readFileSync(file, 'utf8'));
}

/** Replace comment spans, string/template literals and regex bodies with spaces. */
function blankNonCode(source: string): string {
  let out = '';
  let i = 0;
  const regexAllowed = () => /(?:^|[=(,:[!&|?{};+*/%<>^~\n])\s*$/.test(out);
  while (i < source.length) {
    const c = source[i];
    const two = source.slice(i, i + 2);
    if (two === '//') {
      const nl = source.indexOf('\n', i);
      const end = nl === -1 ? source.length : nl;
      out += ' '.repeat(end - i);
      i = end;
    } else if (two === '/*') {
      const close = source.indexOf('*/', i + 2);
      const end = close === -1 ? source.length : close + 2;
      out += source.slice(i, end).replace(/[^\n]/g, ' ');
      i = end;
    } else if (c === '"' || c === "'" || c === '`') {
      let j = i + 1;
      while (j < source.length) {
        if (source[j] === '\\') { j += 2; continue; }
        if (source[j] === c) { j += 1; break; }
        j += 1;
      }
      out += c + source.slice(i + 1, j - 1).replace(/[^\n]/g, ' ') + c;
      i = j;
    } else if (c === '/' && regexAllowed()) {
      let j = i + 1;
      let inClass = false;
      while (j < source.length) {
        const d = source[j];
        if (d === '\\') { j += 2; continue; }
        if (d === '[') inClass = true;
        else if (d === ']') inClass = false;
        else if (d === '/' && !inClass) { j += 1; break; }
        else if (d === '\n') break;
        j += 1;
      }
      if (source[j - 1] === '/') {
        while (j < source.length && /[a-z]/.test(source[j])) j += 1;
        out += '/' + ' '.repeat(j - i - 1);
        i = j;
      } else {
        out += c;
        i += 1;
      }
    } else {
      out += c;
      i += 1;
    }
  }
  return out;
}

function lineIsDenial(line: string): boolean {
  return /allowed:\s*false/.test(line) || /CAPABILITY_UNAVAILABLE/.test(line);
}

/** Export-position shapes for the forbidden identifier inside blanked code. */
const EXPORT_PATTERNS = [
  /\bexport\s+(?:async\s+)?(?:function|const|let|var|class)\s+addSandboxFunds\b/,
  /\bexport\s*\{[^}]*\baddSandboxFunds\b[^}]*\}/,
  /\bexport\s+default\s+[^;\n]*\baddSandboxFunds\b/,
];

/** tRPC-style procedure definition: `addSandboxFunds: <something>.mutation(`. */
const PROCEDURE_DEF = /\baddSandboxFunds\s*:\s*[A-Za-z_$][\w$.]*\s*\.\s*mutation\s*\(/;

/** Object-literal shorthand method definition: `addSandboxFunds(...) {`. */
const METHOD_DEF = /\baddSandboxFunds\s*\(([^()]*)\)\s*\{/;

/** `export * from '<specifier>'` where the specifier names the identifier. */
const STAR_EXPORT_OF_NAME = /\bexport\s+\*\s+(?:as\s+\w+\s+)?from\s*(['"])([^'"]*addSandboxFunds[^'"]*)\1/;

// ---------------------------------------------------------------------------
// Reachability: BFS over local imports from every workspace package entrypoint.
// ---------------------------------------------------------------------------

function extractLocalImports(code: string, fileDir: string): string[] {
  const specs = [];
  const patterns = [
    /\bimport\s+(?:type\s+)?[^'"]*?from\s*(['"])([^'"]+)\1/g,
    /\bimport\s+(['"])([^'"]+)\1/g,
    /\bexport\s+(?:type\s+)?[^'"]*?from\s*(['"])([^'"]+)\1/g,
    /\brequire\s*\(\s*(['"])([^'"]+)\1\s*\)/g,
    /\bdynamicImport\s*\(\s*(['"])([^'"]+)\1\s*\)/g,
    /\bawait\s+import\s*\(\s*(['"])([^'"]+)\1\s*\)/g,
    /\bimport\s*\(\s*(['"])([^'"]+)\1\s*\)/g,
  ];
  for (const re of patterns) {
    for (const m of code.matchAll(re)) {
      const spec = m[2];
      if (spec.startsWith('.')) specs.push(resolve(fileDir, spec));
      else if (spec.startsWith('@kita/')) {
        const rest = spec.slice('@kita/'.length);
        const seg = rest.split('/');
        const pkgDir = join(ROOT, 'packages', seg[0]);
        if (!existsSync(pkgDir)) {
          const appDir = join(ROOT, 'apps', seg[0]);
          if (existsSync(appDir)) specs.push(...entryCandidates(appDir, seg.slice(1)));
        } else {
          specs.push(...entryCandidates(pkgDir, seg.slice(1)));
        }
      }
    }
  }
  return specs;
}

function entryCandidates(pkgDir: string, subpathSegments: string[]): string[] {
  const out = [];
  if (subpathSegments.length > 0) {
    out.push(join(pkgDir, ...subpathSegments));
    return out;
  }
  const pkgJson = join(pkgDir, 'package.json');
  if (existsSync(pkgJson)) {
    try {
      const j = readJson(pkgJson);
      for (const field of ['main', 'module', 'exports']) {
        const v = j[field];
        if (typeof v === 'string') out.push(join(pkgDir, v));
        else if (v && typeof v === 'object') {
          for (const e of Object.values(v)) {
            if (typeof e === 'string') out.push(join(pkgDir, e));
            else if (e && typeof e === 'object') {
              for (const ee of Object.values(e)) if (typeof ee === 'string') out.push(join(pkgDir, ee));
            }
          }
        }
      }
    } catch {
      /* unparseable package.json — fall through to index candidates */
    }
  }
  out.push(join(pkgDir, 'index'), join(pkgDir, 'src/index'));
  return out;
}

function resolveModule(base: string): string | null {
  const tries = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.mjs`, `${base}.cjs`,
    join(base, 'index.ts'), join(base, 'index.tsx'), join(base, 'index.js')];
  for (const t of tries) {
    if (existsSync(t) && statSync(t).isFile()) return t;
  }
  return null;
}

function collectReachableFiles(): { files: string[]; roots: string[] } {
  const roots = [];
  for (const kind of ['packages', 'apps']) {
    const dir = join(ROOT, kind);
    if (!existsSync(dir)) continue;
    for (const entry of readdirSync(dir)) {
      const pkgDir = join(dir, entry);
      if (!statSync(pkgDir).isDirectory()) continue;
      for (const cand of entryCandidates(pkgDir, [])) {
        const f = resolveModule(cand);
        if (f) roots.push(f);
      }
    }
  }
  const seen = new Set();
  const queue = [...roots];
  while (queue.length > 0) {
    const file = queue.shift();
    if (file === undefined || seen.has(file)) continue;
    seen.add(file);
    const rel = relative(ROOT, file).split(sep).join('/');
    if (isTestPath(rel)) continue; // do not expand test-only modules
    let code;
    try {
      code = blankNonCode(readFileSync(file, 'utf8'));
    } catch {
      continue;
    }
    for (const spec of extractLocalImports(code, dirname(file))) {
      const f = resolveModule(spec);
      if (f && !seen.has(f)) queue.push(f);
    }
  }
  return { files: [...seen], roots };
}

// ---------------------------------------------------------------------------
// verifyMigration — pure comparison over the two documents (check 1).
// ---------------------------------------------------------------------------

function verifyMigration(inventory: SourceInventoryRow[], dispositions: DispositionRow[]): MigrationReport {
  const findings = [];
  const invPaths = inventory.map((r) => r.path);
  const manPaths = dispositions.map((r) => r.path);
  const invSet = new Set(invPaths);
  const manSet = new Set(manPaths);
  for (const p of invPaths) if (!manSet.has(p)) findings.push(`missing from manifest: ${p}`);
  for (const p of manPaths) if (!invSet.has(p)) findings.push(`extra in manifest (not in inventory): ${p}`);
  for (const label of [['inventory', invPaths], ['manifest', manPaths]]) {
    const seen = new Set();
    for (const p of label[1]) {
      if (seen.has(p)) findings.push(`duplicate path in ${label[0]}: ${p}`);
      seen.add(p);
    }
  }
  const invByPath = new Map(inventory.map((r) => [r.path, r]));
  for (const row of dispositions) {
    if (!ALLOWED_DISPOSITIONS.has(row.disposition)) {
      findings.push(`${row.path}: invalid disposition ${JSON.stringify(row.disposition)}`);
    }
    const src = invByPath.get(row.path);
    if (src && row.sha256 !== undefined && row.sha256 !== src.sha256) {
      findings.push(`${row.path}: sha256 disagrees with frozen inventory`);
    }
  }
  return { ok: findings.length === 0, findings, inventoried: invPaths.length, dispositioned: manPaths.length };
}

// ---------------------------------------------------------------------------

const failures = [];

// Check 1 — coverage.
if (!existsSync(INVENTORY_PATH)) failures.push(`inventory not found: ${relative(REPO, INVENTORY_PATH)}`);
if (!existsSync(MANIFEST_PATH)) failures.push(`manifest not found: docs/migration/disposition-manifest.json`);
if (failures.length === 0) {
  const inventory = readJson(INVENTORY_PATH);
  const manifest = readJson(MANIFEST_PATH);
  const rows = Array.isArray(manifest) ? manifest : manifest.files;
  if (!Array.isArray(rows)) failures.push('manifest has no `files` array');
  else {
    const report = verifyMigration(inventory, rows);
    if (!report.ok) failures.push(...report.findings);
    const pinned = manifest.source_of_truth?.inventory_sha256;
    if (typeof pinned === 'string') {
      const actual = createHash('sha256').update(readFileSync(INVENTORY_PATH)).digest('hex');
      if (actual !== pinned) failures.push(`manifest inventory_sha256 stale: pinned ${pinned}, disk ${actual}`);
    }
  }
}

// Check 2 — archive preservation (never delete docs/kita-sources).
if (!existsSync(ARCHIVE_ROOT)) {
  failures.push(`read-only archive missing entirely: docs/kita-sources/kimi-archive/app`);
} else if (existsSync(INVENTORY_PATH)) {
  const inventory = readJson(INVENTORY_PATH);
  for (const row of inventory) {
    if (!existsSync(join(ARCHIVE_ROOT, row.path))) {
      failures.push(`archive file deleted (forbidden — "remove" means omit from target, never delete docs/kita-sources): ${row.path}`);
    }
  }
}

// Check 3 — addSandboxFunds must not be a production export.
const { files: reachable, roots } = collectReachableFiles();
for (const file of reachable) {
  const rel = relative(ROOT, file).split(sep).join('/');
  if (isTestPath(rel)) continue;
  const rawLines = readFileSync(file, 'utf8').split('\n');
  const codeLines = blankNonCode(rawLines.join('\n')).split('\n');
  for (let i = 0; i < codeLines.length; i += 1) {
    const code = codeLines[i] ?? '';
    const raw = rawLines[i] ?? '';
    if (!new RegExp(`(?<![A-Za-z0-9_])${FORBIDDEN_EXPORT}(?![A-Za-z0-9_])`).test(code)) continue;
    if (lineIsDenial(code)) continue; // ban-asserting denial row stays legal
    const exported = EXPORT_PATTERNS.some((re) => re.test(code)) || STAR_EXPORT_OF_NAME.test(code);
    const defined = PROCEDURE_DEF.test(code) || METHOD_DEF.test(code);
    if (exported || defined) {
      failures.push(`${rel}:${i + 1}: ${FORBIDDEN_EXPORT} is ${exported ? 'EXPORTED' : 'DEFINED'} in production-reachable source: ${raw.trim().slice(0, 160)}`);
    }
  }
}

if (failures.length > 0) {
  console.error('MIGRATION INVENTORY CHECK FAILED:');
  for (const f of failures) console.error('  ' + f);
  console.error('\nRegisters: docs/kita-plan/03-migration-map.md, docs/FORBIDDEN-PATHS.md (F-01), docs/sandbox-history.md.');
  console.error('Batch 1 carries NO real money and NO money posting; docs/kita-sources is read-only evidence.');
  process.exit(1);
}
console.log(`OK: migration inventory complete and archive intact; ${FORBIDDEN_EXPORT} is exported by none of the ${reachable.length} production-reachable modules (${roots.length} entrypoints scanned). No money posted.`);
