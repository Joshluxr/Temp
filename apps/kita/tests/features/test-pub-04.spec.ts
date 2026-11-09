import type { UUID } from '@kita/contracts';
import type { Pub01CommandContext, Pub04Input } from '../../packages/contracts/src/catalog.ts';
import { describe, expect, it } from 'vitest';

import { describeDelivery } from '../../packages/domain/catalog/describe-delivery.ts';

function ctx(): Pub01CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(feeOrDeadlineMismatch: boolean): Pub04Input {
  return { feeOrDeadlineMismatch };
}

describe('TEST-PUB-04 — fee and deadline must agree with accepted terms', () => {
  it('feeOrDeadlineMismatch true => POLICY_UNAVAILABLE 409', async () => {
    const receipt = await describeDelivery(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('POLICY_UNAVAILABLE');
    expect(receipt.error.status).toBe(409);
  });

  it('matching terms still 503 (pricing/calendar store unimplemented)', async () => {
    const receipt = await describeDelivery(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
