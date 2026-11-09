import type { Instant, UUID, WorkerContext } from '@kita/contracts';
import type { Kyc04Input } from '../../packages/contracts/src/compliance.ts';
import { describe, expect, it } from 'vitest';

import { evaluateScreening } from '../../packages/domain/compliance/evaluate-screening.ts';

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

function body(listUnavailable: boolean, listStale: boolean): Kyc04Input {
  return {
    worker: {
      workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
      attemptGeneration: 1,
      correlationId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' as UUID,
    },
    subjectId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' as UUID,
    listUnavailable,
    listStale,
  };
}

describe('TEST-KYC-04 — unavailable or stale list cannot silently pass', () => {
  it('listUnavailable => COMPLIANCE_HOLD 409', async () => {
    const receipt = await evaluateScreening(workerContext(), body(true, false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('COMPLIANCE_HOLD');
    expect(receipt.error.status).toBe(409);
    expect(receipt.error.retryable).toBe(false);
  });

  it('listStale => COMPLIANCE_HOLD 409', async () => {
    const receipt = await evaluateScreening(workerContext(), body(false, true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('COMPLIANCE_HOLD');
    expect(receipt.error.status).toBe(409);
  });

  it('both unavailable and stale => COMPLIANCE_HOLD 409', async () => {
    const receipt = await evaluateScreening(workerContext(), body(true, true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('COMPLIANCE_HOLD');
  });

  it('fresh list still 503 (no silent clear / payout pass)', async () => {
    const receipt = await evaluateScreening(workerContext(), body(false, false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
    expect(receipt.error.retryable).toBe(true);
  });
});
