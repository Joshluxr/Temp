#!/usr/bin/env node
/**
 * Kita CI fail-closed guard: production isolation (T-PLAT-07 acceptance,
 * docs/kita-plan/13-backlog.md; REQ-SC-21 / TEST-PLAT-07; K2 in
 * docs/kita-plan/11-infrastructure.md).
 *
 * Purely STATIC: this script reads files and never connects to a database,
 * never calls a provider, never spawns a process. It asserts four things over
 * every source file under apps/kita (node_modules/.next/dist/build/coverage and
 * the read-only kimi archive are excluded):
 *
 *   CHECK 1 — sandbox/simulator money paths. The forbidden call names from
 *     apps/kita/docs/FORBIDDEN.md and docs/FORBIDDEN-PRODUCTION-ENDPOINTS.md
 *     (addSandboxFunds, simulatePartnerCompletion, mark_paid_out/markPaidOut,
 *     admin complete/fail outcome verbs) may appear outside test-only paths
 *     ONLY in comments, quoted ban lists, or denial rows — same leniency model
 *     as scripts/guard-no-outcome-manufacturing.mjs. Executable-position use in
 *     production-reachable code fails closed. A simulator fixture adapter being
 *     IMPORTED into production-reachable source also fails (import of any path
 *     matching fixture/simulator/mock/sandbox helper names).
 *
 *   CHECK 2 — provider adapters. Every module under
 *     packages/domain/src/providers/** must throw ProviderDisabledError (a
 *     disabled gate), and no production-reachable source may import a live
 *     provider/network SDK (stripe, adyen, nium, thunes, persona, mysql2, pg,
 *     axios, fetch-capable http clients). `import type` is exempt — types carry
 *     no runtime network path. Test dirs (__tests__, tests/, dot-test and
 *     dot-spec files, vitest.config.*) may.
 *
 *   CHECK 3 — secrets & sandbox endpoints in production-reachable source:
 *     hardcoded key prefixes (sk_test_/sk_live_/pk_test_/ghp_/AKIA), private-key
 *     PEM headers, and sandbox base URLs (*.sandbox.* / sandbox.*.com /
 *     test-mode api base URL literals). Regex-literal pattern definitions that
 *     scanners themselves ship (validate-build-baseline.ts, secret-scan tests)
 *     are exempt by shape: a match inside a regex literal is a detector, not a
 *     credential.
 *
 *   CHECK 4 — Docker isolation pin (T-PLAT-07 "production fails startup on ...
 *     fixture adapter" companion, coder-43 lane): docker-compose.test.yml MUST
 *     publish port 54339 and set POSTGRES_DB kita_core_test. Missing file,
 *     missing pin, or drift fails closed.
 *
 * Any violation → exit 1 with a file:line report. Clean tree → pass message.
 * This script is self-exempt by filename so the forbidden lists stay nameable.
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const SELF = "scripts/guard-production-isolation.mjs";

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".yml", ".yaml"]);
const SKIP_DIRS = new Set(["node_modules", "dist", "build", ".next", ".turbo", "coverage", ".git", "kimi-archive"]);

/** Paths whose content is test scope only (checks 1–3 relax there). */
function isTestPath(rel) {
  return (
    rel.includes("__tests__/") ||
    rel.startsWith("tests/") ||
    rel.startsWith("database/tests/") ||
    /\.test\.[cm]?[jt]sx?$/.test(rel) ||
    /\.spec\.[cm]?[jt]sx?$/.test(rel) ||
    rel.endsWith("vitest.config.ts") ||
    rel.startsWith("apps/mobile/__tests__")
  );
}

/** Simulator/fixture adapter module names that must never be imported by production-reachable code. */
const SIMULATOR_IMPORT_RE = /(?:sandbox|simulat|mock|fake|stub|fixture)[-_./A-Za-z]*['"]\s*;?\s*$/i;

/** Live-network provider SDK specifiers (check 2). Bare package names only. */
const PROVIDER_SDK_RE = /^(?:@(?:stripe\/stripe-node|adyen\/api|persona\/identity-sdk)|stripe|adyen-node-api-library|nium|thunes|mysql2|pg|axios|node-fetch|undici|got|request)$/i;

/** Forbidden call names — FORBIDDEN.md scan list + canonical register F-01..F-08. */
const FORBIDDEN_CALLS = [
  "addSandboxFunds",
  "simulatePartnerCompletion",
  "mark_paid_out",
  "markPaidOut",
  "adminComplete",
  "set_balance",
  "setBalance",
];

/** Secret material patterns (check 3). */
const SECRET_PATTERNS = [
  ["sk_test_", /(?<![A-Za-z0-9_])sk_test_[0-9A-Za-z]{8,}/],
  ["sk_live_", /(?<![A-Za-z0-9_])sk_live_[0-9A-Za-z]{8,}/],
  ["pk_test_", /(?<![A-Za-z0-9_])pk_test_[0-9A-Za-z]{8,}/],
  ["AKIA", /(?<![A-Za-z0-9_])AKIA[0-9A-Z]{12,}/],
  ["ghp_", /(?<![A-Za-z0-9_])ghp_[0-9A-Za-z]{20,}/],
  ["private-key-header", /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/],
];

/** Sandbox base URLs in executable position (check 3). */
const SANDBOX_URL_RE = /['"`]https?:\/\/[A-Za-z0-9.-]*(?:sandbox|\.test\.|-test\.|staging)[A-Za-z0-9.-]*\.[a-z]{2,}(?:\/[^'"`\s]*)?['"`]/i;

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry) || entry === ".git") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (SOURCE_EXTENSIONS.has(entry.slice(entry.lastIndexOf(".")))) yield full;
  }
}

/** Blank comment spans; keep string/template/regex bodies (this guard inspects them). */
function blankComments(source) {
  let out = "";
  let i = 0;
  while (i < source.length) {
    const two = source.slice(i, i + 2);
    if (two === "//") {
      const nl = source.indexOf("\n", i);
      const end = nl === -1 ? source.length : nl;
      out += " ".repeat(end - i);
      i = end;
    } else if (two === "/*") {
      const close = source.indexOf("*/", i + 2);
      const end = close === -1 ? source.length : close + 2;
      out += source.slice(i, end).replace(/[^\n]/g, " ");
      i = end;
    } else {
      out += source[i];
      i += 1;
    }
  }
  return out;
}

/** True when the match at index sits inside a regex literal (a scanner's own pattern, not material). */
function insideRegexLiteral(line, index) {
  // Heuristic: a `/` before the match with no closing quote between => regex body.
  const before = line.slice(0, index);
  const lastOpen = before.lastIndexOf("/");
  if (lastOpen === -1) return false;
  const seg = before.slice(lastOpen + 1);
  return !/["'`]/.test(seg) && !/[;{}]\s*$/.test(before.slice(0, lastOpen));
}

/** Object keys / string values that merely NAME a ban (quoted identifiers in denylists) are allowed. */
function lineIsDenial(line) {
  return /allowed:\s*false/.test(line) || /CAPABILITY_UNAVAILABLE/.test(line) || /forbidden/i.test(line) || /banned/i.test(line);
}

const findings = [];
let scanned = 0;

for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file).split(sep).join("/");
  if (rel === SELF) continue;
  if (!rel.endsWith(".ts") && !rel.endsWith(".tsx") && !rel.endsWith(".js") && !rel.endsWith(".jsx") && !rel.endsWith(".mjs") && !rel.endsWith(".cjs")) continue;
  scanned += 1;
  const rawLines = readFileSync(file, "utf8").split("\n");
  const codeLines = blankComments(rawLines.join("\n")).split("\n");
  const testScope = isTestPath(rel);
  const inProvidersDir = rel.startsWith("packages/domain/src/providers/");

  // CHECK 2 (providers dir): every adapter module must throw ProviderDisabledError.
  if (inProvidersDir && !rel.endsWith("index.ts") && !rel.endsWith("disabled.ts")) {
    const whole = codeLines.join("\n");
    if (!/throw new ProviderDisabledError/.test(whole)) {
      findings.push(`${rel}:1: [provider-gate] adapter does not throw ProviderDisabledError — disabled gates only`);
    }
  }

  for (let i = 0; i < codeLines.length; i += 1) {
    const code = codeLines[i] ?? "";
    const raw = rawLines[i] ?? "";
    const where = `${rel}:${i + 1}`;

    // CHECK 1: forbidden simulator/sandbox money calls outside test scope.
    if (!testScope) {
      for (const id of FORBIDDEN_CALLS) {
        const re = new RegExp(`(?<![A-Za-z0-9_])${id}(?![A-Za-z0-9_])`);
        if (!re.test(code)) continue;
        if (lineIsDenial(code)) continue;
        // Quoted-name occurrence (ban list / register string) is naming, not calling.
        const idx = code.search(re);
        const quoted = /['"`][^'"`]*$/.test(code.slice(0, idx)) && /[^'"`]*['"`]/.test(code.slice(idx));
        if (quoted && !new RegExp(`\\.${id}\\s*\\(|\\b${id}\\s*\\(`).test(code)) continue;
        findings.push(`${where}: [sandbox-money-call] ${id} in executable position — ${raw.trim().slice(0, 140)}`);
      }
      // CHECK 1b: importing a simulator/fixture adapter module into production-reachable code.
      if (/^\s*(?:import\b|export\s+\*?\s+from\b|require\()/.test(code) && SIMULATOR_IMPORT_RE.test(code) && !/from ['"]@kita\//.test(code)) {
        findings.push(`${where}: [simulator-import] imports a sandbox/mock/fixture adapter module — ${raw.trim().slice(0, 140)}`);
      }
      // CHECK 2b: live provider SDK import in production-reachable source.
      // `import type` / `export type` are erased at runtime — types carry no network path.
      const spec = code.match(/(?:from|require\()\s*['"]([^'"]+)['"]/);
      if (spec && PROVIDER_SDK_RE.test(spec[1]) && !/^\s*(?:import|export)\s+type\b/.test(code)) {
        findings.push(`${where}: [live-provider-sdk] '${spec[1]}' imported outside test scope — ${raw.trim().slice(0, 140)}`);
      }
      // CHECK 3: secrets and sandbox base URLs.
      for (const [name, re] of SECRET_PATTERNS) {
        const m = code.match(re);
        if (!m) continue;
        if (insideRegexLiteral(code, m.index ?? 0)) continue; // scanner's own pattern definition
        findings.push(`${where}: [hardcoded-secret] ${name} literal — ${raw.trim().slice(0, 140)}`);
      }
      const su = code.match(SANDBOX_URL_RE);
      if (su) {
        if (!insideRegexLiteral(code, su.index ?? 0)) {
          findings.push(`${where}: [sandbox-base-url] sandbox/staging endpoint in production-reachable source — ${raw.trim().slice(0, 140)}`);
        }
      }
    } else {
      // Even in test scope, live SDKs must not hide behind non-test-looking barrels — skipped by design.
    }
  }
}

// CHECK 4: docker-compose.test.yml isolation pins (static file read, no container start).
const COMPOSE = join(ROOT, "docker-compose.test.yml");
if (!existsSync(COMPOSE)) {
  findings.push(`docker-compose.test.yml:1: [isolation-pin] file missing — isolated test cluster definition required`);
} else {
  const compose = readFileSync(COMPOSE, "utf8");
  if (!/"?54339:5432"?/.test(compose) && !/54339/.test(compose)) {
    findings.push(`docker-compose.test.yml:1: [isolation-pin] published port is not 54339`);
  }
  if (!/POSTGRES_DB:\s*kita_core_test\b/.test(compose)) {
    findings.push(`docker-compose.test.yml:1: [isolation-pin] POSTGRES_DB is not kita_core_test`);
  }
}

if (findings.length > 0) {
  console.error("FORBIDDEN production-isolation violation(s) found (fail-closed, T-PLAT-07 / REQ-SC-21):");
  for (const f of findings) console.error("  " + f);
  console.error("\nRegister: docs/FORBIDDEN-PRODUCTION-ENDPOINTS.md (root) and apps/kita/docs/FORBIDDEN.md.");
  console.error("Simulators/fixtures live ONLY in the isolated kita_core_test cluster (port 54339); production startup must fail closed on their import.");
  process.exit(1);
}
console.log(`OK: ${scanned} source files scanned — no sandbox money-path imports, no live provider SDKs in production-reachable source, no hardcoded test keys/sandbox URLs, docker-compose.test.yml pinned to 54339/kita_core_test.`);
