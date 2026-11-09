/**
 * @kita/platform — runtime binding validation (T-CORE-01, coder-46).
 *
 * Objective: the API bootstrap starts only with explicitly validated runtime
 * bindings. Fail closed naming the missing/invalid binding; NEVER fabricate a
 * development, localhost, in-memory, sandbox, or test fallback (§T-CORE-01
 * "Runtime bindings and API stub"). Diagnostics are log-safe: they carry the
 * binding NAME only, never its value (credentials live inside DATABASE_URL).
 * Pure validation — no pool construction, no listener, no import-time effects.
 */

import type { Problem, Result } from '@kita/contracts';
import { err, ok, problem } from '@kita/contracts';

/** The complete accepted env set for the minimal API bootstrap stub. Anything else is ignored, not consulted as a fallback. */
export const RUNTIME_BINDING_NAMES = ['DATABASE_URL', 'PORT', 'POOL_MAX'] as const;

export type RuntimeBindingName = (typeof RUNTIME_BINDING_NAMES)[number];

/** Validated, trimmed bindings. `databaseUrl` keeps its raw (secret-bearing) form for the driver — never log it. */
export interface RuntimeBindings {
  readonly databaseUrl: string;
  readonly port: number;
  /** Optional; absent means the driver default applies downstream (we fabricate no number here). */
  readonly poolMax?: number;
}

/** Structural mirror of coder-44's DatabaseBindings (packages/database/src/pool.ts) — no cross-package dep. */
export interface DatabaseBindingsShape {
  readonly databaseUrl: string;
  readonly poolMax?: number;
}

/**
 * One per rejected binding. `name` identifies the binding; `reason` describes
 * the SHAPE of the failure without echoing the value (a URL may contain
 * user:password).
 */
export interface BindingProblem {
  readonly name: RuntimeBindingName;
  readonly reason:
    | 'missing'
    | 'empty'
    | 'whitespace-only'
    | 'not-a-integer'
    | 'out-of-range';
}

/** Env-shaped input; process.env satisfies this structurally. */
type EnvLike = Record<string, string | undefined>;

const PORT_MIN = 1;
const PORT_MAX = 65535;
const POOL_MAX_MIN = 1;
const POOL_MAX_MAX = 1000;

/** Trimmed presence check; distinguishes why the binding failed for the diagnostic. */
function classifyAbsent(name: RuntimeBindingName, raw: string | undefined): BindingProblem | undefined {
  if (raw === undefined) return { name, reason: 'missing' };
  if (raw.trim() === '') return { name, reason: raw.length === 0 ? 'empty' : 'whitespace-only' };
  return undefined;
}

function parseIntegerBinding(
  name: RuntimeBindingName,
  raw: string,
  min: number,
  max: number,
): { readonly value: number } | { readonly problem: BindingProblem } {
  // Only digits after trim: rejects signs, spaces, hex, exponent forms — no coercion surprises.
  if (!/^\d+$/.test(raw)) return { problem: { name, reason: 'not-a-integer' } };
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    return { problem: { name, reason: 'out-of-range' } };
  }
  return { value };
}

/**
 * Validate all bindings the minimal API bootstrap requires BEFORE any pool is
 * constructed or listener opened. Accumulates every problem so operators see
 * the full list; never mutates the input env.
 */
export function validateRuntimeBindings(env: EnvLike): Result<RuntimeBindings, readonly BindingProblem[]> {
  const problems: BindingProblem[] = [];

  const urlProblem = classifyAbsent('DATABASE_URL', env.DATABASE_URL);
  if (urlProblem) problems.push(urlProblem);

  const portProblem = classifyAbsent('PORT', env.PORT);
  if (portProblem) problems.push(portProblem);

  // POOL_MAX is optional; present-but-blank is treated as absent, garbage is a hard error.
  let poolMax: number | undefined;
  const poolMaxRaw = env.POOL_MAX?.trim();
  if (poolMaxRaw !== undefined && poolMaxRaw !== '') {
    const parsedPoolMax = parseIntegerBinding('POOL_MAX', poolMaxRaw, POOL_MAX_MIN, POOL_MAX_MAX);
    if ('problem' in parsedPoolMax) problems.push(parsedPoolMax.problem);
    else poolMax = parsedPoolMax.value;
  }

  // Parse PORT only when present-and-clean; DATABASE_URL needs no parsing beyond presence.
  let port: number | undefined;
  if (!portProblem) {
    const parsedPort = parseIntegerBinding('PORT', (env.PORT as string).trim(), PORT_MIN, PORT_MAX);
    if ('problem' in parsedPort) problems.push(parsedPort.problem);
    else port = parsedPort.value;
  }

  if (problems.length > 0) return err(problems);
  const bindings: RuntimeBindings = {
    databaseUrl: (env.DATABASE_URL as string).trim(),
    // Empty problems implies PORT parsed successfully above.
    port: port as number,
  };
  return ok(poolMax === undefined ? bindings : { ...bindings, poolMax });
}

/** Map each problem to a log-safe F2 problem that NAMES the binding and never its value. */
export function bindingProblemsToDiagnostics(problems: readonly BindingProblem[]): readonly Problem[] {
  return problems.map(({ name, reason }) =>
    problem(
      'invalid_request',
      500,
      false,
      `runtime binding '${name}' ${reason} — startup refused; no fallback applied`,
      { fieldErrors: [{ field: name, message: reason }] },
    ),
  );
}

/** Single fail-closed entry point for the bootstrap stub (coder-47): one call, sanitized diagnostics out. */
export function validateRuntimeBindingsOrProblem(env: EnvLike): Result<RuntimeBindings, readonly Problem[]> {
  const result = validateRuntimeBindings(env);
  return result.ok ? result : err(bindingProblemsToDiagnostics(result.error));
}

/** Convert validated bindings into the shape coder-44's pool factory consumes. */
export function toDatabaseBindings(bindings: RuntimeBindings): DatabaseBindingsShape {
  return bindings.poolMax === undefined
    ? { databaseUrl: bindings.databaseUrl }
    : { databaseUrl: bindings.databaseUrl, poolMax: bindings.poolMax };
}
