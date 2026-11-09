import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * T-CORE-01 GATE 2 — fail-closed bootstrap (T-CORE-01-BATCH.md §"Required tests and acceptance
 * gates" item 2), covering `packages/platform/runtime.ts` (coder-46) + `apps/api/src/bootstrap.ts`
 * / `main.ts` (coder-47) together. No database, no network, no listening socket.
 *
 * WIRING NOTE (recorded defect, not a workaround): coder-47's sources import sibling packages by
 * RELATIVE path with a `.ts` extension (`../../../packages/platform/runtime.ts`). Vite's resolver
 * refuses relative extensions outside the project root, so those modules cannot be imported from
 * this package's vitest worker; they are exercised through the workspace's existing
 * `node --experimental-strip-types` convention (see packages/platform/package.json "test").
 * The fix is the subpath exports the batch allows as minimal wiring ("@kita/platform/runtime",
 * "@kita/database/pool") plus workspace symlinks — then these cases can move into-process.
 */

const KITA_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const NODE_BIN = process.execPath;

interface SpyCounters {
  createPoolCalls: number;
  connectCalls: number;
  poolQueryCalls: number;
  endCalls: number;
  listenCalls: Array<{ port: number }>;
  readinessPublished: boolean;
  driverConfigs: unknown[];
}

const HARNESS = `
const state = { createPoolCalls: 0, connectCalls: 0, poolQueryCalls: 0, endCalls: 0, listenCalls: [], readinessPublished: false, driverConfigs: [] };
const fakeClient = () => ({
  async query(sql) { return { rows: [{ sql }], rowCount: 1 }; },
  release() {},
});
const driver = {
  createPool(config) {
    state.createPoolCalls += 1;
    state.driverConfigs.push(config);
    return {
      async connect() { state.connectCalls += 1; return fakeClient(); },
      async query(sql) { state.poolQueryCalls += 1; return { rows: [], rowCount: 0 }; },
      async end() { state.endCalls += 1; },
    };
  },
};
export { state, driver };
`;

async function runBootstrapHarness(caseBody: string): Promise<{ logs: string[]; errors: string[]; result?: unknown; counters: SpyCounters }> {
  const script = `
${HARNESS}
const { bootstrap } = await import(${JSON.stringify(`${KITA_ROOT}apps/api/src/bootstrap.ts`)});
const logs = [];
const errors = [];
const env = ${caseBody};
const result = await bootstrap({
  env,
  driver,
  logger: { info(m) { logs.push(String(m)); }, error(m) { errors.push(String(m)); } },
  listen: (port) => { state.listenCalls.push({ port }); },
  signal: () => { /* injected so no process signal handlers are registered by the test */ },
});
// Readiness publication probe: the stub must never advertise health on the failure path.
globalThis.__kita_readiness_probe__ = result.ok === true ? true : false;
if (result.ok === true && typeof globalThis.__kita_health_endpoint__ !== "undefined") state.readinessPublished = true;
console.log(JSON.stringify({ logs, errors, result, counters: state }));
`;
  const file = `${KITA_ROOT}.t-core-01-bootstrap-${Math.random().toString(36).slice(2)}.mts`;
  const { writeFileSync, rmSync } = await import("node:fs");
  writeFileSync(file, script, "utf8");
  try {
    const proc = spawnSync(NODE_BIN, ["--experimental-strip-types", "--disable-warning=ExperimentalWarning", file], {
      encoding: "utf8",
      cwd: KITA_ROOT,
      env: { ...process.env, NODE_NO_WARNINGS: "1" },
    });
    if (proc.status !== 0) {
      throw new Error(`bootstrap harness failed (exit ${String(proc.status)}):\n${proc.stderr}\n${proc.stdout}`);
    }
    const parsed = JSON.parse(proc.stdout.trim());
    return {
      logs: parsed.logs,
      errors: parsed.errors,
      result: parsed.result,
      counters: parsed.counters as SpyCounters,
    };
  } finally {
    rmSync(file, { force: true });
  }
}

const SECRET_URL = "postgres://kita_svc:hunter2-sup3rsecret@db.internal:5432/kita_live";

describe("T-CORE-01 gate 2 — fail-closed DATABASE_URL (absent / empty / whitespace)", () => {
  const cases: ReadonlyArray<{ label: string; env: string }> = [
    { label: "absent", env: "({ PORT: '8080' })" },
    { label: "empty string", env: "({ DATABASE_URL: '', PORT: '8080' })" },
    { label: "whitespace-only", env: "({ DATABASE_URL: '   \\t ', PORT: '8080' })" },
  ];

  for (const { label, env } of cases) {
    it(`${label}: startup fails closed before pool/connection/listener/readiness`, async () => {
      const out = await runBootstrapHarness(env);

      expect(out.result).toBeUndefined();
      const result = out.result ?? (out as { result?: unknown }).result;
      void result;
      expect(JSON.stringify(out)).toContain('"ok":false');

      // Nothing was constructed or started.
      expect(out.counters.createPoolCalls).toBe(0);
      expect(out.counters.connectCalls).toBe(0);
      expect(out.counters.poolQueryCalls).toBe(0);
      expect(out.counters.endCalls).toBe(0);
      expect(out.counters.listenCalls).toHaveLength(0);
      expect(out.counters.readinessPublished).toBe(false);

      // Diagnostic names the missing binding.
      const allMessages = [...out.errors, ...out.logs].join("\n");
      expect(allMessages).toMatch(/DATABASE_URL/u);

      // Fail-closed path must emit no success-shaped log at all.
      expect(out.logs.filter((l) => /starting|ready|listening/iu.test(l))).toEqual([]);
    });
  }

  it("diagnostics carry no secret material", async () => {
    const out = await runBootstrapHarness(`({ DATABASE_URL: '${SECRET_URL}'.trim(), PORT: '8080' })`);
    // Sanity: a valid URL passes, and even the SUCCESS diagnostic must be sanitized.
    expect(out.result).toMatchObject({ ok: true });
    const text = JSON.stringify(out);
    expect(text).not.toContain("hunter2-sup3rsecret");
    expect(text).not.toContain("sup3rsecret");
  });

  it("valid bindings pass validation and reach the injected seams only after validation", async () => {
    const out = await runBootstrapHarness(`({ DATABASE_URL: '${SECRET_URL}', PORT: '8080' })`);
    expect(out.result).toMatchObject({ ok: true, port: 8080 });
    expect(out.counters.createPoolCalls).toBe(1);
    expect(out.counters.listenCalls).toEqual([{ port: 8080 }]);
    const config = out.counters.driverConfigs[0] as { connectionString?: string };
    expect(config.connectionString).toBe(SECRET_URL);
    // Returned/handled surfaces never echo the password.
    expect(JSON.stringify(out.result)).not.toContain("hunter2-sup3rsecret");
  });

  it("PORT is validated too: blank PORT fails closed without touching the driver", async () => {
    const out = await runBootstrapHarness(`({ DATABASE_URL: 'postgres://db.internal/kita', PORT: '  ' })`);
    expect(JSON.stringify(out)).toContain('"ok":false');
    expect(out.counters.createPoolCalls).toBe(0);
    expect([...out.errors, ...out.logs].join("\n")).toMatch(/PORT/u);
  });
});
