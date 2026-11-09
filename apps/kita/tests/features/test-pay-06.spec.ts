import type { UUID } from '@kita/contracts';
import type { Pay06CommandContext, Pay06Input } from '../../packages/contracts/src/payouts.ts';
import { describe, expect, it } from 'vitest';

import { applyBillPosting } from '../../packages/domain/payouts/apply-bill-posting.ts';

function ctx(): Pay06CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(aggregatorAcceptedMarksBillPaid: boolean): Pay06Input {
  return { aggregatorAcceptedMarksBillPaid };
}

describe('TEST-PAY-06 — aggregator accepted does not mark bill paid', () => {
  it('aggregatorAcceptedMarksBillPaid true => CAPABILITY_UNAVAILABLE 409', async () => {
    const receipt = await applyBillPosting(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('CAPABILITY_UNAVAILABLE');
    expect(receipt.error.status).toBe(409);
  });

  it('proof-required path still 503 (no payout posted)', async () => {
    const receipt = await applyBillPosting(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
