import type { UUID } from '../../packages/contracts/src/context.ts';
import type { Identity01CommandContext, Identity01Input } from '../../packages/contracts/src/auth.ts';
import { describe, expect, it } from 'vitest';

import { checkIdentityBinding } from '../../packages/domain/identity/check-identity-binding.ts';

function ctx(): Identity01CommandContext {
  return Object.freeze({
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
  });
}

function body(
  identityOwnershipMismatch: boolean,
  identityEvidenceReplayed: boolean,
  identityChallengeExpired: boolean,
  refreshTokenReused: boolean,
  unsafeReturnUri: boolean,
): Identity01Input {
  return Object.freeze({
    identityOwnershipMismatch,
    identityEvidenceReplayed,
    identityChallengeExpired,
    refreshTokenReused,
    unsafeReturnUri,
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
    detail:
      'T-IDENTITY-01 checkIdentityBinding cannot verify identity or bind a session: identity stores and T-CORE-02 remain HOLD (fail closed)',
  },
  {
    flags: [false, false, false, false, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-IDENTITY-01 supplied unsafe return URI blocks binding',
  },
  {
    flags: [false, false, false, true, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-IDENTITY-01 supplied reused refresh token blocks binding',
  },
  {
    flags: [false, false, false, true, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-IDENTITY-01 supplied reused refresh token blocks binding',
  },
  {
    flags: [false, false, true, false, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-IDENTITY-01 supplied expired identity challenge blocks binding',
  },
  {
    flags: [false, false, true, false, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-IDENTITY-01 supplied expired identity challenge blocks binding',
  },
  {
    flags: [false, false, true, true, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-IDENTITY-01 supplied expired identity challenge blocks binding',
  },
  {
    flags: [false, false, true, true, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-IDENTITY-01 supplied expired identity challenge blocks binding',
  },
  {
    flags: [false, true, false, false, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-IDENTITY-01 supplied replayed identity evidence blocks binding',
  },
  {
    flags: [false, true, false, false, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-IDENTITY-01 supplied replayed identity evidence blocks binding',
  },
  {
    flags: [false, true, false, true, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-IDENTITY-01 supplied replayed identity evidence blocks binding',
  },
  {
    flags: [false, true, false, true, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-IDENTITY-01 supplied replayed identity evidence blocks binding',
  },
  {
    flags: [false, true, true, false, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-IDENTITY-01 supplied replayed identity evidence blocks binding',
  },
  {
    flags: [false, true, true, false, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-IDENTITY-01 supplied replayed identity evidence blocks binding',
  },
  {
    flags: [false, true, true, true, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-IDENTITY-01 supplied replayed identity evidence blocks binding',
  },
  {
    flags: [false, true, true, true, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-IDENTITY-01 supplied replayed identity evidence blocks binding',
  },
  {
    flags: [true, false, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-IDENTITY-01 supplied identity ownership mismatch blocks binding',
  },
  {
    flags: [true, false, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-IDENTITY-01 supplied identity ownership mismatch blocks binding',
  },
  {
    flags: [true, false, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-IDENTITY-01 supplied identity ownership mismatch blocks binding',
  },
  {
    flags: [true, false, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-IDENTITY-01 supplied identity ownership mismatch blocks binding',
  },
  {
    flags: [true, false, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-IDENTITY-01 supplied identity ownership mismatch blocks binding',
  },
  {
    flags: [true, false, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-IDENTITY-01 supplied identity ownership mismatch blocks binding',
  },
  {
    flags: [true, false, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-IDENTITY-01 supplied identity ownership mismatch blocks binding',
  },
  {
    flags: [true, false, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-IDENTITY-01 supplied identity ownership mismatch blocks binding',
  },
  {
    flags: [true, true, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-IDENTITY-01 supplied identity ownership mismatch blocks binding',
  },
  {
    flags: [true, true, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-IDENTITY-01 supplied identity ownership mismatch blocks binding',
  },
  {
    flags: [true, true, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-IDENTITY-01 supplied identity ownership mismatch blocks binding',
  },
  {
    flags: [true, true, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-IDENTITY-01 supplied identity ownership mismatch blocks binding',
  },
  {
    flags: [true, true, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-IDENTITY-01 supplied identity ownership mismatch blocks binding',
  },
  {
    flags: [true, true, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-IDENTITY-01 supplied identity ownership mismatch blocks binding',
  },
  {
    flags: [true, true, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-IDENTITY-01 supplied identity ownership mismatch blocks binding',
  },
  {
    flags: [true, true, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-IDENTITY-01 supplied identity ownership mismatch blocks binding',
  },
];

describe('TEST-IDENTITY-01 — checkIdentityBinding never binds a session', () => {
  it.each(expectedTable)(
    'mismatch=%s replay=%s expired=%s reused=%s unsafeUri=%s => $code $status',
    async ({ flags, code, status, retryable, detail }) => {
      const [
        identityOwnershipMismatch,
        identityEvidenceReplayed,
        identityChallengeExpired,
        refreshTokenReused,
        unsafeReturnUri,
      ] = flags;
      const input = body(
        identityOwnershipMismatch,
        identityEvidenceReplayed,
        identityChallengeExpired,
        refreshTokenReused,
        unsafeReturnUri,
      );
      const context = ctx();
      const first = await checkIdentityBinding(context, input);
      const second = await checkIdentityBinding(context, input);
      expect(input).toEqual(
        body(
          identityOwnershipMismatch,
          identityEvidenceReplayed,
          identityChallengeExpired,
          refreshTokenReused,
          unsafeReturnUri,
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
