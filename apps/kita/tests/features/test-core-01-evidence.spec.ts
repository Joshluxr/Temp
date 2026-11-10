import type { UUID } from '../../packages/contracts/src/context.ts';
import type { Core01CommandContext, Core01Input } from '../../packages/contracts/src/core-evidence.ts';
import { describe, expect, it } from 'vitest';

import { checkCoreEvidence } from '../../packages/platform/check-core-evidence.ts';

function ctx(): Core01CommandContext {
  return Object.freeze({
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
  });
}

function body(
  requiredReviewMissing: boolean,
  compositionBoundaryMismatch: boolean,
  runtimeBindingsMissingOrUnsafe: boolean,
  transactionOrPoolSafetyUnproven: boolean,
  requiredEvidenceMissing: boolean,
): Core01Input {
  return Object.freeze({
    requiredReviewMissing,
    compositionBoundaryMismatch,
    runtimeBindingsMissingOrUnsafe,
    transactionOrPoolSafetyUnproven,
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
    detail: 'T-CORE-01 checkCoreEvidence cannot verify target/API/server-client boundaries, safe runtime bindings, pool isolation, serializable rollback/commit/retry/cleanup behavior, least-privilege roles or current independent review and execution evidence: full T-CORE-01 remains HOLD (fail closed)',
  },
  {
    flags: [false, false, false, false, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-CORE-01 supplied missing required core execution evidence blocks core evidence',
  },
  {
    flags: [false, false, false, true, false] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-CORE-01 supplied unproven transaction or pool safety blocks core evidence',
  },
  {
    flags: [false, false, false, true, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-CORE-01 supplied unproven transaction or pool safety blocks core evidence',
  },
  {
    flags: [false, false, true, false, false] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-CORE-01 supplied missing or unsafe runtime bindings block core evidence',
  },
  {
    flags: [false, false, true, false, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-CORE-01 supplied missing or unsafe runtime bindings block core evidence',
  },
  {
    flags: [false, false, true, true, false] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-CORE-01 supplied missing or unsafe runtime bindings block core evidence',
  },
  {
    flags: [false, false, true, true, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-CORE-01 supplied missing or unsafe runtime bindings block core evidence',
  },
  {
    flags: [false, true, false, false, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CORE-01 supplied target/API/server-client composition boundary mismatch blocks core evidence',
  },
  {
    flags: [false, true, false, false, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CORE-01 supplied target/API/server-client composition boundary mismatch blocks core evidence',
  },
  {
    flags: [false, true, false, true, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CORE-01 supplied target/API/server-client composition boundary mismatch blocks core evidence',
  },
  {
    flags: [false, true, false, true, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CORE-01 supplied target/API/server-client composition boundary mismatch blocks core evidence',
  },
  {
    flags: [false, true, true, false, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CORE-01 supplied target/API/server-client composition boundary mismatch blocks core evidence',
  },
  {
    flags: [false, true, true, false, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CORE-01 supplied target/API/server-client composition boundary mismatch blocks core evidence',
  },
  {
    flags: [false, true, true, true, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CORE-01 supplied target/API/server-client composition boundary mismatch blocks core evidence',
  },
  {
    flags: [false, true, true, true, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CORE-01 supplied target/API/server-client composition boundary mismatch blocks core evidence',
  },
  {
    flags: [true, false, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CORE-01 supplied missing required architect or independent review blocks core evidence',
  },
  {
    flags: [true, false, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CORE-01 supplied missing required architect or independent review blocks core evidence',
  },
  {
    flags: [true, false, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CORE-01 supplied missing required architect or independent review blocks core evidence',
  },
  {
    flags: [true, false, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CORE-01 supplied missing required architect or independent review blocks core evidence',
  },
  {
    flags: [true, false, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CORE-01 supplied missing required architect or independent review blocks core evidence',
  },
  {
    flags: [true, false, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CORE-01 supplied missing required architect or independent review blocks core evidence',
  },
  {
    flags: [true, false, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CORE-01 supplied missing required architect or independent review blocks core evidence',
  },
  {
    flags: [true, false, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CORE-01 supplied missing required architect or independent review blocks core evidence',
  },
  {
    flags: [true, true, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CORE-01 supplied missing required architect or independent review blocks core evidence',
  },
  {
    flags: [true, true, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CORE-01 supplied missing required architect or independent review blocks core evidence',
  },
  {
    flags: [true, true, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CORE-01 supplied missing required architect or independent review blocks core evidence',
  },
  {
    flags: [true, true, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CORE-01 supplied missing required architect or independent review blocks core evidence',
  },
  {
    flags: [true, true, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CORE-01 supplied missing required architect or independent review blocks core evidence',
  },
  {
    flags: [true, true, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CORE-01 supplied missing required architect or independent review blocks core evidence',
  },
  {
    flags: [true, true, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CORE-01 supplied missing required architect or independent review blocks core evidence',
  },
  {
    flags: [true, true, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CORE-01 supplied missing required architect or independent review blocks core evidence',
  },
];

describe('TEST-CORE-01 evidence — checkCoreEvidence never accepts core runtime', () => {
  it.each(expectedTable)(
    'review=%s composition=%s bindings=%s pool=%s evidence=%s => $code $status',
    async ({ flags, code, status, retryable, detail }) => {
      const [
        requiredReviewMissing,
        compositionBoundaryMismatch,
        runtimeBindingsMissingOrUnsafe,
        transactionOrPoolSafetyUnproven,
        requiredEvidenceMissing,
      ] = flags;
      const input = body(
        requiredReviewMissing,
        compositionBoundaryMismatch,
        runtimeBindingsMissingOrUnsafe,
        transactionOrPoolSafetyUnproven,
        requiredEvidenceMissing,
      );
      const context = ctx();
      const first = await checkCoreEvidence(context, input);
      const second = await checkCoreEvidence(context, input);
      expect(input).toEqual(
        body(
          requiredReviewMissing,
          compositionBoundaryMismatch,
          runtimeBindingsMissingOrUnsafe,
          transactionOrPoolSafetyUnproven,
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
      expect('value' in first).toBe(false);
    },
  );
});
