import type { UUID } from '../../packages/contracts/src/context.ts';
import type { Fin01CommandContext, Fin01Input } from '../../packages/contracts/src/ledger-evidence.ts';
import { describe, expect, it } from 'vitest';

import { checkLedgerEvidence } from '../../packages/platform/check-ledger-evidence.ts';

function ctx(): Fin01CommandContext {
  return Object.freeze({
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
  });
}

function body(
  requiredReviewMissing: boolean,
  ledgerIdentityOrPayloadMismatch: boolean,
  journalIntegritySafetyUnproven: boolean,
  postingPolicyOrPeriodSafetyUnproven: boolean,
  requiredEvidenceMissing: boolean,
): Fin01Input {
  return Object.freeze({
    requiredReviewMissing,
    ledgerIdentityOrPayloadMismatch,
    journalIntegritySafetyUnproven,
    postingPolicyOrPeriodSafetyUnproven,
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
    detail: 'T-FIN-01 checkLedgerEvidence cannot verify nonempty balanced single-currency immutable journals, scoped evidence and event-key replay, approved posting policies or periods, nonnegative balances or allocation limits, atomic posting or current independent Controller review and execution evidence: full T-FIN-01, T-CORE-02 and T-LEDGER-02 remain HOLD (fail closed)',
  },
  {
    flags: [false, false, false, false, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-FIN-01 supplied missing required ledger execution evidence blocks ledger evidence',
  },
  {
    flags: [false, false, false, true, false] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-FIN-01 supplied unproven posting policy, period or atomic authority safety blocks ledger evidence',
  },
  {
    flags: [false, false, false, true, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-FIN-01 supplied unproven posting policy, period or atomic authority safety blocks ledger evidence',
  },
  {
    flags: [false, false, true, false, false] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-FIN-01 supplied unproven nonempty, balanced, single-currency or immutable journal safety blocks ledger evidence',
  },
  {
    flags: [false, false, true, false, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-FIN-01 supplied unproven nonempty, balanced, single-currency or immutable journal safety blocks ledger evidence',
  },
  {
    flags: [false, false, true, true, false] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-FIN-01 supplied unproven nonempty, balanced, single-currency or immutable journal safety blocks ledger evidence',
  },
  {
    flags: [false, false, true, true, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-FIN-01 supplied unproven nonempty, balanced, single-currency or immutable journal safety blocks ledger evidence',
  },
  {
    flags: [false, true, false, false, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-FIN-01 supplied ledger identity or immutable payload mismatch blocks ledger evidence',
  },
  {
    flags: [false, true, false, false, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-FIN-01 supplied ledger identity or immutable payload mismatch blocks ledger evidence',
  },
  {
    flags: [false, true, false, true, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-FIN-01 supplied ledger identity or immutable payload mismatch blocks ledger evidence',
  },
  {
    flags: [false, true, false, true, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-FIN-01 supplied ledger identity or immutable payload mismatch blocks ledger evidence',
  },
  {
    flags: [false, true, true, false, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-FIN-01 supplied ledger identity or immutable payload mismatch blocks ledger evidence',
  },
  {
    flags: [false, true, true, false, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-FIN-01 supplied ledger identity or immutable payload mismatch blocks ledger evidence',
  },
  {
    flags: [false, true, true, true, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-FIN-01 supplied ledger identity or immutable payload mismatch blocks ledger evidence',
  },
  {
    flags: [false, true, true, true, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-FIN-01 supplied ledger identity or immutable payload mismatch blocks ledger evidence',
  },
  {
    flags: [true, false, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-FIN-01 supplied missing required architect, Controller or independent review blocks ledger evidence',
  },
  {
    flags: [true, false, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-FIN-01 supplied missing required architect, Controller or independent review blocks ledger evidence',
  },
  {
    flags: [true, false, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-FIN-01 supplied missing required architect, Controller or independent review blocks ledger evidence',
  },
  {
    flags: [true, false, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-FIN-01 supplied missing required architect, Controller or independent review blocks ledger evidence',
  },
  {
    flags: [true, false, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-FIN-01 supplied missing required architect, Controller or independent review blocks ledger evidence',
  },
  {
    flags: [true, false, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-FIN-01 supplied missing required architect, Controller or independent review blocks ledger evidence',
  },
  {
    flags: [true, false, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-FIN-01 supplied missing required architect, Controller or independent review blocks ledger evidence',
  },
  {
    flags: [true, false, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-FIN-01 supplied missing required architect, Controller or independent review blocks ledger evidence',
  },
  {
    flags: [true, true, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-FIN-01 supplied missing required architect, Controller or independent review blocks ledger evidence',
  },
  {
    flags: [true, true, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-FIN-01 supplied missing required architect, Controller or independent review blocks ledger evidence',
  },
  {
    flags: [true, true, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-FIN-01 supplied missing required architect, Controller or independent review blocks ledger evidence',
  },
  {
    flags: [true, true, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-FIN-01 supplied missing required architect, Controller or independent review blocks ledger evidence',
  },
  {
    flags: [true, true, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-FIN-01 supplied missing required architect, Controller or independent review blocks ledger evidence',
  },
  {
    flags: [true, true, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-FIN-01 supplied missing required architect, Controller or independent review blocks ledger evidence',
  },
  {
    flags: [true, true, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-FIN-01 supplied missing required architect, Controller or independent review blocks ledger evidence',
  },
  {
    flags: [true, true, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-FIN-01 supplied missing required architect, Controller or independent review blocks ledger evidence',
  },
];

describe('TEST-FIN-01 evidence — checkLedgerEvidence never accepts a ledger', () => {
  it.each(expectedTable)(
    'review=%s identity=%s journal=%s period=%s evidence=%s => $code $status',
    async ({ flags, code, status, retryable, detail }) => {
      const [
        requiredReviewMissing,
        ledgerIdentityOrPayloadMismatch,
        journalIntegritySafetyUnproven,
        postingPolicyOrPeriodSafetyUnproven,
        requiredEvidenceMissing,
      ] = flags;
      const input = body(
        requiredReviewMissing,
        ledgerIdentityOrPayloadMismatch,
        journalIntegritySafetyUnproven,
        postingPolicyOrPeriodSafetyUnproven,
        requiredEvidenceMissing,
      );
      const context = ctx();
      const first = await checkLedgerEvidence(context, input);
      const second = await checkLedgerEvidence(context, input);
      expect(input).toEqual(
        body(
          requiredReviewMissing,
          ledgerIdentityOrPayloadMismatch,
          journalIntegritySafetyUnproven,
          postingPolicyOrPeriodSafetyUnproven,
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
