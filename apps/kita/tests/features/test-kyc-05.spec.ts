import type { Instant, UUID, WorkerContext } from '@kita/contracts';
import type { Kyc05Input } from '../../packages/contracts/src/compliance.ts';
import { describe, expect, it } from 'vitest';

import { rescreenDelta } from '../../packages/domain/compliance/rescreen-delta.ts';

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

function body(newListHit: boolean): Kyc05Input {
  return {
    worker: {
      workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
      attemptGeneration: 1,
      correlationId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' as UUID,
    },
    subjectId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' as UUID,
    newListHit,
  };
}

describe('TEST-KYC-05 — new list hit stops queued payout before dispatch', () => {
  it('newListHit true => COMPLIANCE_HOLD 409 (not dispatched)', async () => {
    const receipt = await rescreenDelta(workerContext(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('COMPLIANCE_HOLD');
    expect(receipt.error.status).toBe(409);
    expect(receipt.error.retryable).toBe(false);
  });

  it('newListHit false => 503 (does not dispatch)', async () => {
    const receipt = await rescreenDelta(workerContext(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
