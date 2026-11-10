import type { UUID } from '../../packages/contracts/src/context.ts';
import type { Release01CommandContext, Release01Input } from '../../packages/contracts/src/release.ts';
import { describe, expect, it } from 'vitest';

import { checkReleaseEvidence } from '../../packages/platform/check-release-evidence.ts';

function ctx(): Release01CommandContext {
  return Object.freeze({
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
  });
}

function body(
  requiredApproverMissing: boolean,
  requiredCapsMissing: boolean,
  gateEvidenceMissing: boolean,
  candidateMismatch: boolean,
  gateEvidenceStale: boolean,
  providerEvidenceInvalidated: boolean,
): Release01Input {
  return Object.freeze({
    requiredApproverMissing,
    requiredCapsMissing,
    gateEvidenceMissing,
    candidateMismatch,
    gateEvidenceStale,
    providerEvidenceInvalidated,
  });
}

const expectedTable: ReadonlyArray<{
  readonly flags: readonly [boolean, boolean, boolean, boolean, boolean, boolean];
  readonly code: string;
  readonly status: number;
  readonly retryable: boolean;
  readonly detail: string;
}> = [
  {
    flags: [false, false, false, false, false, false] as const,
    code: 'dependency_unavailable',
    status: 503,
    retryable: true,
    detail: 'T-RELEASE-01 checkReleaseEvidence cannot verify exact-candidate proofs, freshness, approvals, caps or provider validity: full T-RELEASE-01 remains HOLD (fail closed)',
  },
  {
    flags: [false, false, false, false, false, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-RELEASE-01 supplied provider evidence invalidation blocks release evidence',
  },
  {
    flags: [false, false, false, false, true, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-RELEASE-01 supplied stale gate evidence blocks release evidence',
  },
  {
    flags: [false, false, false, false, true, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-RELEASE-01 supplied stale gate evidence blocks release evidence',
  },
  {
    flags: [false, false, false, true, false, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-RELEASE-01 supplied candidate mismatch blocks release evidence',
  },
  {
    flags: [false, false, false, true, false, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-RELEASE-01 supplied candidate mismatch blocks release evidence',
  },
  {
    flags: [false, false, false, true, true, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-RELEASE-01 supplied candidate mismatch blocks release evidence',
  },
  {
    flags: [false, false, false, true, true, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-RELEASE-01 supplied candidate mismatch blocks release evidence',
  },
  {
    flags: [false, false, true, false, false, false] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing gate evidence blocks release evidence',
  },
  {
    flags: [false, false, true, false, false, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing gate evidence blocks release evidence',
  },
  {
    flags: [false, false, true, false, true, false] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing gate evidence blocks release evidence',
  },
  {
    flags: [false, false, true, false, true, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing gate evidence blocks release evidence',
  },
  {
    flags: [false, false, true, true, false, false] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing gate evidence blocks release evidence',
  },
  {
    flags: [false, false, true, true, false, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing gate evidence blocks release evidence',
  },
  {
    flags: [false, false, true, true, true, false] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing gate evidence blocks release evidence',
  },
  {
    flags: [false, false, true, true, true, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing gate evidence blocks release evidence',
  },
  {
    flags: [false, true, false, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required caps blocks release evidence',
  },
  {
    flags: [false, true, false, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required caps blocks release evidence',
  },
  {
    flags: [false, true, false, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required caps blocks release evidence',
  },
  {
    flags: [false, true, false, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required caps blocks release evidence',
  },
  {
    flags: [false, true, false, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required caps blocks release evidence',
  },
  {
    flags: [false, true, false, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required caps blocks release evidence',
  },
  {
    flags: [false, true, false, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required caps blocks release evidence',
  },
  {
    flags: [false, true, false, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required caps blocks release evidence',
  },
  {
    flags: [false, true, true, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required caps blocks release evidence',
  },
  {
    flags: [false, true, true, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required caps blocks release evidence',
  },
  {
    flags: [false, true, true, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required caps blocks release evidence',
  },
  {
    flags: [false, true, true, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required caps blocks release evidence',
  },
  {
    flags: [false, true, true, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required caps blocks release evidence',
  },
  {
    flags: [false, true, true, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required caps blocks release evidence',
  },
  {
    flags: [false, true, true, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required caps blocks release evidence',
  },
  {
    flags: [false, true, true, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required caps blocks release evidence',
  },
  {
    flags: [true, false, false, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required approver blocks release evidence',
  },
  {
    flags: [true, false, false, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required approver blocks release evidence',
  },
  {
    flags: [true, false, false, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required approver blocks release evidence',
  },
  {
    flags: [true, false, false, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required approver blocks release evidence',
  },
  {
    flags: [true, false, false, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required approver blocks release evidence',
  },
  {
    flags: [true, false, false, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required approver blocks release evidence',
  },
  {
    flags: [true, false, false, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required approver blocks release evidence',
  },
  {
    flags: [true, false, false, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required approver blocks release evidence',
  },
  {
    flags: [true, false, true, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required approver blocks release evidence',
  },
  {
    flags: [true, false, true, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required approver blocks release evidence',
  },
  {
    flags: [true, false, true, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required approver blocks release evidence',
  },
  {
    flags: [true, false, true, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required approver blocks release evidence',
  },
  {
    flags: [true, false, true, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required approver blocks release evidence',
  },
  {
    flags: [true, false, true, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required approver blocks release evidence',
  },
  {
    flags: [true, false, true, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required approver blocks release evidence',
  },
  {
    flags: [true, false, true, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required approver blocks release evidence',
  },
  {
    flags: [true, true, false, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required approver blocks release evidence',
  },
  {
    flags: [true, true, false, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required approver blocks release evidence',
  },
  {
    flags: [true, true, false, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required approver blocks release evidence',
  },
  {
    flags: [true, true, false, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required approver blocks release evidence',
  },
  {
    flags: [true, true, false, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required approver blocks release evidence',
  },
  {
    flags: [true, true, false, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required approver blocks release evidence',
  },
  {
    flags: [true, true, false, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required approver blocks release evidence',
  },
  {
    flags: [true, true, false, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required approver blocks release evidence',
  },
  {
    flags: [true, true, true, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required approver blocks release evidence',
  },
  {
    flags: [true, true, true, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required approver blocks release evidence',
  },
  {
    flags: [true, true, true, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required approver blocks release evidence',
  },
  {
    flags: [true, true, true, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required approver blocks release evidence',
  },
  {
    flags: [true, true, true, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required approver blocks release evidence',
  },
  {
    flags: [true, true, true, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required approver blocks release evidence',
  },
  {
    flags: [true, true, true, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required approver blocks release evidence',
  },
  {
    flags: [true, true, true, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-RELEASE-01 supplied missing required approver blocks release evidence',
  },
];

describe('TEST-RELEASE-01 — checkReleaseEvidence never assembles a release', () => {
  it.each(expectedTable)(
    'approver=%s caps=%s missing=%s mismatch=%s stale=%s provider=%s => $code $status',
    async ({ flags, code, status, retryable, detail }) => {
      const [
        requiredApproverMissing,
        requiredCapsMissing,
        gateEvidenceMissing,
        candidateMismatch,
        gateEvidenceStale,
        providerEvidenceInvalidated,
      ] = flags;
      const input = body(
        requiredApproverMissing,
        requiredCapsMissing,
        gateEvidenceMissing,
        candidateMismatch,
        gateEvidenceStale,
        providerEvidenceInvalidated,
      );
      const context = ctx();
      const first = await checkReleaseEvidence(context, input);
      const second = await checkReleaseEvidence(context, input);
      expect(input).toEqual(
        body(
          requiredApproverMissing,
          requiredCapsMissing,
          gateEvidenceMissing,
          candidateMismatch,
          gateEvidenceStale,
          providerEvidenceInvalidated,
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
