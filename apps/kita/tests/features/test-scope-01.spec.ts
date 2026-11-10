import type { UUID } from '../../packages/contracts/src/context.ts';
import type { Scope01CommandContext, Scope01Input } from '../../packages/contracts/src/original-spec-crosswalk.ts';
import { describe, expect, it } from 'vitest';

import { checkOriginalSpecCrosswalk } from '../../packages/platform/check-original-spec-crosswalk.ts';

function ctx(): Scope01CommandContext {
  return Object.freeze({
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
  });
}

function body(
  requiredReviewMissing: boolean,
  originalSpecMissing: boolean,
  duplicateOriginalRequirementPresent: boolean,
  crosswalkConflictPresent: boolean,
  unmappedOriginalRequirementPresent: boolean,
  unmappedRequiredScenarioPresent: boolean,
): Scope01Input {
  return Object.freeze({
    requiredReviewMissing,
    originalSpecMissing,
    duplicateOriginalRequirementPresent,
    crosswalkConflictPresent,
    unmappedOriginalRequirementPresent,
    unmappedRequiredScenarioPresent,
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
    detail: 'T-SCOPE-01 checkOriginalSpecCrosswalk cannot verify original sources, unique mappings, conflicts, requirement or scenario coverage, source hashes or Product/Sol review: full T-SCOPE-01 remains HOLD (fail closed)',
  },
  {
    flags: [false, false, false, false, false, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-SCOPE-01 supplied unmapped required scenario blocks original-spec crosswalk',
  },
  {
    flags: [false, false, false, false, true, false] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-SCOPE-01 supplied unmapped original requirement blocks original-spec crosswalk',
  },
  {
    flags: [false, false, false, false, true, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-SCOPE-01 supplied unmapped original requirement blocks original-spec crosswalk',
  },
  {
    flags: [false, false, false, true, false, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-SCOPE-01 supplied conflicting mapping blocks original-spec crosswalk',
  },
  {
    flags: [false, false, false, true, false, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-SCOPE-01 supplied conflicting mapping blocks original-spec crosswalk',
  },
  {
    flags: [false, false, false, true, true, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-SCOPE-01 supplied conflicting mapping blocks original-spec crosswalk',
  },
  {
    flags: [false, false, false, true, true, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-SCOPE-01 supplied conflicting mapping blocks original-spec crosswalk',
  },
  {
    flags: [false, false, true, false, false, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-SCOPE-01 supplied duplicate original requirement blocks original-spec crosswalk',
  },
  {
    flags: [false, false, true, false, false, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-SCOPE-01 supplied duplicate original requirement blocks original-spec crosswalk',
  },
  {
    flags: [false, false, true, false, true, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-SCOPE-01 supplied duplicate original requirement blocks original-spec crosswalk',
  },
  {
    flags: [false, false, true, false, true, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-SCOPE-01 supplied duplicate original requirement blocks original-spec crosswalk',
  },
  {
    flags: [false, false, true, true, false, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-SCOPE-01 supplied duplicate original requirement blocks original-spec crosswalk',
  },
  {
    flags: [false, false, true, true, false, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-SCOPE-01 supplied duplicate original requirement blocks original-spec crosswalk',
  },
  {
    flags: [false, false, true, true, true, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-SCOPE-01 supplied duplicate original requirement blocks original-spec crosswalk',
  },
  {
    flags: [false, false, true, true, true, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-SCOPE-01 supplied duplicate original requirement blocks original-spec crosswalk',
  },
  {
    flags: [false, true, false, false, false, false] as const,
    code: 'dependency_unavailable',
    status: 503,
    retryable: true,
    detail: 'T-SCOPE-01 supplied missing original specification blocks original-spec crosswalk',
  },
  {
    flags: [false, true, false, false, false, true] as const,
    code: 'dependency_unavailable',
    status: 503,
    retryable: true,
    detail: 'T-SCOPE-01 supplied missing original specification blocks original-spec crosswalk',
  },
  {
    flags: [false, true, false, false, true, false] as const,
    code: 'dependency_unavailable',
    status: 503,
    retryable: true,
    detail: 'T-SCOPE-01 supplied missing original specification blocks original-spec crosswalk',
  },
  {
    flags: [false, true, false, false, true, true] as const,
    code: 'dependency_unavailable',
    status: 503,
    retryable: true,
    detail: 'T-SCOPE-01 supplied missing original specification blocks original-spec crosswalk',
  },
  {
    flags: [false, true, false, true, false, false] as const,
    code: 'dependency_unavailable',
    status: 503,
    retryable: true,
    detail: 'T-SCOPE-01 supplied missing original specification blocks original-spec crosswalk',
  },
  {
    flags: [false, true, false, true, false, true] as const,
    code: 'dependency_unavailable',
    status: 503,
    retryable: true,
    detail: 'T-SCOPE-01 supplied missing original specification blocks original-spec crosswalk',
  },
  {
    flags: [false, true, false, true, true, false] as const,
    code: 'dependency_unavailable',
    status: 503,
    retryable: true,
    detail: 'T-SCOPE-01 supplied missing original specification blocks original-spec crosswalk',
  },
  {
    flags: [false, true, false, true, true, true] as const,
    code: 'dependency_unavailable',
    status: 503,
    retryable: true,
    detail: 'T-SCOPE-01 supplied missing original specification blocks original-spec crosswalk',
  },
  {
    flags: [false, true, true, false, false, false] as const,
    code: 'dependency_unavailable',
    status: 503,
    retryable: true,
    detail: 'T-SCOPE-01 supplied missing original specification blocks original-spec crosswalk',
  },
  {
    flags: [false, true, true, false, false, true] as const,
    code: 'dependency_unavailable',
    status: 503,
    retryable: true,
    detail: 'T-SCOPE-01 supplied missing original specification blocks original-spec crosswalk',
  },
  {
    flags: [false, true, true, false, true, false] as const,
    code: 'dependency_unavailable',
    status: 503,
    retryable: true,
    detail: 'T-SCOPE-01 supplied missing original specification blocks original-spec crosswalk',
  },
  {
    flags: [false, true, true, false, true, true] as const,
    code: 'dependency_unavailable',
    status: 503,
    retryable: true,
    detail: 'T-SCOPE-01 supplied missing original specification blocks original-spec crosswalk',
  },
  {
    flags: [false, true, true, true, false, false] as const,
    code: 'dependency_unavailable',
    status: 503,
    retryable: true,
    detail: 'T-SCOPE-01 supplied missing original specification blocks original-spec crosswalk',
  },
  {
    flags: [false, true, true, true, false, true] as const,
    code: 'dependency_unavailable',
    status: 503,
    retryable: true,
    detail: 'T-SCOPE-01 supplied missing original specification blocks original-spec crosswalk',
  },
  {
    flags: [false, true, true, true, true, false] as const,
    code: 'dependency_unavailable',
    status: 503,
    retryable: true,
    detail: 'T-SCOPE-01 supplied missing original specification blocks original-spec crosswalk',
  },
  {
    flags: [false, true, true, true, true, true] as const,
    code: 'dependency_unavailable',
    status: 503,
    retryable: true,
    detail: 'T-SCOPE-01 supplied missing original specification blocks original-spec crosswalk',
  },
  {
    flags: [true, false, false, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-SCOPE-01 supplied missing required Product or Sol scope review blocks original-spec crosswalk',
  },
  {
    flags: [true, false, false, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-SCOPE-01 supplied missing required Product or Sol scope review blocks original-spec crosswalk',
  },
  {
    flags: [true, false, false, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-SCOPE-01 supplied missing required Product or Sol scope review blocks original-spec crosswalk',
  },
  {
    flags: [true, false, false, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-SCOPE-01 supplied missing required Product or Sol scope review blocks original-spec crosswalk',
  },
  {
    flags: [true, false, false, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-SCOPE-01 supplied missing required Product or Sol scope review blocks original-spec crosswalk',
  },
  {
    flags: [true, false, false, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-SCOPE-01 supplied missing required Product or Sol scope review blocks original-spec crosswalk',
  },
  {
    flags: [true, false, false, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-SCOPE-01 supplied missing required Product or Sol scope review blocks original-spec crosswalk',
  },
  {
    flags: [true, false, false, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-SCOPE-01 supplied missing required Product or Sol scope review blocks original-spec crosswalk',
  },
  {
    flags: [true, false, true, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-SCOPE-01 supplied missing required Product or Sol scope review blocks original-spec crosswalk',
  },
  {
    flags: [true, false, true, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-SCOPE-01 supplied missing required Product or Sol scope review blocks original-spec crosswalk',
  },
  {
    flags: [true, false, true, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-SCOPE-01 supplied missing required Product or Sol scope review blocks original-spec crosswalk',
  },
  {
    flags: [true, false, true, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-SCOPE-01 supplied missing required Product or Sol scope review blocks original-spec crosswalk',
  },
  {
    flags: [true, false, true, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-SCOPE-01 supplied missing required Product or Sol scope review blocks original-spec crosswalk',
  },
  {
    flags: [true, false, true, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-SCOPE-01 supplied missing required Product or Sol scope review blocks original-spec crosswalk',
  },
  {
    flags: [true, false, true, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-SCOPE-01 supplied missing required Product or Sol scope review blocks original-spec crosswalk',
  },
  {
    flags: [true, false, true, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-SCOPE-01 supplied missing required Product or Sol scope review blocks original-spec crosswalk',
  },
  {
    flags: [true, true, false, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-SCOPE-01 supplied missing required Product or Sol scope review blocks original-spec crosswalk',
  },
  {
    flags: [true, true, false, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-SCOPE-01 supplied missing required Product or Sol scope review blocks original-spec crosswalk',
  },
  {
    flags: [true, true, false, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-SCOPE-01 supplied missing required Product or Sol scope review blocks original-spec crosswalk',
  },
  {
    flags: [true, true, false, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-SCOPE-01 supplied missing required Product or Sol scope review blocks original-spec crosswalk',
  },
  {
    flags: [true, true, false, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-SCOPE-01 supplied missing required Product or Sol scope review blocks original-spec crosswalk',
  },
  {
    flags: [true, true, false, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-SCOPE-01 supplied missing required Product or Sol scope review blocks original-spec crosswalk',
  },
  {
    flags: [true, true, false, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-SCOPE-01 supplied missing required Product or Sol scope review blocks original-spec crosswalk',
  },
  {
    flags: [true, true, false, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-SCOPE-01 supplied missing required Product or Sol scope review blocks original-spec crosswalk',
  },
  {
    flags: [true, true, true, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-SCOPE-01 supplied missing required Product or Sol scope review blocks original-spec crosswalk',
  },
  {
    flags: [true, true, true, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-SCOPE-01 supplied missing required Product or Sol scope review blocks original-spec crosswalk',
  },
  {
    flags: [true, true, true, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-SCOPE-01 supplied missing required Product or Sol scope review blocks original-spec crosswalk',
  },
  {
    flags: [true, true, true, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-SCOPE-01 supplied missing required Product or Sol scope review blocks original-spec crosswalk',
  },
  {
    flags: [true, true, true, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-SCOPE-01 supplied missing required Product or Sol scope review blocks original-spec crosswalk',
  },
  {
    flags: [true, true, true, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-SCOPE-01 supplied missing required Product or Sol scope review blocks original-spec crosswalk',
  },
  {
    flags: [true, true, true, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-SCOPE-01 supplied missing required Product or Sol scope review blocks original-spec crosswalk',
  },
  {
    flags: [true, true, true, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-SCOPE-01 supplied missing required Product or Sol scope review blocks original-spec crosswalk',
  },
];

describe('TEST-SCOPE-01 — checkOriginalSpecCrosswalk never accepts scope', () => {
  it.each(expectedTable)(
    'review=%s spec=%s dup=%s conflict=%s unmappedReq=%s unmappedScen=%s => $code $status',
    async ({ flags, code, status, retryable, detail }) => {
      const [
        requiredReviewMissing,
        originalSpecMissing,
        duplicateOriginalRequirementPresent,
        crosswalkConflictPresent,
        unmappedOriginalRequirementPresent,
        unmappedRequiredScenarioPresent,
      ] = flags;
      const input = body(
        requiredReviewMissing,
        originalSpecMissing,
        duplicateOriginalRequirementPresent,
        crosswalkConflictPresent,
        unmappedOriginalRequirementPresent,
        unmappedRequiredScenarioPresent,
      );
      const context = ctx();
      const first = await checkOriginalSpecCrosswalk(context, input);
      const second = await checkOriginalSpecCrosswalk(context, input);
      expect(input).toEqual(
        body(
          requiredReviewMissing,
          originalSpecMissing,
          duplicateOriginalRequirementPresent,
          crosswalkConflictPresent,
          unmappedOriginalRequirementPresent,
          unmappedRequiredScenarioPresent,
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
