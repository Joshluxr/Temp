import type { Instant, UUID, WorkerContext } from '@kita/contracts';
import type { Ext03Input } from '../../packages/contracts/src/business.ts';
import { describe, expect, it } from 'vitest';

import { verifyBusiness } from '../../packages/domain/business/verify-business.ts';

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

function body(flags: Pick<Ext03Input, 'individualKycOnly' | 'kybPresent' | 'signatoriesPresent'>): Ext03Input {
  return {
    worker: {
      workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
      attemptGeneration: 1,
      correlationId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' as UUID,
    },
    businessId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' as UUID,
    ...flags,
  };
}

describe('TEST-EXT-03 — individual KYC cannot authorize business payout', () => {
  it('individualKycOnly true => APPROVAL_REQUIRED 409 even if kyb/signatories flags set', async () => {
    const receipt = await verifyBusiness(
      workerContext(),
      body({ individualKycOnly: true, kybPresent: true, signatoriesPresent: true }),
    );
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('APPROVAL_REQUIRED');
    expect(receipt.error.status).toBe(409);
    expect(receipt.error.retryable).toBe(false);
  });

  it('individualKycOnly true with no KYB => APPROVAL_REQUIRED 409', async () => {
    const receipt = await verifyBusiness(
      workerContext(),
      body({ individualKycOnly: true, kybPresent: false, signatoriesPresent: false }),
    );
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('APPROVAL_REQUIRED');
  });

  it('kybPresent and signatoriesPresent without individual-only still 503', async () => {
    const receipt = await verifyBusiness(
      workerContext(),
      body({ individualKycOnly: false, kybPresent: true, signatoriesPresent: true }),
    );
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
    expect(receipt.error.retryable).toBe(true);
  });

  it('all flags false still 503 (does not authorize payout)', async () => {
    const receipt = await verifyBusiness(
      workerContext(),
      body({ individualKycOnly: false, kybPresent: false, signatoriesPresent: false }),
    );
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
  });
});
