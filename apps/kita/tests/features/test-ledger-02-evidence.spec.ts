import type { UUID } from '../../packages/contracts/src/context.ts';
import type { Ledger02CommandContext, Ledger02Input } from '../../packages/contracts/src/posting-authority-evidence.ts';
import { describe, expect, it } from 'vitest';

import { checkPostingAuthorityEvidence } from '../../packages/platform/check-posting-authority-evidence.ts';

function ctx(): Ledger02CommandContext {
  return Object.freeze({
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
  });
}

function body(
  requiredReviewMissing: boolean,
  postingIdentityOrPayloadMismatch: boolean,
  templateEvidenceOrPeriodSafetyUnproven: boolean,
  correctionAllocationOrAtomicitySafetyUnproven: boolean,
  requiredEvidenceMissing: boolean,
): Ledger02Input {
  return Object.freeze({
    requiredReviewMissing,
    postingIdentityOrPayloadMismatch,
    templateEvidenceOrPeriodSafetyUnproven,
    correctionAllocationOrAtomicitySafetyUnproven,
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
    detail: 'T-LEDGER-02 checkPostingAuthorityEvidence cannot verify scoped event identity or replay, approved templates and active evidence, open nonoverlapping periods, balanced immutable journals, nonnegative balances or cumulative correction/allocation limits, event-key serialization or atomic posting, independent reconstruction or current Controller review and execution evidence: full T-LEDGER-02, T-FIN-01 and T-CORE-02 remain HOLD (fail closed)',
  },
  {
    flags: [false, false, false, false, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-LEDGER-02 supplied missing required posting authority execution evidence blocks posting authority evidence',
  },
  {
    flags: [false, false, false, true, false] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-LEDGER-02 supplied unproven correction allocation, nonnegative balance or atomic posting safety blocks posting authority evidence',
  },
  {
    flags: [false, false, false, true, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-LEDGER-02 supplied unproven correction allocation, nonnegative balance or atomic posting safety blocks posting authority evidence',
  },
  {
    flags: [false, false, true, false, false] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-LEDGER-02 supplied unproven approved template, active evidence or period safety blocks posting authority evidence',
  },
  {
    flags: [false, false, true, false, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-LEDGER-02 supplied unproven approved template, active evidence or period safety blocks posting authority evidence',
  },
  {
    flags: [false, false, true, true, false] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-LEDGER-02 supplied unproven approved template, active evidence or period safety blocks posting authority evidence',
  },
  {
    flags: [false, false, true, true, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-LEDGER-02 supplied unproven approved template, active evidence or period safety blocks posting authority evidence',
  },
  {
    flags: [false, true, false, false, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-LEDGER-02 supplied posting identity or immutable payload mismatch blocks posting authority evidence',
  },
  {
    flags: [false, true, false, false, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-LEDGER-02 supplied posting identity or immutable payload mismatch blocks posting authority evidence',
  },
  {
    flags: [false, true, false, true, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-LEDGER-02 supplied posting identity or immutable payload mismatch blocks posting authority evidence',
  },
  {
    flags: [false, true, false, true, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-LEDGER-02 supplied posting identity or immutable payload mismatch blocks posting authority evidence',
  },
  {
    flags: [false, true, true, false, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-LEDGER-02 supplied posting identity or immutable payload mismatch blocks posting authority evidence',
  },
  {
    flags: [false, true, true, false, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-LEDGER-02 supplied posting identity or immutable payload mismatch blocks posting authority evidence',
  },
  {
    flags: [false, true, true, true, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-LEDGER-02 supplied posting identity or immutable payload mismatch blocks posting authority evidence',
  },
  {
    flags: [false, true, true, true, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-LEDGER-02 supplied posting identity or immutable payload mismatch blocks posting authority evidence',
  },
  {
    flags: [true, false, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-LEDGER-02 supplied missing required architect, Controller or independent review blocks posting authority evidence',
  },
  {
    flags: [true, false, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-LEDGER-02 supplied missing required architect, Controller or independent review blocks posting authority evidence',
  },
  {
    flags: [true, false, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-LEDGER-02 supplied missing required architect, Controller or independent review blocks posting authority evidence',
  },
  {
    flags: [true, false, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-LEDGER-02 supplied missing required architect, Controller or independent review blocks posting authority evidence',
  },
  {
    flags: [true, false, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-LEDGER-02 supplied missing required architect, Controller or independent review blocks posting authority evidence',
  },
  {
    flags: [true, false, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-LEDGER-02 supplied missing required architect, Controller or independent review blocks posting authority evidence',
  },
  {
    flags: [true, false, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-LEDGER-02 supplied missing required architect, Controller or independent review blocks posting authority evidence',
  },
  {
    flags: [true, false, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-LEDGER-02 supplied missing required architect, Controller or independent review blocks posting authority evidence',
  },
  {
    flags: [true, true, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-LEDGER-02 supplied missing required architect, Controller or independent review blocks posting authority evidence',
  },
  {
    flags: [true, true, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-LEDGER-02 supplied missing required architect, Controller or independent review blocks posting authority evidence',
  },
  {
    flags: [true, true, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-LEDGER-02 supplied missing required architect, Controller or independent review blocks posting authority evidence',
  },
  {
    flags: [true, true, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-LEDGER-02 supplied missing required architect, Controller or independent review blocks posting authority evidence',
  },
  {
    flags: [true, true, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-LEDGER-02 supplied missing required architect, Controller or independent review blocks posting authority evidence',
  },
  {
    flags: [true, true, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-LEDGER-02 supplied missing required architect, Controller or independent review blocks posting authority evidence',
  },
  {
    flags: [true, true, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-LEDGER-02 supplied missing required architect, Controller or independent review blocks posting authority evidence',
  },
  {
    flags: [true, true, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-LEDGER-02 supplied missing required architect, Controller or independent review blocks posting authority evidence',
  },
];

describe('TEST-LEDGER-02 evidence — checkPostingAuthorityEvidence never accepts posting', () => {
  it.each(expectedTable)(
    'review=%s identity=%s template=%s allocation=%s evidence=%s => $code $status',
    async ({ flags, code, status, retryable, detail }) => {
      const [
        requiredReviewMissing,
        postingIdentityOrPayloadMismatch,
        templateEvidenceOrPeriodSafetyUnproven,
        correctionAllocationOrAtomicitySafetyUnproven,
        requiredEvidenceMissing,
      ] = flags;
      const input = body(
        requiredReviewMissing,
        postingIdentityOrPayloadMismatch,
        templateEvidenceOrPeriodSafetyUnproven,
        correctionAllocationOrAtomicitySafetyUnproven,
        requiredEvidenceMissing,
      );
      const context = ctx();
      const first = await checkPostingAuthorityEvidence(context, input);
      const second = await checkPostingAuthorityEvidence(context, input);
      expect(input).toEqual(
        body(
          requiredReviewMissing,
          postingIdentityOrPayloadMismatch,
          templateEvidenceOrPeriodSafetyUnproven,
          correctionAllocationOrAtomicitySafetyUnproven,
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
