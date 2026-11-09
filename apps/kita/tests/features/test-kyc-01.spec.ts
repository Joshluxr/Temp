import type { Instant, UUID, WorkerContext } from '@kita/contracts';
import type { Kyc01Input } from '../../packages/contracts/src/compliance.ts';
import { describe, expect, it } from 'vitest';

import { startIdentity } from '../../packages/domain/compliance/start-identity.ts';

function workerContext(): WorkerContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    correlationId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' as UUID,
    startedAt: '2026-11-09T00:00:00.000Z' as Instant,
    trace: () => undefined,
    capability: async () => ({ ok: true as const, value: false }),
  };
}

function body(captureCallbackReceived: boolean): Kyc01Input {
  return {
    worker: {
      workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
      attemptGeneration: 1,
      correlationId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' as UUID,
    },
    subjectId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' as UUID,
    captureCallbackReceived,
  };
}

describe('TEST-KYC-01 — capture callback alone never approves customer', () => {
  it('captureCallbackReceived true => COMPLIANCE_HOLD 409 (not approved)', async () => {
    const receipt = await startIdentity(workerContext(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('COMPLIANCE_HOLD');
    expect(receipt.error.status).toBe(409);
    expect(receipt.error.retryable).toBe(false);
  });

  it('no callback => 503 dependency_unavailable (session not implemented)', async () => {
    const receipt = await startIdentity(workerContext(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
    expect(receipt.error.retryable).toBe(true);
  });
});
