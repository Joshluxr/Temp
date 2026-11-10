import type { UUID } from '../../packages/contracts/src/context.ts';
import type { Contract01CommandContext, Contract01Input } from '../../packages/contracts/src/contract-freeze.ts';
import { describe, expect, it } from 'vitest';

import { checkContractFreeze } from '../../packages/platform/check-contract-freeze.ts';

function ctx(): Contract01CommandContext {
  return Object.freeze({
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
  });
}

function body(
  requiredReviewMissing: boolean,
  ownershipConflictPresent: boolean,
  untypedMoneyPresent: boolean,
  unsafeOutcomeMappingPresent: boolean,
  unresolvedScopeClaimPresent: boolean,
  compatibilityEvidenceMissing: boolean,
): Contract01Input {
  return Object.freeze({
    requiredReviewMissing,
    ownershipConflictPresent,
    untypedMoneyPresent,
    unsafeOutcomeMappingPresent,
    unresolvedScopeClaimPresent,
    compatibilityEvidenceMissing,
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
    detail: 'T-CONTRACT-01 checkContractFreeze cannot verify reviewed definitions, ownership, money typing, outcome mapping, scope, signed hashes or compatibility: full T-CONTRACT-01 remains HOLD (fail closed)',
  },
  {
    flags: [false, false, false, false, false, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied missing compatibility evidence blocks contract freeze',
  },
  {
    flags: [false, false, false, false, true, false] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied unresolved scope claim blocks contract freeze',
  },
  {
    flags: [false, false, false, false, true, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied unresolved scope claim blocks contract freeze',
  },
  {
    flags: [false, false, false, true, false, false] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied unsafe outcome mapping blocks contract freeze',
  },
  {
    flags: [false, false, false, true, false, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied unsafe outcome mapping blocks contract freeze',
  },
  {
    flags: [false, false, false, true, true, false] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied unsafe outcome mapping blocks contract freeze',
  },
  {
    flags: [false, false, false, true, true, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied unsafe outcome mapping blocks contract freeze',
  },
  {
    flags: [false, false, true, false, false, false] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied untyped money blocks contract freeze',
  },
  {
    flags: [false, false, true, false, false, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied untyped money blocks contract freeze',
  },
  {
    flags: [false, false, true, false, true, false] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied untyped money blocks contract freeze',
  },
  {
    flags: [false, false, true, false, true, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied untyped money blocks contract freeze',
  },
  {
    flags: [false, false, true, true, false, false] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied untyped money blocks contract freeze',
  },
  {
    flags: [false, false, true, true, false, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied untyped money blocks contract freeze',
  },
  {
    flags: [false, false, true, true, true, false] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied untyped money blocks contract freeze',
  },
  {
    flags: [false, false, true, true, true, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied untyped money blocks contract freeze',
  },
  {
    flags: [false, true, false, false, false, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied conflicting ownership blocks contract freeze',
  },
  {
    flags: [false, true, false, false, false, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied conflicting ownership blocks contract freeze',
  },
  {
    flags: [false, true, false, false, true, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied conflicting ownership blocks contract freeze',
  },
  {
    flags: [false, true, false, false, true, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied conflicting ownership blocks contract freeze',
  },
  {
    flags: [false, true, false, true, false, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied conflicting ownership blocks contract freeze',
  },
  {
    flags: [false, true, false, true, false, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied conflicting ownership blocks contract freeze',
  },
  {
    flags: [false, true, false, true, true, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied conflicting ownership blocks contract freeze',
  },
  {
    flags: [false, true, false, true, true, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied conflicting ownership blocks contract freeze',
  },
  {
    flags: [false, true, true, false, false, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied conflicting ownership blocks contract freeze',
  },
  {
    flags: [false, true, true, false, false, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied conflicting ownership blocks contract freeze',
  },
  {
    flags: [false, true, true, false, true, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied conflicting ownership blocks contract freeze',
  },
  {
    flags: [false, true, true, false, true, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied conflicting ownership blocks contract freeze',
  },
  {
    flags: [false, true, true, true, false, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied conflicting ownership blocks contract freeze',
  },
  {
    flags: [false, true, true, true, false, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied conflicting ownership blocks contract freeze',
  },
  {
    flags: [false, true, true, true, true, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied conflicting ownership blocks contract freeze',
  },
  {
    flags: [false, true, true, true, true, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied conflicting ownership blocks contract freeze',
  },
  {
    flags: [true, false, false, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied missing required review blocks contract freeze',
  },
  {
    flags: [true, false, false, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied missing required review blocks contract freeze',
  },
  {
    flags: [true, false, false, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied missing required review blocks contract freeze',
  },
  {
    flags: [true, false, false, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied missing required review blocks contract freeze',
  },
  {
    flags: [true, false, false, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied missing required review blocks contract freeze',
  },
  {
    flags: [true, false, false, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied missing required review blocks contract freeze',
  },
  {
    flags: [true, false, false, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied missing required review blocks contract freeze',
  },
  {
    flags: [true, false, false, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied missing required review blocks contract freeze',
  },
  {
    flags: [true, false, true, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied missing required review blocks contract freeze',
  },
  {
    flags: [true, false, true, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied missing required review blocks contract freeze',
  },
  {
    flags: [true, false, true, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied missing required review blocks contract freeze',
  },
  {
    flags: [true, false, true, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied missing required review blocks contract freeze',
  },
  {
    flags: [true, false, true, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied missing required review blocks contract freeze',
  },
  {
    flags: [true, false, true, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied missing required review blocks contract freeze',
  },
  {
    flags: [true, false, true, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied missing required review blocks contract freeze',
  },
  {
    flags: [true, false, true, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied missing required review blocks contract freeze',
  },
  {
    flags: [true, true, false, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied missing required review blocks contract freeze',
  },
  {
    flags: [true, true, false, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied missing required review blocks contract freeze',
  },
  {
    flags: [true, true, false, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied missing required review blocks contract freeze',
  },
  {
    flags: [true, true, false, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied missing required review blocks contract freeze',
  },
  {
    flags: [true, true, false, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied missing required review blocks contract freeze',
  },
  {
    flags: [true, true, false, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied missing required review blocks contract freeze',
  },
  {
    flags: [true, true, false, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied missing required review blocks contract freeze',
  },
  {
    flags: [true, true, false, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied missing required review blocks contract freeze',
  },
  {
    flags: [true, true, true, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied missing required review blocks contract freeze',
  },
  {
    flags: [true, true, true, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied missing required review blocks contract freeze',
  },
  {
    flags: [true, true, true, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied missing required review blocks contract freeze',
  },
  {
    flags: [true, true, true, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied missing required review blocks contract freeze',
  },
  {
    flags: [true, true, true, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied missing required review blocks contract freeze',
  },
  {
    flags: [true, true, true, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied missing required review blocks contract freeze',
  },
  {
    flags: [true, true, true, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied missing required review blocks contract freeze',
  },
  {
    flags: [true, true, true, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CONTRACT-01 supplied missing required review blocks contract freeze',
  },
];

describe('TEST-CONTRACT-01 — checkContractFreeze never freezes contracts', () => {
  it.each(expectedTable)(
    'review=%s ownership=%s money=%s mapping=%s scope=%s compat=%s => $code $status',
    async ({ flags, code, status, retryable, detail }) => {
      const [
        requiredReviewMissing,
        ownershipConflictPresent,
        untypedMoneyPresent,
        unsafeOutcomeMappingPresent,
        unresolvedScopeClaimPresent,
        compatibilityEvidenceMissing,
      ] = flags;
      const input = body(
        requiredReviewMissing,
        ownershipConflictPresent,
        untypedMoneyPresent,
        unsafeOutcomeMappingPresent,
        unresolvedScopeClaimPresent,
        compatibilityEvidenceMissing,
      );
      const context = ctx();
      const first = await checkContractFreeze(context, input);
      const second = await checkContractFreeze(context, input);
      expect(input).toEqual(
        body(
          requiredReviewMissing,
          ownershipConflictPresent,
          untypedMoneyPresent,
          unsafeOutcomeMappingPresent,
          unresolvedScopeClaimPresent,
          compatibilityEvidenceMissing,
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
