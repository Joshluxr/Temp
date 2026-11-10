import type { UUID } from '../../packages/contracts/src/context.ts';
import type { Core02CommandContext, Core02Input } from '../../packages/contracts/src/durable-command-evidence.ts';
import { describe, expect, it } from 'vitest';

import { checkDurableCommandEvidence } from '../../packages/platform/check-durable-command-evidence.ts';

function ctx(): Core02CommandContext {
  return Object.freeze({
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
  });
}

function body(
  requiredReviewMissing: boolean,
  commandIdentityOrPayloadMismatch: boolean,
  durableAuthoritySafetyUnproven: boolean,
  subjectHoldOrLimitSafetyUnproven: boolean,
  requiredEvidenceMissing: boolean,
): Core02Input {
  return Object.freeze({
    requiredReviewMissing,
    commandIdentityOrPayloadMismatch,
    durableAuthoritySafetyUnproven,
    subjectHoldOrLimitSafetyUnproven,
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
    detail: 'T-CORE-02 checkDurableCommandEvidence cannot verify durable commands, idempotency or response recovery, scoped ownership, fenced authority, subject holds, limit buckets, atomic command/state/event/outbox/audit or current independent review and execution evidence: full T-CORE-02 remains HOLD (fail closed)',
  },
  {
    flags: [false, false, false, false, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-CORE-02 supplied missing required durable command execution evidence blocks durable command evidence',
  },
  {
    flags: [false, false, false, true, false] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-CORE-02 supplied unproven subject hold or limit safety blocks durable command evidence',
  },
  {
    flags: [false, false, false, true, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-CORE-02 supplied unproven subject hold or limit safety blocks durable command evidence',
  },
  {
    flags: [false, false, true, false, false] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-CORE-02 supplied unproven durable command or fenced authority safety blocks durable command evidence',
  },
  {
    flags: [false, false, true, false, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-CORE-02 supplied unproven durable command or fenced authority safety blocks durable command evidence',
  },
  {
    flags: [false, false, true, true, false] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-CORE-02 supplied unproven durable command or fenced authority safety blocks durable command evidence',
  },
  {
    flags: [false, false, true, true, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-CORE-02 supplied unproven durable command or fenced authority safety blocks durable command evidence',
  },
  {
    flags: [false, true, false, false, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CORE-02 supplied command identity or immutable payload mismatch blocks durable command evidence',
  },
  {
    flags: [false, true, false, false, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CORE-02 supplied command identity or immutable payload mismatch blocks durable command evidence',
  },
  {
    flags: [false, true, false, true, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CORE-02 supplied command identity or immutable payload mismatch blocks durable command evidence',
  },
  {
    flags: [false, true, false, true, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CORE-02 supplied command identity or immutable payload mismatch blocks durable command evidence',
  },
  {
    flags: [false, true, true, false, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CORE-02 supplied command identity or immutable payload mismatch blocks durable command evidence',
  },
  {
    flags: [false, true, true, false, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CORE-02 supplied command identity or immutable payload mismatch blocks durable command evidence',
  },
  {
    flags: [false, true, true, true, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CORE-02 supplied command identity or immutable payload mismatch blocks durable command evidence',
  },
  {
    flags: [false, true, true, true, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CORE-02 supplied command identity or immutable payload mismatch blocks durable command evidence',
  },
  {
    flags: [true, false, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CORE-02 supplied missing required architect or independent review blocks durable command evidence',
  },
  {
    flags: [true, false, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CORE-02 supplied missing required architect or independent review blocks durable command evidence',
  },
  {
    flags: [true, false, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CORE-02 supplied missing required architect or independent review blocks durable command evidence',
  },
  {
    flags: [true, false, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CORE-02 supplied missing required architect or independent review blocks durable command evidence',
  },
  {
    flags: [true, false, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CORE-02 supplied missing required architect or independent review blocks durable command evidence',
  },
  {
    flags: [true, false, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CORE-02 supplied missing required architect or independent review blocks durable command evidence',
  },
  {
    flags: [true, false, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CORE-02 supplied missing required architect or independent review blocks durable command evidence',
  },
  {
    flags: [true, false, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CORE-02 supplied missing required architect or independent review blocks durable command evidence',
  },
  {
    flags: [true, true, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CORE-02 supplied missing required architect or independent review blocks durable command evidence',
  },
  {
    flags: [true, true, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CORE-02 supplied missing required architect or independent review blocks durable command evidence',
  },
  {
    flags: [true, true, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CORE-02 supplied missing required architect or independent review blocks durable command evidence',
  },
  {
    flags: [true, true, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CORE-02 supplied missing required architect or independent review blocks durable command evidence',
  },
  {
    flags: [true, true, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CORE-02 supplied missing required architect or independent review blocks durable command evidence',
  },
  {
    flags: [true, true, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CORE-02 supplied missing required architect or independent review blocks durable command evidence',
  },
  {
    flags: [true, true, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CORE-02 supplied missing required architect or independent review blocks durable command evidence',
  },
  {
    flags: [true, true, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CORE-02 supplied missing required architect or independent review blocks durable command evidence',
  },
];

describe('TEST-CORE-02 evidence — checkDurableCommandEvidence never accepts durable commands', () => {
  it.each(expectedTable)(
    'review=%s identity=%s authority=%s hold=%s evidence=%s => $code $status',
    async ({ flags, code, status, retryable, detail }) => {
      const [
        requiredReviewMissing,
        commandIdentityOrPayloadMismatch,
        durableAuthoritySafetyUnproven,
        subjectHoldOrLimitSafetyUnproven,
        requiredEvidenceMissing,
      ] = flags;
      const input = body(
        requiredReviewMissing,
        commandIdentityOrPayloadMismatch,
        durableAuthoritySafetyUnproven,
        subjectHoldOrLimitSafetyUnproven,
        requiredEvidenceMissing,
      );
      const context = ctx();
      const first = await checkDurableCommandEvidence(context, input);
      const second = await checkDurableCommandEvidence(context, input);
      expect(input).toEqual(
        body(
          requiredReviewMissing,
          commandIdentityOrPayloadMismatch,
          durableAuthoritySafetyUnproven,
          subjectHoldOrLimitSafetyUnproven,
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
