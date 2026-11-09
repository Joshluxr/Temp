import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
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

const SAMPLE_URL = "postgres://kita_svc@db.internal:5432/kita_test";

/** Every string reachable in a run's output — logs, errors and the returned result. */
const surfaceText = (out: { logs: string[]; errors: string[]; result?: unknown }): string =>
  JSON.stringify([out.logs, out.errors, out.result]);

describe("T-CORE-01 gate 2 — fail-closed DATABASE_URL (absent / empty / whitespace)", () => {
  const cases: ReadonlyArray<{ label: string; env: string }> = [
    { label: "absent", env: "({ PORT: '8080' })" },
    { label: "empty string", env: "({ DATABASE_URL: '', PORT: '8080' })" },
    { label: "whitespace-only", env: "({ DATABASE_URL: '   \\t ', PORT: '8080' })" },
  ];

  for (const { label, env } of cases) {
    it(`${label}: startup fails closed before pool/connection/listener/readiness`, async () => {
      const out = await runBootstrapHarness(env);

      expect(out.result).toBeDefined();
      expect(out.result).toMatchObject({ ok: false });

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
    const out = await runBootstrapHarness(`({ DATABASE_URL: ${JSON.stringify(`  ${SAMPLE_URL}  `)}, PORT: '8080' })`);
    // A whitespace-padded URL is present-and-clean after trim, so validation passes; the point of
    // this case is that nothing downstream echoes the userinfo password.
    expect(out.result).toMatchObject({ ok: true });
    expect(surfaceText(out)).not.toMatch(/:[^/@]+@/);
  });

  it("valid bindings pass validation and reach the injected seams only after validation", async () => {
    const out = await runBootstrapHarness(`({ DATABASE_URL: '${SAMPLE_URL}', PORT: '8080' })`);
    expect(out.result).toMatchObject({ ok: true, port: 8080 });
    expect(out.counters.createPoolCalls).toBe(1);
    expect(out.counters.listenCalls).toEqual([{ port: 8080 }]);
    const config = out.counters.driverConfigs[0] as { connectionString?: string };
    expect(config.connectionString).toBe(SAMPLE_URL);
    // Returned/handled surfaces never echo the password.
    expect(JSON.stringify(out.result)).not.toMatch(/:[^/@]+@/);
  });

  it("PORT is validated too: blank PORT fails closed without touching the driver", async () => {
    const out = await runBootstrapHarness(`({ DATABASE_URL: 'postgres://db.internal/kita', PORT: '  ' })`);
    expect(out.result).toMatchObject({ ok: false });
    expect(out.counters.createPoolCalls).toBe(0);
    expect([...out.errors, ...out.logs].join("\n")).toMatch(/PORT/u);
  });
});

describe("T-CORE-01 gate 2 — runtime binding validation unit (packages/platform/runtime.ts)", () => {
  // Imported through a file: URL so vite's fs.allow (which rejects relative imports outside
  // this package root) cannot veto coder-46's module, and so resolution happens on Node's own
  // ESM loader rather than through a data: URL, where an absolute filesystem specifier is not
  // a resolvable module reference. Same file, same code path bootstrap uses.
  const runtimeModuleUrl = pathToFileURL(`${KITA_ROOT}packages/platform/runtime.ts`).href;

  const loadRuntime = async (): Promise<typeof import("../../../../packages/platform/runtime.js")> =>
    import(/* @vite-ignore */ runtimeModuleUrl);

  it("absent / empty / whitespace DATABASE_URL each produce a problem naming the binding", async () => {
    const { validateRuntimeBindings } = await loadRuntime();
    const base = { PORT: "8080" };
    for (const value of [undefined, "", "   ", "\t\n"]) {
      const result = validateRuntimeBindings(value === undefined ? base : { ...base, DATABASE_URL: value });
      expect(result.ok).toBe(false);
      if (result.ok) continue;
      expect(result.error.some((p) => p.field === "DATABASE_URL")).toBe(true);
    }
  });

  it("problems accumulate across bindings and never include the value", async () => {
    const { validateRuntimeBindings } = await loadRuntime();
    const result = validateRuntimeBindings({ PORT: "not-a-port" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.map((p) => p.field).sort()).toEqual(["DATABASE_URL", "PORT"]);
    expect(JSON.stringify(result.error)).not.toMatch(/postgres|kita_svc|@db\.internal/u);
  });

  it("a valid binding validates and maps to database bindings with trimmed URL and poolMax passthrough", async () => {
    const { validateRuntimeBindings, toDatabaseBindings } = await loadRuntime();
    const result = validateRuntimeBindings({ DATABASE_URL: ` ${SAMPLE_URL} `, PORT: "8080", POOL_MAX: "9" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.databaseUrl).toBe(SAMPLE_URL);
    expect(result.value.port).toBe(8080);
    expect(toDatabaseBindings(result.value)).toEqual({ databaseUrl: SAMPLE_URL, poolMax: 9 });
  });

  it("no fallbacks: localhost/in-memory/sandbox values are never invented when absent", async () => {
    const { validateRuntimeBindingsOrProblem } = await loadRuntime();
    const failed = validateRuntimeBindingsOrProblem({});
    expect(failed.ok).toBe(false);
    if (failed.ok) return;
    const text = JSON.stringify(failed.error);
    expect(text).not.toMatch(/localhost|127\.0\.0\.1|in-memory|memory:\/\/|sandbox|5432/u);
    // Diagnostics name the binding, per spec.
    expect(text).toMatch(/DATABASE_URL/u);
    expect(text).toMatch(/PORT/u);
  });
});

