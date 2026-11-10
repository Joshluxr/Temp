import type { UUID } from '../../packages/contracts/src/context.ts';
import type { Depend01CommandContext, Depend01Input } from '../../packages/contracts/src/dependency-evidence.ts';
import { describe, expect, it } from 'vitest';

import { checkDependencyEvidence } from '../../packages/platform/check-dependency-evidence.ts';

function ctx(): Depend01CommandContext {
  return Object.freeze({
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
  });
}

function body(
  requiredApprovalOrReviewMissing: boolean,
  scopeMismatch: boolean,
  evidenceStaleOrRevoked: boolean,
  dependencyRejected: boolean,
  requiredEvidenceMissing: boolean,
): Depend01Input {
  return Object.freeze({
    requiredApprovalOrReviewMissing,
    scopeMismatch,
    evidenceStaleOrRevoked,
    dependencyRejected,
    requiredEvidenceMissing,
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
    detail: 'T-DEPEND-01 checkDependencyEvidence cannot verify DEP-00-15 applicability, scoped evidence, current owner/counsel/Finance approvals or independent review, freshness, rejection status or activation conditions: full T-DEPEND-01 remains HOLD (fail closed)',
  },
  {
    flags: [false, false, false, false, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-DEPEND-01 supplied missing required dependency evidence blocks dependency evidence',
  },
  {
    flags: [false, false, false, true, false] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-DEPEND-01 supplied rejected dependency blocks dependency evidence',
  },
  {
    flags: [false, false, false, true, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-DEPEND-01 supplied rejected dependency blocks dependency evidence',
  },
  {
    flags: [false, false, true, false, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-DEPEND-01 supplied stale, expired or revoked dependency evidence blocks dependency evidence',
  },
  {
    flags: [false, false, true, false, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-DEPEND-01 supplied stale, expired or revoked dependency evidence blocks dependency evidence',
  },
  {
    flags: [false, false, true, true, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-DEPEND-01 supplied stale, expired or revoked dependency evidence blocks dependency evidence',
  },
  {
    flags: [false, false, true, true, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-DEPEND-01 supplied stale, expired or revoked dependency evidence blocks dependency evidence',
  },
  {
    flags: [false, true, false, false, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-DEPEND-01 supplied dependency scope mismatch blocks dependency evidence',
  },
  {
    flags: [false, true, false, false, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-DEPEND-01 supplied dependency scope mismatch blocks dependency evidence',
  },
  {
    flags: [false, true, false, true, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-DEPEND-01 supplied dependency scope mismatch blocks dependency evidence',
  },
  {
    flags: [false, true, false, true, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-DEPEND-01 supplied dependency scope mismatch blocks dependency evidence',
  },
  {
    flags: [false, true, true, false, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-DEPEND-01 supplied dependency scope mismatch blocks dependency evidence',
  },
  {
    flags: [false, true, true, false, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-DEPEND-01 supplied dependency scope mismatch blocks dependency evidence',
  },
  {
    flags: [false, true, true, true, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-DEPEND-01 supplied dependency scope mismatch blocks dependency evidence',
  },
  {
    flags: [false, true, true, true, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-DEPEND-01 supplied dependency scope mismatch blocks dependency evidence',
  },
  {
    flags: [true, false, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-DEPEND-01 supplied missing required owner/counsel/Finance approval or independent review blocks dependency evidence',
  },
  {
    flags: [true, false, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-DEPEND-01 supplied missing required owner/counsel/Finance approval or independent review blocks dependency evidence',
  },
  {
    flags: [true, false, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-DEPEND-01 supplied missing required owner/counsel/Finance approval or independent review blocks dependency evidence',
  },
  {
    flags: [true, false, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-DEPEND-01 supplied missing required owner/counsel/Finance approval or independent review blocks dependency evidence',
  },
  {
    flags: [true, false, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-DEPEND-01 supplied missing required owner/counsel/Finance approval or independent review blocks dependency evidence',
  },
  {
    flags: [true, false, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-DEPEND-01 supplied missing required owner/counsel/Finance approval or independent review blocks dependency evidence',
  },
  {
    flags: [true, false, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-DEPEND-01 supplied missing required owner/counsel/Finance approval or independent review blocks dependency evidence',
  },
  {
    flags: [true, false, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-DEPEND-01 supplied missing required owner/counsel/Finance approval or independent review blocks dependency evidence',
  },
  {
    flags: [true, true, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-DEPEND-01 supplied missing required owner/counsel/Finance approval or independent review blocks dependency evidence',
  },
  {
    flags: [true, true, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-DEPEND-01 supplied missing required owner/counsel/Finance approval or independent review blocks dependency evidence',
  },
  {
    flags: [true, true, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-DEPEND-01 supplied missing required owner/counsel/Finance approval or independent review blocks dependency evidence',
  },
  {
    flags: [true, true, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-DEPEND-01 supplied missing required owner/counsel/Finance approval or independent review blocks dependency evidence',
  },
  {
    flags: [true, true, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-DEPEND-01 supplied missing required owner/counsel/Finance approval or independent review blocks dependency evidence',
  },
  {
    flags: [true, true, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-DEPEND-01 supplied missing required owner/counsel/Finance approval or independent review blocks dependency evidence',
  },
  {
    flags: [true, true, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-DEPEND-01 supplied missing required owner/counsel/Finance approval or independent review blocks dependency evidence',
  },
  {
    flags: [true, true, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-DEPEND-01 supplied missing required owner/counsel/Finance approval or independent review blocks dependency evidence',
  },
];

describe('TEST-DEPEND-01 evidence — checkDependencyEvidence never enables a capability', () => {
  it.each(expectedTable)(
    'approval=%s scope=%s stale=%s rejected=%s missing=%s => $code $status',
    async ({ flags, code, status, retryable, detail }) => {
      const [
        requiredApprovalOrReviewMissing,
        scopeMismatch,
        evidenceStaleOrRevoked,
        dependencyRejected,
        requiredEvidenceMissing,
      ] = flags;
      const input = body(
        requiredApprovalOrReviewMissing,
        scopeMismatch,
        evidenceStaleOrRevoked,
        dependencyRejected,
        requiredEvidenceMissing,
      );
      const context = ctx();
      const first = await checkDependencyEvidence(context, input);
      const second = await checkDependencyEvidence(context, input);
      expect(input).toEqual(
        body(
          requiredApprovalOrReviewMissing,
          scopeMismatch,
          evidenceStaleOrRevoked,
          dependencyRejected,
          requiredEvidenceMissing,
        ),
      );
      expect(context).toEqual(ctx());
      expect(first).toStrictEqual({
        ok: false,
        error: { code, status, retryable, detail },
      });
      expect(second).toStrictEqual(first);
      expect(Object.keys(first)).toEqual(['ok', 'error']);
      expect(Object.keys(first.error)).toEqual(['code', 'status', 'retryable', 'detail']);
      expect('value' in first).toBe(false);
    },
  );
});
