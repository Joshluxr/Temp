#!/usr/bin/env node
/*
 * apps/kita/database/src/smoke.mjs — T-PLAT-02 executable-isolation smoke runner.
 *
 * Runs docs/kita-plan/sql/002_core_smoke.sql (copied verbatim by coder-07 to
 * apps/kita/sql/002_core_smoke.sql) against an ISOLATED ephemeral test database
 * and prints PASS/FAIL plus the SQL RAISE NOTICE / EXCEPTION messages.
 *
 * Safety posture (fail-closed):
 *   - DATABASE_URL must target kita_core_test on 127.0.0.1:54339 exactly.
 *     Anything else (production, other hosts, other ports, other databases)
 *     aborts before a single byte is sent. This fixture creates ledger rows;
 *     it must NEVER run outside the throwaway cluster provisioned by
 *     apps/kita/database/scripts/provision-cluster.sh.
 *   - The 002 fixture is self-contained: it wraps everything in BEGIN ... ROLLBACK,
 *     so even inside the test DB it leaves no residue. It assumes 001_core.sql
 *     has already been applied (see apps/kita/database/src/migrate.mjs, owned
 *     by coder-07; or `psql -f 001_core.sql` against the same cluster).
 *
 * Usage:
 *   DATABASE_URL=postgres://kita_test@127.0.0.1:54339/kita_core_test node apps/kita/database/src/smoke.mjs
 *
 * Exit codes: 0 = PASS, 1 = FAIL (SQL assertion/error), 2 = configuration refused,
 *             3 = SKIP (pg driver not installed — environment, not a test failure).
 *
 * Related files owned by others (do not create here): migrate.mjs, test-runner.mjs,
 * test/, package.json under apps/kita/database/.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 002 smoke SQL lives at apps/kita/sql/002_core_smoke.sql (verbatim copy of
// docs/kita-plan/sql/002_core_smoke.sql, placed there by coder-07). Resolve
// relative to this file so the script works from any CWD:
// apps/kita/database/src -> ../../sql/002_core_smoke.sql
const SQL_PATH = path.resolve(__dirname, "..", "..", "sql", "002_core_smoke.sql");

function die(msg, code) {
  console.error(`smoke: ${msg}`);
  process.exit(code);
}

// --- 1. Fail-closed DATABASE_URL validation ---------------------------------
// Allowed shape ONLY: user kita_test, host 127.0.0.1, port 54339, db kita_core_test.
// No password requirement (trust-auth local socket-style cluster), but one is tolerated.
const url = process.env.DATABASE_URL;
if (!url) {
  die(
    "DATABASE_URL is required.\n" +
      "  Set it to the isolated test cluster, e.g.:\n" +
      "  export DATABASE_URL=postgres://kita_test@127.0.0.1:54339/kita_core_test\n" +
      "  Provision the ephemeral cluster with: apps/kita/database/scripts/provision-cluster.sh up",
    2,
  );
}

let parsed;
try {
  parsed = new URL(url);
} catch {
  die(`DATABASE_URL is not a valid URL — refusing to run (fail-closed).`, 2);
}

const proto = parsed.protocol.replace(/:$/, "");
if (proto !== "postgres" && proto !== "postgresql") {
  die(`DATABASE_URL scheme must be postgres/postgresql, got "${parsed.protocol}" — refusing.`, 2);
}
if (parsed.hostname !== "127.0.0.1") {
  die(
    `DATABASE_URL host must be 127.0.0.1 (isolated loopback test cluster only), ` +
      `got "${parsed.hostname}" — refusing (fail-closed).`,
    2,
  );
}
// Explicit port required: default 5432 is the conventional system-service port,
// which this smoke run must never reach.
if (parsed.port !== "54339") {
  die(
    `DATABASE_URL port must be 54339 (the Kita isolated-test convention), ` +
      `got "${parsed.port || "(default 5432)"}" — refusing (fail-closed). Never point this at production.`,
    2,
  );
}
const dbName = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
if (dbName !== "kita_core_test") {
  die(
    `DATABASE_URL database must be kita_core_test, got "${dbName || "(none)"}" — ` +
      `refusing (fail-closed). This smoke fixture must never run against a real book.`,
    2,
  );
}
// Belt-and-suspenders: reject obvious production-ish role names even though the
// host/port/db checks above already gate access; the test cluster's login role is kita_test.
if (parsed.username && parsed.username !== "kita_test") {
  die(
    `DATABASE_URL user should be kita_test (isolated test login role), got ` +
      `"${parsed.username}" — refusing (fail-closed).`,
    2,
  );
}

// --- 2. Load pg; degrade gracefully if not installed -------------------------
let Client;
try {
  ({ Client } = await import("pg"));
} catch (err) {
  if (err && (err.code === "ERR_MODULE_NOT_FOUND" || err.code === "MODULE_NOT_FOUND")) {
    console.log("SKIP: the 'pg' driver is not installed, so the smoke SQL could not run.");
    console.log("  This is an environment gap, not a test failure.");
    console.log("  Install it (adds to apps/kita/database deps — coordinate with package.json owner, coder-07):");
    console.log("    cd apps/kita/database && npm install pg        # npm");
    console.log("    cd apps/kita/database && pnpm add pg           # pnpm (monorepo convention per T-PLAT-01)");
    console.log("  Then re-run:");
    console.log("    DATABASE_URL=postgres://kita_test@127.0.0.1:54339/kita_core_test \\");
    console.log("      node apps/kita/database/src/smoke.mjs");
    process.exit(3);
  }
  throw err;
}

// --- 3. Read the smoke SQL ----------------------------------------------------
// The 002 file uses psql meta-commands (\set ON_ERROR_STOP on) that the libpq
// client itself does not understand; strip lines starting with '\' (they are
// psql-only and their intent — stop on error — is exactly how we drive the run).
// The rest (BEGIN; DO $$ ... $$; ROLLBACK;) executes as one simple query batch.
let sql;
try {
  const raw = readFileSync(SQL_PATH, "utf8");
  sql = raw
    .split(/\r?\n/)
    .filter((line) => !/^\\/.test(line))
    .join("\n");
  if (!/\bpost_journal\b/.test(sql)) {
    die(`loaded SQL from ${SQL_PATH} but it does not look like 002_core_smoke.sql — refusing.`, 2);
  }
} catch (err) {
  die(
    `cannot read smoke SQL at ${SQL_PATH}: ${err.message}\n` +
      `  Expected coder-07's verbatim copy of docs/kita-plan/sql/002_core_smoke.sql.`,
    2,
  );
}

// --- 4. Run it -----------------------------------------------------------------
const client = new Client({ connectionString: url, application_name: "kita-core-smoke" });
let failed = false;
try {
  await client.connect();
} catch (err) {
  die(
    `cannot connect to the isolated test cluster (${parsed.host}/${dbName}): ${err.message}\n` +
      `  Start it first: apps/kita/database/scripts/provision-cluster.sh up`,
    1,
  );
}

try {
  // pg emits Notice messages (the fixture's RAISE NOTICE lines) onto client's
  // 'notice' event; capture them for display.
  client.on("notice", (n) => console.log(`NOTICE: ${n.message ?? n}`));
  client.on("notification", (n) => console.log(`NOTIFY: ${n.payload ?? n.message ?? ""}`));
  await client.query(sql);
  console.log("PASS: 002_core_smoke.sql completed with every RAISE EXCEPTION guard satisfied.");
  console.log("  (Fixture data was rolled back by the SQL itself; the test DB is clean.)");
} catch (err) {
  failed = true;
  console.error(`FAIL: smoke SQL aborted: ${err.message}`);
  if (err.routine || err.where) {
    console.error(`  [pg ${err.code ?? "?"}] ${err.routine ?? ""} ${err.where ?? ""}`.trimEnd());
  }
} finally {
  try {
    await client.end();
  } catch {
    /* teardown best-effort */
  }
}

process.exit(failed ? 1 : 0);
