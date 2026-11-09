#!/usr/bin/env node
/**
 * Kita CI fail-closed guard: prohibited_runtime_reference_count (T-MIG-01 metric,
 * docs/kita-plan/13-backlog.md; batch-1 constraint in docs/kita-plan/SOL-REVIEW.md).
 *
 * Scans every source file under apps/kita for the forbidden outcome-manufacturing
 * identifiers registered in <repo-root>/docs/FORBIDDEN-PRODUCTION-ENDPOINTS.md and
 * apps/kita/docs/FORBIDDEN-PATHS.md:
 *
 *   - addSandboxFunds              (F-01: mints wallet balance with no evidence)
 *   - simulatePartnerCompletion    (F-02: customer forges the partner attestation)
 *   - mark_paid_out / markPaidOut  (F-03: admin manufactures a payout state)
 *
 * Legal occurrences (ban-naming only — none of these CALL, DEFINE, IMPORT, or
 * DISPATCH the identifier):
 *   - inside comments (line or block),
 *   - inside quoted strings or regex literals on any line,
 *   - as object-literal keys whose value explicitly denies the action
 *     (e.g. { action: 'mark_paid_out', allowed: false } in admin projections).
 * Anything else — an unquoted token, a call/member expression, an import
 * specifier, a route/procedure definition — fails this guard (exit 1).
 *
 * This script is self-exempt by filename so the list stays nameable.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const SELF = "scripts/guard-no-outcome-manufacturing.mjs";

const IDENTIFIERS = ["addSandboxFunds", "simulatePartnerCompletion", "mark_paid_out", "markPaidOut"];
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const SKIP_DIRS = new Set(["node_modules", "dist", "build", ".next", ".turbo", "coverage"]);

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry) || entry === ".git") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (SOURCE_EXTENSIONS.has(entry.slice(entry.lastIndexOf(".")))) yield full;
  }
}

/** Replace comment spans, string literals, template literals and regex literal bodies with spaces. */
function blankNonCode(source) {
  let out = "";
  let i = 0;
  /** true when a `/` at i would start a regex (vs division): previous meaningful char allows it. */
  const regexAllowed = () => /(?:^|[=(,:[!&|?{};+*/%<>^~\n])\s*$/.test(out);
  while (i < source.length) {
    const c = source[i];
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
    } else if (c === '"' || c === "'" || c === "`") {
      let j = i + 1;
      while (j < source.length) {
        if (source[j] === "\\") { j += 2; continue; }
        if (source[j] === c) { j += 1; break; }
        j += 1;
      }
      // Keep both delimiters, blank the literal body (newlines preserved).
      out += c + source.slice(i + 1, j - 1).replace(/[^\n]/g, " ") + c;
      i = j;
    } else if (c === "/" && regexAllowed()) {
      let j = i + 1;
      let inClass = false;
      while (j < source.length) {
        const d = source[j];
        if (d === "\\") { j += 2; continue; }
        if (d === "[") inClass = true;
        else if (d === "]") inClass = false;
        else if (d === "/" && !inClass) { j += 1; break; }
        else if (d === "\n") break; // unterminated — treat as division
        j += 1;
      }
      if (source[j - 1] === "/") {
        while (j < source.length && /[a-z]/.test(source[j])) j += 1; // flags
        out += "/" + " ".repeat(j - i - 1);
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

/**
 * Deny-shaped object key: `IDENTIFIER` appears only as a property key whose
 * surrounding object literal asserts allowed:false / allowed: false nearby.
 * Conservative: we allow an unquoted/dotted occurrence ONLY on a line that also
 * contains `allowed: false` or `CAPABILITY_UNAVAILABLE`.
 */
function lineIsDenial(line) {
  return /allowed:\s*false/.test(line) || /CAPABILITY_UNAVAILABLE/.test(line);
}

const findings = [];
for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file).split(sep).join("/");
  if (rel === SELF) continue;
  const rawLines = readFileSync(file, "utf8").split("\n");
  const codeLines = blankNonCode(rawLines.join("\n")).split("\n");
  for (let i = 0; i < codeLines.length; i += 1) {
    const code = codeLines[i] ?? "";
    const raw = rawLines[i] ?? "";
    for (const id of IDENTIFIERS) {
      const re = new RegExp(`(?<![A-Za-z0-9_])${id}(?![A-Za-z0-9_])`);
      if (!re.test(code)) continue;
      // Allow ban-asserting denial rows (admin projection denylists).
      if (lineIsDenial(code)) continue;
      findings.push(`${rel}:${i + 1}: [${id}] ${raw.trim().slice(0, 160)}`);
    }
  }
}

if (findings.length > 0) {
  console.error("FORBIDDEN outcome-manufacturing reference(s) found outside ban-naming:");
  for (const f of findings) console.error("  " + f);
  console.error("\nRegister: docs/FORBIDDEN-PRODUCTION-ENDPOINTS.md (root) and apps/kita/docs/FORBIDDEN-PATHS.md.");
  console.error("Batch 1 carries NO real money, NO fake KYC, NO outcome manufacturing.");
  process.exit(1);
}
console.log(`OK: ${IDENTIFIERS.join(" / ")} occur nowhere in executable position (comments, quoted ban lists, and denial rows only).`);
