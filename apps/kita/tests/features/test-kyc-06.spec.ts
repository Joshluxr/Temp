import type { Instant, UUID, WorkerContext } from '@kita/contracts';
import type { Kyc06Input } from '../../packages/contracts/src/compliance.ts';
import { describe, expect, it } from 'vitest';

import { evaluateRisk } from '../../packages/domain/compliance/evaluate-risk.ts';

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

function body(wouldExceedAggregateLimit: boolean): Kyc06Input {
  return {
    worker: {
      workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
      attemptGeneration: 1,
      correlationId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' as UUID,
    },
    subjectId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' as UUID,
    wouldExceedAggregateLimit,
  };
}

describe('TEST-KYC-06 — concurrent transfers cannot exceed aggregate limit', () => {
  it('wouldExceedAggregateLimit true => LIMIT_EXCEEDED 409', async () => {
    const receipt = await evaluateRisk(workerContext(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('LIMIT_EXCEEDED');
    expect(receipt.error.status).toBe(409);
    expect(receipt.error.retryable).toBe(false);
  });

  it('wouldExceedAggregateLimit false => 503 (does not reserve)', async () => {
    const receipt = await evaluateRisk(workerContext(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });

  it('concurrent invocations all fail closed (none authorize)', async () => {
    const results = await Promise.all([
      evaluateRisk(workerContext(), body(true)),
      evaluateRisk(workerContext(), body(true)),
      evaluateRisk(workerContext(), body(false)),
      evaluateRisk(workerContext(), body(false)),
    ]);
    expect(results.every((r) => r.ok === false)).toBe(true);
  });
});
