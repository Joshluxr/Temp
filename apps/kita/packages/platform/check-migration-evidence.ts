/**
 * @kita/platform — check-migration-evidence (T-MIG-01).
 *
 * Pure fail-closed checker. Archive mutation, hash mismatch, incomplete
 * dispositions, prohibited runtime references, and unauthorized import never
 * complete migration. Never ok:true. Full T-MIG-01 remains HOLD.
 */

import type { Mig01CommandContext, Mig01Input, Mig01Output } from '../contracts/src/migration.ts';
import type { Problem, Result } from '../contracts/src/result.ts';
import { err, problem } from '../contracts/src/result.ts';

export async function checkMigrationEvidence(
  _ctx: Mig01CommandContext,
  input: Mig01Input,
): Promise<Result<Mig01Output, Problem>> {
  if (input.archiveMutationRequested) {
    return err(
      problem(
        'unauthorized',
        403,
        false,
        'T-MIG-01 supplied archive mutation request blocks migration evidence',
      ),
    );
  }
  if (input.sourceHashMismatch) {
    return err(
      problem(
        'stale_or_conflicting_command',
        409,
        false,
        'T-MIG-01 supplied source hash mismatch blocks migration evidence',
      ),
    );
  }
  if (input.dispositionCoverageIncomplete) {
    return err(
      problem(
        'invalid_request',
        400,
        false,
        'T-MIG-01 supplied incomplete disposition coverage blocks migration evidence',
      ),
    );
  }
  if (input.prohibitedRuntimeReferencePresent) {
    return err(
      problem(
        'unauthorized',
        403,
        false,
        'T-MIG-01 supplied prohibited runtime reference blocks migration evidence',
      ),
    );
  }
  if (input.dataImportNotAuthorized) {
    return err(
      problem(
        'unauthorized',
        403,
        false,
        'T-MIG-01 supplied unauthorized data import blocks migration evidence',
      ),
    );
  }
  return err(
    problem(
      'dependency_unavailable',
      503,
      true,
      'T-MIG-01 checkMigrationEvidence cannot verify archive preservation, source hashes, dispositions, runtime isolation or data authorization: full T-MIG-01 remains HOLD (fail closed)',
    ),
  );
}
