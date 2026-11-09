/**
 * Internal worker entrypoint for T-PLAT-01 (apps/workers/src/platform/
 * validate-build-baseline.worker.ts mirror). NOT a customer HTTP surface:
 * no route registers this, no financial reducer is reachable from it, and
 * GET controllers may only read its projection.
 *
 * Production wiring injects CI evidence adapters into `deps`; the default
 * bindings below are explicit DISABLED stubs — they refuse to manufacture
 * lock/build/secret evidence rather than returning optimistic placeholders.
 */

import type { Plat01Input, Plat01Output, Problem, Result, WorkerContext } from '@kita/contracts';
import { err, problem } from '@kita/contracts';
import { validateBuildBaseline, type ValidateBuildBaselineDeps } from '../validate-build-baseline.ts';

/** DISABLED: outcome manufacturing forbidden — a worker may not invent CI reproducibility/secret-scan evidence. */
const disabledEvidence = (): Promise<never> =>
  Promise.reject(new Error('DISABLED: outcome manufacturing forbidden — inject the CI evidence adapter'));

export const disabledValidateBuildBaselineDeps: ValidateBuildBaselineDeps = {
  readClientBundle: disabledEvidence,
  recomputeLockDigest: disabledEvidence,
  generatedClientsEvidence: disabledEvidence,
  nowIso: () => new Date().toISOString(),
};

export interface WorkerRunMeta {
  readonly workerName: 'validate-build-baseline';
  readonly httpMutable: false; // internal tool; no customer HTTP mutation
}

export const meta: WorkerRunMeta = { workerName: 'validate-build-baseline', httpMutable: false };

export async function run(
  ctx: WorkerContext,
  input: Plat01Input,
  deps: ValidateBuildBaselineDeps = disabledValidateBuildBaselineDeps,
): Promise<Result<Plat01Output, Problem>> {
  try {
    return await validateBuildBaseline(ctx, input, deps);
  } catch (cause) {
    // Evidence adapter missing/failing is dependency-unavailable, never a pass.
    ctx.trace('worker_evidence_unavailable', { reason: String(cause).slice(0, 200) });
    return err(problem('dependency_unavailable', 503, true, 'platform evidence adapter unavailable; baseline freeze refused (fail closed)'));
  }
}
