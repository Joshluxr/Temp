import type { UUID } from '../../packages/contracts/src/context.ts';
import type { Integrate01CommandContext, Integrate01Input } from '../../packages/contracts/src/integration-evidence.ts';
import { describe, expect, it } from 'vitest';

import { checkIntegrationEvidence } from '../../packages/platform/check-integration-evidence.ts';

function ctx(): Integrate01CommandContext {
  return Object.freeze({
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
  });
}

function body(
  requiredReviewMissing: boolean,
  candidateMismatch: boolean,
  candidateStale: boolean,
  requiredImplementationMissing: boolean,
  requiredScenarioSkipped: boolean,
  unexplainedFinancialBreakPresent: boolean,
): Integrate01Input {
  return Object.freeze({
    requiredReviewMissing,
    candidateMismatch,
    candidateStale,
    requiredImplementationMissing,
    requiredScenarioSkipped,
    unexplainedFinancialBreakPresent,
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
    detail: 'T-INTEGRATE-01 checkIntegrationEvidence cannot verify exact-candidate identity, freshness, review, implementation connectivity, scenario execution or financial-break disposition: full T-INTEGRATE-01 remains HOLD (fail closed)',
  },
  {
    flags: [false, false, false, false, false, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied unexplained financial break blocks integration evidence',
  },
  {
    flags: [false, false, false, false, true, false] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied skipped required scenario blocks integration evidence',
  },
  {
    flags: [false, false, false, false, true, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied skipped required scenario blocks integration evidence',
  },
  {
    flags: [false, false, false, true, false, false] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied missing required implementation blocks integration evidence',
  },
  {
    flags: [false, false, false, true, false, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied missing required implementation blocks integration evidence',
  },
  {
    flags: [false, false, false, true, true, false] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied missing required implementation blocks integration evidence',
  },
  {
    flags: [false, false, false, true, true, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied missing required implementation blocks integration evidence',
  },
  {
    flags: [false, false, true, false, false, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied stale candidate blocks integration evidence',
  },
  {
    flags: [false, false, true, false, false, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied stale candidate blocks integration evidence',
  },
  {
    flags: [false, false, true, false, true, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied stale candidate blocks integration evidence',
  },
  {
    flags: [false, false, true, false, true, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied stale candidate blocks integration evidence',
  },
  {
    flags: [false, false, true, true, false, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied stale candidate blocks integration evidence',
  },
  {
    flags: [false, false, true, true, false, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied stale candidate blocks integration evidence',
  },
  {
    flags: [false, false, true, true, true, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied stale candidate blocks integration evidence',
  },
  {
    flags: [false, false, true, true, true, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied stale candidate blocks integration evidence',
  },
  {
    flags: [false, true, false, false, false, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied candidate mismatch blocks integration evidence',
  },
  {
    flags: [false, true, false, false, false, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied candidate mismatch blocks integration evidence',
  },
  {
    flags: [false, true, false, false, true, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied candidate mismatch blocks integration evidence',
  },
  {
    flags: [false, true, false, false, true, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied candidate mismatch blocks integration evidence',
  },
  {
    flags: [false, true, false, true, false, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied candidate mismatch blocks integration evidence',
  },
  {
    flags: [false, true, false, true, false, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied candidate mismatch blocks integration evidence',
  },
  {
    flags: [false, true, false, true, true, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied candidate mismatch blocks integration evidence',
  },
  {
    flags: [false, true, false, true, true, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied candidate mismatch blocks integration evidence',
  },
  {
    flags: [false, true, true, false, false, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied candidate mismatch blocks integration evidence',
  },
  {
    flags: [false, true, true, false, false, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied candidate mismatch blocks integration evidence',
  },
  {
    flags: [false, true, true, false, true, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied candidate mismatch blocks integration evidence',
  },
  {
    flags: [false, true, true, false, true, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied candidate mismatch blocks integration evidence',
  },
  {
    flags: [false, true, true, true, false, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied candidate mismatch blocks integration evidence',
  },
  {
    flags: [false, true, true, true, false, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied candidate mismatch blocks integration evidence',
  },
  {
    flags: [false, true, true, true, true, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied candidate mismatch blocks integration evidence',
  },
  {
    flags: [false, true, true, true, true, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied candidate mismatch blocks integration evidence',
  },
  {
    flags: [true, false, false, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied missing required architect or exact-head Sol integration review blocks integration evidence',
  },
  {
    flags: [true, false, false, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied missing required architect or exact-head Sol integration review blocks integration evidence',
  },
  {
    flags: [true, false, false, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied missing required architect or exact-head Sol integration review blocks integration evidence',
  },
  {
    flags: [true, false, false, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied missing required architect or exact-head Sol integration review blocks integration evidence',
  },
  {
    flags: [true, false, false, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied missing required architect or exact-head Sol integration review blocks integration evidence',
  },
  {
    flags: [true, false, false, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied missing required architect or exact-head Sol integration review blocks integration evidence',
  },
  {
    flags: [true, false, false, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied missing required architect or exact-head Sol integration review blocks integration evidence',
  },
  {
    flags: [true, false, false, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied missing required architect or exact-head Sol integration review blocks integration evidence',
  },
  {
    flags: [true, false, true, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied missing required architect or exact-head Sol integration review blocks integration evidence',
  },
  {
    flags: [true, false, true, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied missing required architect or exact-head Sol integration review blocks integration evidence',
  },
  {
    flags: [true, false, true, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied missing required architect or exact-head Sol integration review blocks integration evidence',
  },
  {
    flags: [true, false, true, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied missing required architect or exact-head Sol integration review blocks integration evidence',
  },
  {
    flags: [true, false, true, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied missing required architect or exact-head Sol integration review blocks integration evidence',
  },
  {
    flags: [true, false, true, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied missing required architect or exact-head Sol integration review blocks integration evidence',
  },
  {
    flags: [true, false, true, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied missing required architect or exact-head Sol integration review blocks integration evidence',
  },
  {
    flags: [true, false, true, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied missing required architect or exact-head Sol integration review blocks integration evidence',
  },
  {
    flags: [true, true, false, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied missing required architect or exact-head Sol integration review blocks integration evidence',
  },
  {
    flags: [true, true, false, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied missing required architect or exact-head Sol integration review blocks integration evidence',
  },
  {
    flags: [true, true, false, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied missing required architect or exact-head Sol integration review blocks integration evidence',
  },
  {
    flags: [true, true, false, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied missing required architect or exact-head Sol integration review blocks integration evidence',
  },
  {
    flags: [true, true, false, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied missing required architect or exact-head Sol integration review blocks integration evidence',
  },
  {
    flags: [true, true, false, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied missing required architect or exact-head Sol integration review blocks integration evidence',
  },
  {
    flags: [true, true, false, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied missing required architect or exact-head Sol integration review blocks integration evidence',
  },
  {
    flags: [true, true, false, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied missing required architect or exact-head Sol integration review blocks integration evidence',
  },
  {
    flags: [true, true, true, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied missing required architect or exact-head Sol integration review blocks integration evidence',
  },
  {
    flags: [true, true, true, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied missing required architect or exact-head Sol integration review blocks integration evidence',
  },
  {
    flags: [true, true, true, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied missing required architect or exact-head Sol integration review blocks integration evidence',
  },
  {
    flags: [true, true, true, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied missing required architect or exact-head Sol integration review blocks integration evidence',
  },
  {
    flags: [true, true, true, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied missing required architect or exact-head Sol integration review blocks integration evidence',
  },
  {
    flags: [true, true, true, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied missing required architect or exact-head Sol integration review blocks integration evidence',
  },
  {
    flags: [true, true, true, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied missing required architect or exact-head Sol integration review blocks integration evidence',
  },
  {
    flags: [true, true, true, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-INTEGRATE-01 supplied missing required architect or exact-head Sol integration review blocks integration evidence',
  },
];

describe('TEST-INTEGRATE-01 — checkIntegrationEvidence never accepts integration', () => {
  it.each(expectedTable)(
    'review=%s mismatch=%s stale=%s missing=%s skipped=%s break=%s => $code $status',
    async ({ flags, code, status, retryable, detail }) => {
      const [
        requiredReviewMissing,
        candidateMismatch,
        candidateStale,
        requiredImplementationMissing,
        requiredScenarioSkipped,
        unexplainedFinancialBreakPresent,
      ] = flags;
      const input = body(
        requiredReviewMissing,
        candidateMismatch,
        candidateStale,
        requiredImplementationMissing,
        requiredScenarioSkipped,
        unexplainedFinancialBreakPresent,
      );
      const context = ctx();
      const first = await checkIntegrationEvidence(context, input);
      const second = await checkIntegrationEvidence(context, input);
      expect(input).toEqual(
        body(
          requiredReviewMissing,
          candidateMismatch,
          candidateStale,
          requiredImplementationMissing,
          requiredScenarioSkipped,
          unexplainedFinancialBreakPresent,
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
