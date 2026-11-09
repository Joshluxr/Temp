/**
 * Internal worker entrypoint for T-PLAT-02 (apps/workers/src/platform/
 * migrate-core.worker.ts mirror). NOT a customer HTTP surface: no route
 * registers this, no financial reducer is reachable from it, and GET
 * controllers may only read its projection.
 *
 * Default bindings are explicit DISABLED stubs — the worker refuses to
 * fabricate checksum/grant/invariant proof instead of passing a migration
 * review on optimistic placeholders.
 */

import type { Plat02Input, Plat02Output, Problem, Result, WorkerContext } from '@kita/contracts';
import { err, problem } from '@kita/contracts';
import { migrateCore, type MigrateCoreDeps } from '../migrate-core.ts';

/** DISABLED: outcome manufacturing forbidden — a worker may not invent DDL/grant/invariant verification results. */
const disabledEvidence = (): Promise<never> =>
  Promise.reject(new Error('DISABLED: outcome manufacturing forbidden — inject the CI/database evidence adapter'));

export const disabledMigrateCoreDeps: MigrateCoreDeps = {
  verifyDdlChecksum: disabledEvidence,
  auditGrants: disabledEvidence,
  checkInvariants: disabledEvidence,
  schemaDigest: disabledEvidence,
};

export interface WorkerRunMeta {
  readonly workerName: 'migrate-core';
  readonly httpMutable: false; // internal tool; no customer HTTP mutation
}

export const meta: WorkerRunMeta = { workerName: 'migrate-core', httpMutable: false };

export async function run(
  ctx: WorkerContext,
  input: Plat02Input,
  deps: MigrateCoreDeps = disabledMigrateCoreDeps,
): Promise<Result<Plat02Output, Problem>> {
  try {
    return await migrateCore(ctx, input, deps);
  } catch (cause) {
    ctx.trace('worker_evidence_unavailable', { reason: String(cause).slice(0, 200) });
    return err(problem('dependency_unavailable', 503, true, 'migration evidence adapter unavailable; fresh-install proof refused (fail closed)'));
  }
}
