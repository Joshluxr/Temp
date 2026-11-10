import type { UUID } from '../../packages/contracts/src/context.ts';
import type { Adapter01CommandContext, Adapter01Input } from '../../packages/contracts/src/adapters.ts';
import { describe, expect, it } from 'vitest';

import { checkAdapterEvidence } from '../../packages/providers/check-adapter-evidence.ts';

function ctx(): Adapter01CommandContext {
  return Object.freeze({
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
  });
}

function body(
  providerAccountMismatch: boolean,
  providerEnvironmentMismatch: boolean,
  signatureMissingOrInvalid: boolean,
  evidenceReplayed: boolean,
  evidencePayloadMismatch: boolean,
): Adapter01Input {
  return Object.freeze({
    providerAccountMismatch,
    providerEnvironmentMismatch,
    signatureMissingOrInvalid,
    evidenceReplayed,
    evidencePayloadMismatch,
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
    detail: 'T-ADAPTER-01 checkAdapterEvidence cannot verify provider evidence or authorize transport: provider contracts and T-CORE-02 remain HOLD (fail closed)',
  },
  {
    flags: [false, false, false, false, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-ADAPTER-01 supplied evidence payload mismatch blocks adapter evidence',
  },
  {
    flags: [false, false, false, true, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-ADAPTER-01 supplied replayed evidence blocks adapter evidence',
  },
  {
    flags: [false, false, false, true, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-ADAPTER-01 supplied replayed evidence blocks adapter evidence',
  },
  {
    flags: [false, false, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-ADAPTER-01 supplied missing or invalid signature blocks adapter evidence',
  },
  {
    flags: [false, false, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-ADAPTER-01 supplied missing or invalid signature blocks adapter evidence',
  },
  {
    flags: [false, false, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-ADAPTER-01 supplied missing or invalid signature blocks adapter evidence',
  },
  {
    flags: [false, false, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-ADAPTER-01 supplied missing or invalid signature blocks adapter evidence',
  },
  {
    flags: [false, true, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-ADAPTER-01 supplied provider environment mismatch blocks adapter evidence',
  },
  {
    flags: [false, true, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-ADAPTER-01 supplied provider environment mismatch blocks adapter evidence',
  },
  {
    flags: [false, true, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-ADAPTER-01 supplied provider environment mismatch blocks adapter evidence',
  },
  {
    flags: [false, true, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-ADAPTER-01 supplied provider environment mismatch blocks adapter evidence',
  },
  {
    flags: [false, true, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-ADAPTER-01 supplied provider environment mismatch blocks adapter evidence',
  },
  {
    flags: [false, true, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-ADAPTER-01 supplied provider environment mismatch blocks adapter evidence',
  },
  {
    flags: [false, true, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-ADAPTER-01 supplied provider environment mismatch blocks adapter evidence',
  },
  {
    flags: [false, true, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-ADAPTER-01 supplied provider environment mismatch blocks adapter evidence',
  },
  {
    flags: [true, false, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-ADAPTER-01 supplied provider account mismatch blocks adapter evidence',
  },
  {
    flags: [true, false, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-ADAPTER-01 supplied provider account mismatch blocks adapter evidence',
  },
  {
    flags: [true, false, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-ADAPTER-01 supplied provider account mismatch blocks adapter evidence',
  },
  {
    flags: [true, false, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-ADAPTER-01 supplied provider account mismatch blocks adapter evidence',
  },
  {
    flags: [true, false, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-ADAPTER-01 supplied provider account mismatch blocks adapter evidence',
  },
  {
    flags: [true, false, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-ADAPTER-01 supplied provider account mismatch blocks adapter evidence',
  },
  {
    flags: [true, false, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-ADAPTER-01 supplied provider account mismatch blocks adapter evidence',
  },
  {
    flags: [true, false, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-ADAPTER-01 supplied provider account mismatch blocks adapter evidence',
  },
  {
    flags: [true, true, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-ADAPTER-01 supplied provider account mismatch blocks adapter evidence',
  },
  {
    flags: [true, true, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-ADAPTER-01 supplied provider account mismatch blocks adapter evidence',
  },
  {
    flags: [true, true, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-ADAPTER-01 supplied provider account mismatch blocks adapter evidence',
  },
  {
    flags: [true, true, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-ADAPTER-01 supplied provider account mismatch blocks adapter evidence',
  },
  {
    flags: [true, true, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-ADAPTER-01 supplied provider account mismatch blocks adapter evidence',
  },
  {
    flags: [true, true, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-ADAPTER-01 supplied provider account mismatch blocks adapter evidence',
  },
  {
    flags: [true, true, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-ADAPTER-01 supplied provider account mismatch blocks adapter evidence',
  },
  {
    flags: [true, true, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-ADAPTER-01 supplied provider account mismatch blocks adapter evidence',
  },

];

describe('TEST-ADAPTER-01 — checkAdapterEvidence never authorizes transport', () => {
  it.each(expectedTable)(
    'account=%s env=%s sig=%s replay=%s payload=%s => $code $status',
    async ({ flags, code, status, retryable, detail }) => {
      const [
        providerAccountMismatch,
        providerEnvironmentMismatch,
        signatureMissingOrInvalid,
        evidenceReplayed,
        evidencePayloadMismatch,
      ] = flags;
      const input = body(
        providerAccountMismatch,
        providerEnvironmentMismatch,
        signatureMissingOrInvalid,
        evidenceReplayed,
        evidencePayloadMismatch,
      );
      const context = ctx();
      const first = await checkAdapterEvidence(context, input);
      const second = await checkAdapterEvidence(context, input);
      expect(input).toEqual(
        body(
          providerAccountMismatch,
          providerEnvironmentMismatch,
          signatureMissingOrInvalid,
          evidenceReplayed,
          evidencePayloadMismatch,
        ),
      );
      expect(context).toEqual(ctx());
      expect(first).toEqual({
        ok: false,
        error: { code, status, retryable, detail },
      });
      expect(second).toEqual(first);
      expect('value' in first).toBe(false);
      expect('kind' in first).toBe(false);
    },
  );
});
