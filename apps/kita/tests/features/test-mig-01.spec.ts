import type { UUID } from '../../packages/contracts/src/context.ts';
import type { Mig01CommandContext, Mig01Input } from '../../packages/contracts/src/migration.ts';
import { describe, expect, it } from 'vitest';

import { checkMigrationEvidence } from '../../packages/platform/check-migration-evidence.ts';

function ctx(): Mig01CommandContext {
  return Object.freeze({
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
  });
}

function body(
  archiveMutationRequested: boolean,
  sourceHashMismatch: boolean,
  dispositionCoverageIncomplete: boolean,
  prohibitedRuntimeReferencePresent: boolean,
  dataImportNotAuthorized: boolean,
): Mig01Input {
  return Object.freeze({
    archiveMutationRequested,
    sourceHashMismatch,
    dispositionCoverageIncomplete,
    prohibitedRuntimeReferencePresent,
    dataImportNotAuthorized,
  });
}

const expectedTable: ReadonlyArray<{
  readonly flags: readonly [boolean, boolean, boolean, boolean, boolean];
  readonly code: string;
  readonly status: number;
  readonly retryable: boolean;
  readonly detail: string;
}> = [
  {
    flags: [false, false, false, false, false] as const,
    code: 'dependency_unavailable',
    status: 503,
    retryable: true,
    detail: 'T-MIG-01 checkMigrationEvidence cannot verify archive preservation, source hashes, dispositions, runtime isolation or data authorization: full T-MIG-01 remains HOLD (fail closed)',
  },
  {
    flags: [false, false, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-MIG-01 supplied unauthorized data import blocks migration evidence',
  },
  {
    flags: [false, false, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-MIG-01 supplied prohibited runtime reference blocks migration evidence',
  },
  {
    flags: [false, false, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-MIG-01 supplied prohibited runtime reference blocks migration evidence',
  },
  {
    flags: [false, false, true, false, false] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-MIG-01 supplied incomplete disposition coverage blocks migration evidence',
  },
  {
    flags: [false, false, true, false, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-MIG-01 supplied incomplete disposition coverage blocks migration evidence',
  },
  {
    flags: [false, false, true, true, false] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-MIG-01 supplied incomplete disposition coverage blocks migration evidence',
  },
  {
    flags: [false, false, true, true, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-MIG-01 supplied incomplete disposition coverage blocks migration evidence',
  },
  {
    flags: [false, true, false, false, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-MIG-01 supplied source hash mismatch blocks migration evidence',
  },
  {
    flags: [false, true, false, false, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-MIG-01 supplied source hash mismatch blocks migration evidence',
  },
  {
    flags: [false, true, false, true, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-MIG-01 supplied source hash mismatch blocks migration evidence',
  },
  {
    flags: [false, true, false, true, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-MIG-01 supplied source hash mismatch blocks migration evidence',
  },
  {
    flags: [false, true, true, false, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-MIG-01 supplied source hash mismatch blocks migration evidence',
  },
  {
    flags: [false, true, true, false, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-MIG-01 supplied source hash mismatch blocks migration evidence',
  },
  {
    flags: [false, true, true, true, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-MIG-01 supplied source hash mismatch blocks migration evidence',
  },
  {
    flags: [false, true, true, true, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-MIG-01 supplied source hash mismatch blocks migration evidence',
  },
  {
    flags: [true, false, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-MIG-01 supplied archive mutation request blocks migration evidence',
  },
  {
    flags: [true, false, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-MIG-01 supplied archive mutation request blocks migration evidence',
  },
  {
    flags: [true, false, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-MIG-01 supplied archive mutation request blocks migration evidence',
  },
  {
    flags: [true, false, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-MIG-01 supplied archive mutation request blocks migration evidence',
  },
  {
    flags: [true, false, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-MIG-01 supplied archive mutation request blocks migration evidence',
  },
  {
    flags: [true, false, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-MIG-01 supplied archive mutation request blocks migration evidence',
  },
  {
    flags: [true, false, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-MIG-01 supplied archive mutation request blocks migration evidence',
  },
  {
    flags: [true, false, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-MIG-01 supplied archive mutation request blocks migration evidence',
  },
  {
    flags: [true, true, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-MIG-01 supplied archive mutation request blocks migration evidence',
  },
  {
    flags: [true, true, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-MIG-01 supplied archive mutation request blocks migration evidence',
  },
  {
    flags: [true, true, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-MIG-01 supplied archive mutation request blocks migration evidence',
  },
  {
    flags: [true, true, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-MIG-01 supplied archive mutation request blocks migration evidence',
  },
  {
    flags: [true, true, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-MIG-01 supplied archive mutation request blocks migration evidence',
  },
  {
    flags: [true, true, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-MIG-01 supplied archive mutation request blocks migration evidence',
  },
  {
    flags: [true, true, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-MIG-01 supplied archive mutation request blocks migration evidence',
  },
  {
    flags: [true, true, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-MIG-01 supplied archive mutation request blocks migration evidence',
  },
];

describe('TEST-MIG-01 — checkMigrationEvidence never completes migration', () => {
  it.each(expectedTable)(
    'mutate=%s hash=%s coverage=%s runtime=%s import=%s => $code $status',
    async ({ flags, code, status, retryable, detail }) => {
      const [
        archiveMutationRequested,
        sourceHashMismatch,
        dispositionCoverageIncomplete,
        prohibitedRuntimeReferencePresent,
        dataImportNotAuthorized,
      ] = flags;
      const input = body(
        archiveMutationRequested,
        sourceHashMismatch,
        dispositionCoverageIncomplete,
        prohibitedRuntimeReferencePresent,
        dataImportNotAuthorized,
      );
      const context = ctx();
      const first = await checkMigrationEvidence(context, input);
      const second = await checkMigrationEvidence(context, input);
      expect(input).toEqual(
        body(
          archiveMutationRequested,
          sourceHashMismatch,
          dispositionCoverageIncomplete,
          prohibitedRuntimeReferencePresent,
          dataImportNotAuthorized,
        ),
      );
      expect(context).toEqual(ctx());
      expect(first).toEqual({
        ok: false,
        error: { code, status, retryable, detail },
      });
      expect(second).toEqual(first);
      expect('value' in first).toBe(false);
    },
  );
});
