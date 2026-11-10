import type { UUID } from '../../packages/contracts/src/context.ts';
import type { Ga01CommandContext, Ga01Input } from '../../packages/contracts/src/launch-evidence.ts';
import { describe, expect, it } from 'vitest';

import { checkLaunchEvidence } from '../../packages/platform/check-launch-evidence.ts';

function ctx(): Ga01CommandContext {
  return Object.freeze({
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
  });
}

function body(
  requiredReviewMissing: boolean,
  launchIdentityOrScopeMismatch: boolean,
  pilotExitOrReconciliationUnproven: boolean,
  stagedExposureOrOperationalSafetyUnproven: boolean,
  requiredEvidenceMissing: boolean,
): Ga01Input {
  return Object.freeze({
    requiredReviewMissing,
    launchIdentityOrScopeMismatch,
    pilotExitOrReconciliationUnproven,
    stagedExposureOrOperationalSafetyUnproven,
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
    detail: 'T-GA-01 checkLaunchEvidence cannot verify signed launch scope or exact candidate, current G1-G5 evidence or reconciled pilot exit, staged caps or stop safety, staffing/liquidity/concentration/SLO/incident/renewal controls, capacity/security/recovery or independent approvals and execution evidence: full T-GA-01 and T-LIVE-01 remain HOLD; no launch, production, live traffic, bank/provider calls or money authorized (fail closed)',
  },
  {
    flags: [false, false, false, false, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-GA-01 supplied missing required current exact-artifact launch evidence blocks launch evidence',
  },
  {
    flags: [false, false, false, true, false] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-GA-01 supplied unproven staged exposure caps, stop safety or operational readiness blocks launch evidence',
  },
  {
    flags: [false, false, false, true, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-GA-01 supplied unproven staged exposure caps, stop safety or operational readiness blocks launch evidence',
  },
  {
    flags: [false, false, true, false, false] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-GA-01 supplied unproven reconciled pilot exit, unknown payout, remedy or reserve safety blocks launch evidence',
  },
  {
    flags: [false, false, true, false, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-GA-01 supplied unproven reconciled pilot exit, unknown payout, remedy or reserve safety blocks launch evidence',
  },
  {
    flags: [false, false, true, true, false] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-GA-01 supplied unproven reconciled pilot exit, unknown payout, remedy or reserve safety blocks launch evidence',
  },
  {
    flags: [false, false, true, true, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-GA-01 supplied unproven reconciled pilot exit, unknown payout, remedy or reserve safety blocks launch evidence',
  },
  {
    flags: [false, true, false, false, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-GA-01 supplied launch identity, exact candidate or authorized scope mismatch blocks launch evidence',
  },
  {
    flags: [false, true, false, false, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-GA-01 supplied launch identity, exact candidate or authorized scope mismatch blocks launch evidence',
  },
  {
    flags: [false, true, false, true, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-GA-01 supplied launch identity, exact candidate or authorized scope mismatch blocks launch evidence',
  },
  {
    flags: [false, true, false, true, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-GA-01 supplied launch identity, exact candidate or authorized scope mismatch blocks launch evidence',
  },
  {
    flags: [false, true, true, false, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-GA-01 supplied launch identity, exact candidate or authorized scope mismatch blocks launch evidence',
  },
  {
    flags: [false, true, true, false, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-GA-01 supplied launch identity, exact candidate or authorized scope mismatch blocks launch evidence',
  },
  {
    flags: [false, true, true, true, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-GA-01 supplied launch identity, exact candidate or authorized scope mismatch blocks launch evidence',
  },
  {
    flags: [false, true, true, true, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-GA-01 supplied launch identity, exact candidate or authorized scope mismatch blocks launch evidence',
  },
  {
    flags: [true, false, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-GA-01 supplied missing required business owner, architect, Finance, Compliance, Security or independent review blocks launch evidence',
  },
  {
    flags: [true, false, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-GA-01 supplied missing required business owner, architect, Finance, Compliance, Security or independent review blocks launch evidence',
  },
  {
    flags: [true, false, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-GA-01 supplied missing required business owner, architect, Finance, Compliance, Security or independent review blocks launch evidence',
  },
  {
    flags: [true, false, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-GA-01 supplied missing required business owner, architect, Finance, Compliance, Security or independent review blocks launch evidence',
  },
  {
    flags: [true, false, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-GA-01 supplied missing required business owner, architect, Finance, Compliance, Security or independent review blocks launch evidence',
  },
  {
    flags: [true, false, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-GA-01 supplied missing required business owner, architect, Finance, Compliance, Security or independent review blocks launch evidence',
  },
  {
    flags: [true, false, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-GA-01 supplied missing required business owner, architect, Finance, Compliance, Security or independent review blocks launch evidence',
  },
  {
    flags: [true, false, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-GA-01 supplied missing required business owner, architect, Finance, Compliance, Security or independent review blocks launch evidence',
  },
  {
    flags: [true, true, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-GA-01 supplied missing required business owner, architect, Finance, Compliance, Security or independent review blocks launch evidence',
  },
  {
    flags: [true, true, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-GA-01 supplied missing required business owner, architect, Finance, Compliance, Security or independent review blocks launch evidence',
  },
  {
    flags: [true, true, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-GA-01 supplied missing required business owner, architect, Finance, Compliance, Security or independent review blocks launch evidence',
  },
  {
    flags: [true, true, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-GA-01 supplied missing required business owner, architect, Finance, Compliance, Security or independent review blocks launch evidence',
  },
  {
    flags: [true, true, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-GA-01 supplied missing required business owner, architect, Finance, Compliance, Security or independent review blocks launch evidence',
  },
  {
    flags: [true, true, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-GA-01 supplied missing required business owner, architect, Finance, Compliance, Security or independent review blocks launch evidence',
  },
  {
    flags: [true, true, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-GA-01 supplied missing required business owner, architect, Finance, Compliance, Security or independent review blocks launch evidence',
  },
  {
    flags: [true, true, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-GA-01 supplied missing required business owner, architect, Finance, Compliance, Security or independent review blocks launch evidence',
  },
];

describe('TEST-GA-01 evidence — checkLaunchEvidence never accepts launch', () => {
  it.each(expectedTable)(
    'review=%s identity=%s pilot=%s exposure=%s evidence=%s => $code $status',
    async ({ flags, code, status, retryable, detail }) => {
      const [
        requiredReviewMissing,
        launchIdentityOrScopeMismatch,
        pilotExitOrReconciliationUnproven,
        stagedExposureOrOperationalSafetyUnproven,
        requiredEvidenceMissing,
      ] = flags;
      const input = body(
        requiredReviewMissing,
        launchIdentityOrScopeMismatch,
        pilotExitOrReconciliationUnproven,
        stagedExposureOrOperationalSafetyUnproven,
        requiredEvidenceMissing,
      );
      const context = ctx();
      const first = await checkLaunchEvidence(context, input);
      const second = await checkLaunchEvidence(context, input);
      expect(input).toEqual(
        body(
          requiredReviewMissing,
          launchIdentityOrScopeMismatch,
          pilotExitOrReconciliationUnproven,
          stagedExposureOrOperationalSafetyUnproven,
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
