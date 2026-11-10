import type { UUID } from '../../packages/contracts/src/context.ts';
import type { Reward01CommandContext, Reward01Input } from '../../packages/contracts/src/reward-evidence.ts';
import { describe, expect, it } from 'vitest';

import { checkRewardEvidence } from '../../packages/platform/check-reward-evidence.ts';

function ctx(): Reward01CommandContext {
  return Object.freeze({
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
  });
}

function body(
  requiredReviewMissing: boolean,
  rewardIdentityOrPayloadMismatch: boolean,
  pointsConservationOrLotSafetyUnproven: boolean,
  reversalProvisionOrAtomicitySafetyUnproven: boolean,
  requiredEvidenceMissing: boolean,
): Reward01Input {
  return Object.freeze({
    requiredReviewMissing,
    rewardIdentityOrPayloadMismatch,
    pointsConservationOrLotSafetyUnproven,
    reversalProvisionOrAtomicitySafetyUnproven,
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
    detail: 'T-REWARD-01 checkRewardEvidence cannot verify source/rule/lot identity or replay, paired zero-sum noncash units, nonnegative available/reserved lots, FIFO or expiry safety, cumulative reversal limits or noncash reward debt, approved P1/provision policy, atomic reward and provision effects, independent reconstruction or current Finance/Controller review and execution evidence: full T-REWARD-01, T-LEDGER-02, T-FIN-01 and T-CORE-02 remain HOLD (fail closed)',
  },
  {
    flags: [false, false, false, false, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-REWARD-01 supplied missing required reward execution evidence blocks reward evidence',
  },
  {
    flags: [false, false, false, true, false] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-REWARD-01 supplied unproven cumulative reversal, approved provision or atomic reward safety blocks reward evidence',
  },
  {
    flags: [false, false, false, true, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-REWARD-01 supplied unproven cumulative reversal, approved provision or atomic reward safety blocks reward evidence',
  },
  {
    flags: [false, false, true, false, false] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-REWARD-01 supplied unproven paired noncash point conservation, lot availability or reservation safety blocks reward evidence',
  },
  {
    flags: [false, false, true, false, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-REWARD-01 supplied unproven paired noncash point conservation, lot availability or reservation safety blocks reward evidence',
  },
  {
    flags: [false, false, true, true, false] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-REWARD-01 supplied unproven paired noncash point conservation, lot availability or reservation safety blocks reward evidence',
  },
  {
    flags: [false, false, true, true, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-REWARD-01 supplied unproven paired noncash point conservation, lot availability or reservation safety blocks reward evidence',
  },
  {
    flags: [false, true, false, false, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-REWARD-01 supplied reward identity or immutable payload mismatch blocks reward evidence',
  },
  {
    flags: [false, true, false, false, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-REWARD-01 supplied reward identity or immutable payload mismatch blocks reward evidence',
  },
  {
    flags: [false, true, false, true, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-REWARD-01 supplied reward identity or immutable payload mismatch blocks reward evidence',
  },
  {
    flags: [false, true, false, true, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-REWARD-01 supplied reward identity or immutable payload mismatch blocks reward evidence',
  },
  {
    flags: [false, true, true, false, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-REWARD-01 supplied reward identity or immutable payload mismatch blocks reward evidence',
  },
  {
    flags: [false, true, true, false, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-REWARD-01 supplied reward identity or immutable payload mismatch blocks reward evidence',
  },
  {
    flags: [false, true, true, true, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-REWARD-01 supplied reward identity or immutable payload mismatch blocks reward evidence',
  },
  {
    flags: [false, true, true, true, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-REWARD-01 supplied reward identity or immutable payload mismatch blocks reward evidence',
  },
  {
    flags: [true, false, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-REWARD-01 supplied missing required architect, Finance, Controller or independent review blocks reward evidence',
  },
  {
    flags: [true, false, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-REWARD-01 supplied missing required architect, Finance, Controller or independent review blocks reward evidence',
  },
  {
    flags: [true, false, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-REWARD-01 supplied missing required architect, Finance, Controller or independent review blocks reward evidence',
  },
  {
    flags: [true, false, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-REWARD-01 supplied missing required architect, Finance, Controller or independent review blocks reward evidence',
  },
  {
    flags: [true, false, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-REWARD-01 supplied missing required architect, Finance, Controller or independent review blocks reward evidence',
  },
  {
    flags: [true, false, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-REWARD-01 supplied missing required architect, Finance, Controller or independent review blocks reward evidence',
  },
  {
    flags: [true, false, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-REWARD-01 supplied missing required architect, Finance, Controller or independent review blocks reward evidence',
  },
  {
    flags: [true, false, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-REWARD-01 supplied missing required architect, Finance, Controller or independent review blocks reward evidence',
  },
  {
    flags: [true, true, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-REWARD-01 supplied missing required architect, Finance, Controller or independent review blocks reward evidence',
  },
  {
    flags: [true, true, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-REWARD-01 supplied missing required architect, Finance, Controller or independent review blocks reward evidence',
  },
  {
    flags: [true, true, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-REWARD-01 supplied missing required architect, Finance, Controller or independent review blocks reward evidence',
  },
  {
    flags: [true, true, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-REWARD-01 supplied missing required architect, Finance, Controller or independent review blocks reward evidence',
  },
  {
    flags: [true, true, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-REWARD-01 supplied missing required architect, Finance, Controller or independent review blocks reward evidence',
  },
  {
    flags: [true, true, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-REWARD-01 supplied missing required architect, Finance, Controller or independent review blocks reward evidence',
  },
  {
    flags: [true, true, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-REWARD-01 supplied missing required architect, Finance, Controller or independent review blocks reward evidence',
  },
  {
    flags: [true, true, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-REWARD-01 supplied missing required architect, Finance, Controller or independent review blocks reward evidence',
  },
];

describe('TEST-REWARD-01 evidence — checkRewardEvidence never accepts rewards', () => {
  it.each(expectedTable)(
    'review=%s identity=%s lots=%s provision=%s evidence=%s => $code $status',
    async ({ flags, code, status, retryable, detail }) => {
      const [
        requiredReviewMissing,
        rewardIdentityOrPayloadMismatch,
        pointsConservationOrLotSafetyUnproven,
        reversalProvisionOrAtomicitySafetyUnproven,
        requiredEvidenceMissing,
      ] = flags;
      const input = body(
        requiredReviewMissing,
        rewardIdentityOrPayloadMismatch,
        pointsConservationOrLotSafetyUnproven,
        reversalProvisionOrAtomicitySafetyUnproven,
        requiredEvidenceMissing,
      );
      const context = ctx();
      const first = await checkRewardEvidence(context, input);
      const second = await checkRewardEvidence(context, input);
      expect(input).toEqual(
        body(
          requiredReviewMissing,
          rewardIdentityOrPayloadMismatch,
          pointsConservationOrLotSafetyUnproven,
          reversalProvisionOrAtomicitySafetyUnproven,
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
