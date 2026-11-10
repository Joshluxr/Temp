import type { UUID } from '../../packages/contracts/src/context.ts';
import type { Live01CommandContext, Live01Input } from '../../packages/contracts/src/live-pilot-evidence.ts';
import { describe, expect, it } from 'vitest';

import { checkLivePilotEvidence } from '../../packages/platform/check-live-pilot-evidence.ts';

function ctx(): Live01CommandContext {
  return Object.freeze({
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
  });
}

function body(
  requiredReviewMissing: boolean,
  pilotIdentityOrScopeMismatch: boolean,
  pilotCapsOrStopSafetyUnproven: boolean,
  reconciliationOrRemedySafetyUnproven: boolean,
  requiredEvidenceMissing: boolean,
): Live01Input {
  return Object.freeze({
    requiredReviewMissing,
    pilotIdentityOrScopeMismatch,
    pilotCapsOrStopSafetyUnproven,
    reconciliationOrRemedySafetyUnproven,
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
    detail: 'T-LIVE-01 checkLivePilotEvidence cannot verify signed pilot scope or exact candidate, cohort/dates/caps or stop safety, bank/provider/ledger reconciliation, unknown payouts or remedy deadlines, daily close or late-return reserves, current approvals or independent execution evidence: full T-LIVE-01 and T-GA-01 remain HOLD; no live traffic, bank/provider calls or money authorized (fail closed)',
  },
  {
    flags: [false, false, false, false, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-LIVE-01 supplied missing required live pilot execution evidence blocks live pilot evidence',
  },
  {
    flags: [false, false, false, true, false] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-LIVE-01 supplied unproven movement reconciliation, unknown payout, remedy or reserve safety blocks live pilot evidence',
  },
  {
    flags: [false, false, false, true, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-LIVE-01 supplied unproven movement reconciliation, unknown payout, remedy or reserve safety blocks live pilot evidence',
  },
  {
    flags: [false, false, true, false, false] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-LIVE-01 supplied unproven cohort, dates, exposure caps or stop safety blocks live pilot evidence',
  },
  {
    flags: [false, false, true, false, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-LIVE-01 supplied unproven cohort, dates, exposure caps or stop safety blocks live pilot evidence',
  },
  {
    flags: [false, false, true, true, false] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-LIVE-01 supplied unproven cohort, dates, exposure caps or stop safety blocks live pilot evidence',
  },
  {
    flags: [false, false, true, true, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-LIVE-01 supplied unproven cohort, dates, exposure caps or stop safety blocks live pilot evidence',
  },
  {
    flags: [false, true, false, false, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-LIVE-01 supplied pilot identity, exact candidate or authorized scope mismatch blocks live pilot evidence',
  },
  {
    flags: [false, true, false, false, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-LIVE-01 supplied pilot identity, exact candidate or authorized scope mismatch blocks live pilot evidence',
  },
  {
    flags: [false, true, false, true, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-LIVE-01 supplied pilot identity, exact candidate or authorized scope mismatch blocks live pilot evidence',
  },
  {
    flags: [false, true, false, true, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-LIVE-01 supplied pilot identity, exact candidate or authorized scope mismatch blocks live pilot evidence',
  },
  {
    flags: [false, true, true, false, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-LIVE-01 supplied pilot identity, exact candidate or authorized scope mismatch blocks live pilot evidence',
  },
  {
    flags: [false, true, true, false, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-LIVE-01 supplied pilot identity, exact candidate or authorized scope mismatch blocks live pilot evidence',
  },
  {
    flags: [false, true, true, true, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-LIVE-01 supplied pilot identity, exact candidate or authorized scope mismatch blocks live pilot evidence',
  },
  {
    flags: [false, true, true, true, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-LIVE-01 supplied pilot identity, exact candidate or authorized scope mismatch blocks live pilot evidence',
  },
  {
    flags: [true, false, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-LIVE-01 supplied missing required business owner, Controller, Ops, architect or independent review blocks live pilot evidence',
  },
  {
    flags: [true, false, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-LIVE-01 supplied missing required business owner, Controller, Ops, architect or independent review blocks live pilot evidence',
  },
  {
    flags: [true, false, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-LIVE-01 supplied missing required business owner, Controller, Ops, architect or independent review blocks live pilot evidence',
  },
  {
    flags: [true, false, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-LIVE-01 supplied missing required business owner, Controller, Ops, architect or independent review blocks live pilot evidence',
  },
  {
    flags: [true, false, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-LIVE-01 supplied missing required business owner, Controller, Ops, architect or independent review blocks live pilot evidence',
  },
  {
    flags: [true, false, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-LIVE-01 supplied missing required business owner, Controller, Ops, architect or independent review blocks live pilot evidence',
  },
  {
    flags: [true, false, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-LIVE-01 supplied missing required business owner, Controller, Ops, architect or independent review blocks live pilot evidence',
  },
  {
    flags: [true, false, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-LIVE-01 supplied missing required business owner, Controller, Ops, architect or independent review blocks live pilot evidence',
  },
  {
    flags: [true, true, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-LIVE-01 supplied missing required business owner, Controller, Ops, architect or independent review blocks live pilot evidence',
  },
  {
    flags: [true, true, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-LIVE-01 supplied missing required business owner, Controller, Ops, architect or independent review blocks live pilot evidence',
  },
  {
    flags: [true, true, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-LIVE-01 supplied missing required business owner, Controller, Ops, architect or independent review blocks live pilot evidence',
  },
  {
    flags: [true, true, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-LIVE-01 supplied missing required business owner, Controller, Ops, architect or independent review blocks live pilot evidence',
  },
  {
    flags: [true, true, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-LIVE-01 supplied missing required business owner, Controller, Ops, architect or independent review blocks live pilot evidence',
  },
  {
    flags: [true, true, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-LIVE-01 supplied missing required business owner, Controller, Ops, architect or independent review blocks live pilot evidence',
  },
  {
    flags: [true, true, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-LIVE-01 supplied missing required business owner, Controller, Ops, architect or independent review blocks live pilot evidence',
  },
  {
    flags: [true, true, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-LIVE-01 supplied missing required business owner, Controller, Ops, architect or independent review blocks live pilot evidence',
  },
];

describe('TEST-LIVE-01 evidence — checkLivePilotEvidence never accepts a live pilot', () => {
  it.each(expectedTable)(
    'review=%s identity=%s caps=%s reconcile=%s evidence=%s => $code $status',
    async ({ flags, code, status, retryable, detail }) => {
      const [
        requiredReviewMissing,
        pilotIdentityOrScopeMismatch,
        pilotCapsOrStopSafetyUnproven,
        reconciliationOrRemedySafetyUnproven,
        requiredEvidenceMissing,
      ] = flags;
      const input = body(
        requiredReviewMissing,
        pilotIdentityOrScopeMismatch,
        pilotCapsOrStopSafetyUnproven,
        reconciliationOrRemedySafetyUnproven,
        requiredEvidenceMissing,
      );
      const context = ctx();
      const first = await checkLivePilotEvidence(context, input);
      const second = await checkLivePilotEvidence(context, input);
      expect(input).toEqual(
        body(
          requiredReviewMissing,
          pilotIdentityOrScopeMismatch,
          pilotCapsOrStopSafetyUnproven,
          reconciliationOrRemedySafetyUnproven,
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
