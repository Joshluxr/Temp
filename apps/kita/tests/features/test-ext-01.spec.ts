import type { Instant, UUID, WorkerContext } from '@kita/contracts';
import type { Ext01Input } from '../../packages/contracts/src/extensions.ts';
import { describe, expect, it } from 'vitest';

import {
  EU_EEA_COUNTRIES,
  evaluateMarketPermission,
} from '../../packages/domain/extensions/evaluate-market-permission.ts';

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

function body(origin: string, dest: string, product = 'remittance'): Ext01Input {
  return {
    worker: {
      workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
      attemptGeneration: 1,
      correlationId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' as UUID,
    },
    originCountry: origin,
    destinationCountry: dest,
    product,
  };
}

describe('TEST-EXT-01 — unapproved markets stay disabled; US→PH not live', () => {
  const denied: Array<[string, string, string]> = [
    ['CA', 'PH', 'CA origin'],
    ['US', 'CA', 'CA destination'],
    ['GB', 'PH', 'UK/GB origin'],
    ['UK', 'PH', 'UK alias'],
    ['JP', 'PH', 'JP origin'],
    ['SG', 'PH', 'SG origin'],
    ['AU', 'PH', 'AU origin'],
    ['US', 'JP', 'JP destination'],
    ['DE', 'PH', 'EU/EEA origin'],
    ['US', 'FR', 'EU/EEA destination'],
    ['NO', 'PH', 'EEA origin'],
    ['US', 'MX', 'non US→PH corridor'],
    ['US', 'PH', 'wrong product'],
  ];

  it('sample wrong product US→PH bill-pay is CAPABILITY_UNAVAILABLE', async () => {
    const receipt = await evaluateMarketPermission(workerContext(), body('US', 'PH', 'bill-pay'));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('CAPABILITY_UNAVAILABLE');
    expect(receipt.error.status).toBe(409);
    expect(receipt.error.retryable).toBe(false);
  });

  for (const [origin, dest, name] of denied.slice(0, 12)) {
    it(`${name} (${origin}→${dest}) => CAPABILITY_UNAVAILABLE 409`, async () => {
      const receipt = await evaluateMarketPermission(workerContext(), body(origin, dest));
      expect(receipt.ok).toBe(false);
      if (receipt.ok) return;
      expect(receipt.error.code).toBe('CAPABILITY_UNAVAILABLE');
      expect(receipt.error.status).toBe(409);
      expect(receipt.error.retryable).toBe(false);
    });
  }

  it('intended US→PH remittance => 503 dependency_unavailable (T-DEPEND-01)', async () => {
    const receipt = await evaluateMarketPermission(workerContext(), body('US', 'PH', 'remittance'));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
    expect(receipt.error.retryable).toBe(true);
    expect(receipt.error.detail).toMatch(/T-DEPEND-01/);
  });

  it('EU/EEA set includes DE FR NO and excludes US PH', () => {
    expect(EU_EEA_COUNTRIES.has('DE')).toBe(true);
    expect(EU_EEA_COUNTRIES.has('FR')).toBe(true);
    expect(EU_EEA_COUNTRIES.has('NO')).toBe(true);
    expect(EU_EEA_COUNTRIES.has('US')).toBe(false);
    expect(EU_EEA_COUNTRIES.has('PH')).toBe(false);
  });
});
