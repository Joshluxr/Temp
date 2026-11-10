import type { UUID } from '../../packages/contracts/src/context.ts';
import type { Base01CommandContext, Base01Input } from '../../packages/contracts/src/workspace.ts';
import { describe, expect, it } from 'vitest';

import { checkWorkspaceEvidence } from '../../packages/platform/check-workspace-evidence.ts';

function ctx(): Base01CommandContext {
  return Object.freeze({
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
  });
}

function body(
  sourceArchiveOverlapPresent: boolean,
  unrelatedRootOverlapPresent: boolean,
  pathTraversalPresent: boolean,
  batchScopeMismatch: boolean,
  handoffHashMismatch: boolean,
): Base01Input {
  return Object.freeze({
    sourceArchiveOverlapPresent,
    unrelatedRootOverlapPresent,
    pathTraversalPresent,
    batchScopeMismatch,
    handoffHashMismatch,
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
    detail: 'T-BASE-01 checkWorkspaceEvidence cannot verify workspace isolation, path safety, batch boundaries or handoff hashes: full T-BASE-01 remains HOLD (fail closed)',
  },
  {
    flags: [false, false, false, false, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-BASE-01 supplied handoff hash mismatch blocks workspace evidence',
  },
  {
    flags: [false, false, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-BASE-01 supplied batch scope mismatch blocks workspace evidence',
  },
  {
    flags: [false, false, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-BASE-01 supplied batch scope mismatch blocks workspace evidence',
  },
  {
    flags: [false, false, true, false, false] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-BASE-01 supplied path traversal blocks workspace evidence',
  },
  {
    flags: [false, false, true, false, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-BASE-01 supplied path traversal blocks workspace evidence',
  },
  {
    flags: [false, false, true, true, false] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-BASE-01 supplied path traversal blocks workspace evidence',
  },
  {
    flags: [false, false, true, true, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-BASE-01 supplied path traversal blocks workspace evidence',
  },
  {
    flags: [false, true, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-BASE-01 supplied unrelated root overlap blocks workspace evidence',
  },
  {
    flags: [false, true, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-BASE-01 supplied unrelated root overlap blocks workspace evidence',
  },
  {
    flags: [false, true, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-BASE-01 supplied unrelated root overlap blocks workspace evidence',
  },
  {
    flags: [false, true, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-BASE-01 supplied unrelated root overlap blocks workspace evidence',
  },
  {
    flags: [false, true, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-BASE-01 supplied unrelated root overlap blocks workspace evidence',
  },
  {
    flags: [false, true, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-BASE-01 supplied unrelated root overlap blocks workspace evidence',
  },
  {
    flags: [false, true, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-BASE-01 supplied unrelated root overlap blocks workspace evidence',
  },
  {
    flags: [false, true, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-BASE-01 supplied unrelated root overlap blocks workspace evidence',
  },
  {
    flags: [true, false, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-BASE-01 supplied source archive overlap blocks workspace evidence',
  },
  {
    flags: [true, false, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-BASE-01 supplied source archive overlap blocks workspace evidence',
  },
  {
    flags: [true, false, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-BASE-01 supplied source archive overlap blocks workspace evidence',
  },
  {
    flags: [true, false, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-BASE-01 supplied source archive overlap blocks workspace evidence',
  },
  {
    flags: [true, false, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-BASE-01 supplied source archive overlap blocks workspace evidence',
  },
  {
    flags: [true, false, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-BASE-01 supplied source archive overlap blocks workspace evidence',
  },
  {
    flags: [true, false, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-BASE-01 supplied source archive overlap blocks workspace evidence',
  },
  {
    flags: [true, false, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-BASE-01 supplied source archive overlap blocks workspace evidence',
  },
  {
    flags: [true, true, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-BASE-01 supplied source archive overlap blocks workspace evidence',
  },
  {
    flags: [true, true, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-BASE-01 supplied source archive overlap blocks workspace evidence',
  },
  {
    flags: [true, true, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-BASE-01 supplied source archive overlap blocks workspace evidence',
  },
  {
    flags: [true, true, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-BASE-01 supplied source archive overlap blocks workspace evidence',
  },
  {
    flags: [true, true, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-BASE-01 supplied source archive overlap blocks workspace evidence',
  },
  {
    flags: [true, true, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-BASE-01 supplied source archive overlap blocks workspace evidence',
  },
  {
    flags: [true, true, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-BASE-01 supplied source archive overlap blocks workspace evidence',
  },
  {
    flags: [true, true, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-BASE-01 supplied source archive overlap blocks workspace evidence',
  },
];

describe('TEST-BASE-01 — checkWorkspaceEvidence never accepts a workspace', () => {
  it.each(expectedTable)(
    'archive=%s root=%s traversal=%s batch=%s hash=%s => $code $status',
    async ({ flags, code, status, retryable, detail }) => {
      const [
        sourceArchiveOverlapPresent,
        unrelatedRootOverlapPresent,
        pathTraversalPresent,
        batchScopeMismatch,
        handoffHashMismatch,
      ] = flags;
      const input = body(
        sourceArchiveOverlapPresent,
        unrelatedRootOverlapPresent,
        pathTraversalPresent,
        batchScopeMismatch,
        handoffHashMismatch,
      );
      const context = ctx();
      const first = await checkWorkspaceEvidence(context, input);
      const second = await checkWorkspaceEvidence(context, input);
      expect(input).toEqual(
        body(
          sourceArchiveOverlapPresent,
          unrelatedRootOverlapPresent,
          pathTraversalPresent,
          batchScopeMismatch,
          handoffHashMismatch,
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
