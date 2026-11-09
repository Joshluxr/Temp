import type { Instant, UUID, WorkerContext } from '@kita/contracts';
import type { Kyc03Input } from '../../packages/contracts/src/compliance.ts';
import { describe, expect, it } from 'vitest';

import { quarantineUpload } from '../../packages/domain/compliance/quarantine-upload.ts';

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

function body(infectedOrMalicious: boolean): Kyc03Input {
  return {
    worker: {
      workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
      attemptGeneration: 1,
      correlationId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' as UUID,
    },
    documentId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' as UUID,
    infectedOrMalicious,
  };
}

describe('TEST-KYC-03 — infected upload never reaches analyst viewer', () => {
  it('infectedOrMalicious true => SECURITY_FAILURE 409, no access URL', async () => {
    const receipt = await quarantineUpload(workerContext(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('SECURITY_FAILURE');
    expect(receipt.error.status).toBe(409);
    expect(receipt.error.retryable).toBe(false);
    expect(JSON.stringify(receipt.error)).not.toMatch(/https?:\/\//);
  });

  it('clean upload still 503 and no short-lived URL', async () => {
    const receipt = await quarantineUpload(workerContext(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
    expect(JSON.stringify(receipt)).not.toMatch(/https?:\/\//);
  });
});
