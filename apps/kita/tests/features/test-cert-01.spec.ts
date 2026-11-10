import type { UUID } from '../../packages/contracts/src/context.ts';
import type { Cert01CommandContext, Cert01Input } from '../../packages/contracts/src/certification-evidence.ts';
import { describe, expect, it } from 'vitest';

import { checkCertificationEvidence } from '../../packages/platform/check-certification-evidence.ts';

function ctx(): Cert01CommandContext {
  return Object.freeze({
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
  });
}

function body(
  requiredAcknowledgmentOrReviewMissing: boolean,
  scopeMismatch: boolean,
  evidenceStale: boolean,
  requiredSandboxEvidenceMissing: boolean,
  requiredSdkDeviceEvidenceMissing: boolean,
  unsupportedCaseClaimedPassed: boolean,
): Cert01Input {
  return Object.freeze({
    requiredAcknowledgmentOrReviewMissing,
    scopeMismatch,
    evidenceStale,
    requiredSandboxEvidenceMissing,
    requiredSdkDeviceEvidenceMissing,
    unsupportedCaseClaimedPassed,
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
    detail: 'T-CERT-01 checkCertificationEvidence cannot verify scoped candidate/provider/account/method identity, freshness, required acknowledgment or review, real sandbox evidence, SDK/device proof or unsupported-case restrictions: full T-CERT-01 remains HOLD (fail closed)',
  },
  {
    flags: [false, false, false, false, false, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-CERT-01 supplied unsupported certification case claimed passed blocks certification evidence',
  },
  {
    flags: [false, false, false, false, true, false] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-CERT-01 supplied missing required SDK or device evidence blocks certification evidence',
  },
  {
    flags: [false, false, false, false, true, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-CERT-01 supplied missing required SDK or device evidence blocks certification evidence',
  },
  {
    flags: [false, false, false, true, false, false] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-CERT-01 supplied missing required real sandbox evidence blocks certification evidence',
  },
  {
    flags: [false, false, false, true, false, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-CERT-01 supplied missing required real sandbox evidence blocks certification evidence',
  },
  {
    flags: [false, false, false, true, true, false] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-CERT-01 supplied missing required real sandbox evidence blocks certification evidence',
  },
  {
    flags: [false, false, false, true, true, true] as const,
    code: 'invalid_request',
    status: 400,
    retryable: false,
    detail: 'T-CERT-01 supplied missing required real sandbox evidence blocks certification evidence',
  },
  {
    flags: [false, false, true, false, false, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CERT-01 supplied stale certification evidence blocks certification evidence',
  },
  {
    flags: [false, false, true, false, false, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CERT-01 supplied stale certification evidence blocks certification evidence',
  },
  {
    flags: [false, false, true, false, true, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CERT-01 supplied stale certification evidence blocks certification evidence',
  },
  {
    flags: [false, false, true, false, true, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CERT-01 supplied stale certification evidence blocks certification evidence',
  },
  {
    flags: [false, false, true, true, false, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CERT-01 supplied stale certification evidence blocks certification evidence',
  },
  {
    flags: [false, false, true, true, false, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CERT-01 supplied stale certification evidence blocks certification evidence',
  },
  {
    flags: [false, false, true, true, true, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CERT-01 supplied stale certification evidence blocks certification evidence',
  },
  {
    flags: [false, false, true, true, true, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CERT-01 supplied stale certification evidence blocks certification evidence',
  },
  {
    flags: [false, true, false, false, false, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CERT-01 supplied certification scope mismatch blocks certification evidence',
  },
  {
    flags: [false, true, false, false, false, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CERT-01 supplied certification scope mismatch blocks certification evidence',
  },
  {
    flags: [false, true, false, false, true, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CERT-01 supplied certification scope mismatch blocks certification evidence',
  },
  {
    flags: [false, true, false, false, true, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CERT-01 supplied certification scope mismatch blocks certification evidence',
  },
  {
    flags: [false, true, false, true, false, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CERT-01 supplied certification scope mismatch blocks certification evidence',
  },
  {
    flags: [false, true, false, true, false, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CERT-01 supplied certification scope mismatch blocks certification evidence',
  },
  {
    flags: [false, true, false, true, true, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CERT-01 supplied certification scope mismatch blocks certification evidence',
  },
  {
    flags: [false, true, false, true, true, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CERT-01 supplied certification scope mismatch blocks certification evidence',
  },
  {
    flags: [false, true, true, false, false, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CERT-01 supplied certification scope mismatch blocks certification evidence',
  },
  {
    flags: [false, true, true, false, false, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CERT-01 supplied certification scope mismatch blocks certification evidence',
  },
  {
    flags: [false, true, true, false, true, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CERT-01 supplied certification scope mismatch blocks certification evidence',
  },
  {
    flags: [false, true, true, false, true, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CERT-01 supplied certification scope mismatch blocks certification evidence',
  },
  {
    flags: [false, true, true, true, false, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CERT-01 supplied certification scope mismatch blocks certification evidence',
  },
  {
    flags: [false, true, true, true, false, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CERT-01 supplied certification scope mismatch blocks certification evidence',
  },
  {
    flags: [false, true, true, true, true, false] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CERT-01 supplied certification scope mismatch blocks certification evidence',
  },
  {
    flags: [false, true, true, true, true, true] as const,
    code: 'stale_or_conflicting_command',
    status: 409,
    retryable: false,
    detail: 'T-CERT-01 supplied certification scope mismatch blocks certification evidence',
  },
  {
    flags: [true, false, false, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CERT-01 supplied missing required provider acknowledgment or certification review blocks certification evidence',
  },
  {
    flags: [true, false, false, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CERT-01 supplied missing required provider acknowledgment or certification review blocks certification evidence',
  },
  {
    flags: [true, false, false, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CERT-01 supplied missing required provider acknowledgment or certification review blocks certification evidence',
  },
  {
    flags: [true, false, false, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CERT-01 supplied missing required provider acknowledgment or certification review blocks certification evidence',
  },
  {
    flags: [true, false, false, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CERT-01 supplied missing required provider acknowledgment or certification review blocks certification evidence',
  },
  {
    flags: [true, false, false, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CERT-01 supplied missing required provider acknowledgment or certification review blocks certification evidence',
  },
  {
    flags: [true, false, false, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CERT-01 supplied missing required provider acknowledgment or certification review blocks certification evidence',
  },
  {
    flags: [true, false, false, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CERT-01 supplied missing required provider acknowledgment or certification review blocks certification evidence',
  },
  {
    flags: [true, false, true, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CERT-01 supplied missing required provider acknowledgment or certification review blocks certification evidence',
  },
  {
    flags: [true, false, true, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CERT-01 supplied missing required provider acknowledgment or certification review blocks certification evidence',
  },
  {
    flags: [true, false, true, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CERT-01 supplied missing required provider acknowledgment or certification review blocks certification evidence',
  },
  {
    flags: [true, false, true, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CERT-01 supplied missing required provider acknowledgment or certification review blocks certification evidence',
  },
  {
    flags: [true, false, true, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CERT-01 supplied missing required provider acknowledgment or certification review blocks certification evidence',
  },
  {
    flags: [true, false, true, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CERT-01 supplied missing required provider acknowledgment or certification review blocks certification evidence',
  },
  {
    flags: [true, false, true, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CERT-01 supplied missing required provider acknowledgment or certification review blocks certification evidence',
  },
  {
    flags: [true, false, true, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CERT-01 supplied missing required provider acknowledgment or certification review blocks certification evidence',
  },
  {
    flags: [true, true, false, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CERT-01 supplied missing required provider acknowledgment or certification review blocks certification evidence',
  },
  {
    flags: [true, true, false, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CERT-01 supplied missing required provider acknowledgment or certification review blocks certification evidence',
  },
  {
    flags: [true, true, false, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CERT-01 supplied missing required provider acknowledgment or certification review blocks certification evidence',
  },
  {
    flags: [true, true, false, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CERT-01 supplied missing required provider acknowledgment or certification review blocks certification evidence',
  },
  {
    flags: [true, true, false, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CERT-01 supplied missing required provider acknowledgment or certification review blocks certification evidence',
  },
  {
    flags: [true, true, false, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CERT-01 supplied missing required provider acknowledgment or certification review blocks certification evidence',
  },
  {
    flags: [true, true, false, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CERT-01 supplied missing required provider acknowledgment or certification review blocks certification evidence',
  },
  {
    flags: [true, true, false, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CERT-01 supplied missing required provider acknowledgment or certification review blocks certification evidence',
  },
  {
    flags: [true, true, true, false, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CERT-01 supplied missing required provider acknowledgment or certification review blocks certification evidence',
  },
  {
    flags: [true, true, true, false, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CERT-01 supplied missing required provider acknowledgment or certification review blocks certification evidence',
  },
  {
    flags: [true, true, true, false, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CERT-01 supplied missing required provider acknowledgment or certification review blocks certification evidence',
  },
  {
    flags: [true, true, true, false, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CERT-01 supplied missing required provider acknowledgment or certification review blocks certification evidence',
  },
  {
    flags: [true, true, true, true, false, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CERT-01 supplied missing required provider acknowledgment or certification review blocks certification evidence',
  },
  {
    flags: [true, true, true, true, false, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CERT-01 supplied missing required provider acknowledgment or certification review blocks certification evidence',
  },
  {
    flags: [true, true, true, true, true, false] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CERT-01 supplied missing required provider acknowledgment or certification review blocks certification evidence',
  },
  {
    flags: [true, true, true, true, true, true] as const,
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-CERT-01 supplied missing required provider acknowledgment or certification review blocks certification evidence',
  },
];

describe('TEST-CERT-01 — checkCertificationEvidence never certifies', () => {
  it.each(expectedTable)(
    'ack=%s scope=%s stale=%s sandbox=%s sdk=%s unsupported=%s => $code $status',
    async ({ flags, code, status, retryable, detail }) => {
      const [
        requiredAcknowledgmentOrReviewMissing,
        scopeMismatch,
        evidenceStale,
        requiredSandboxEvidenceMissing,
        requiredSdkDeviceEvidenceMissing,
        unsupportedCaseClaimedPassed,
      ] = flags;
      const input = body(
        requiredAcknowledgmentOrReviewMissing,
        scopeMismatch,
        evidenceStale,
        requiredSandboxEvidenceMissing,
        requiredSdkDeviceEvidenceMissing,
        unsupportedCaseClaimedPassed,
      );
      const context = ctx();
      const first = await checkCertificationEvidence(context, input);
      const second = await checkCertificationEvidence(context, input);
      expect(input).toEqual(
        body(
          requiredAcknowledgmentOrReviewMissing,
          scopeMismatch,
          evidenceStale,
          requiredSandboxEvidenceMissing,
          requiredSdkDeviceEvidenceMissing,
          unsupportedCaseClaimedPassed,
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
