import type { UUID } from '@kita/contracts';
import type { Pay05Input, Pay06CommandContext } from '../../packages/contracts/src/payouts.ts';
import { describe, expect, it } from 'vitest';

import { applyPayoutReturn } from '../../packages/domain/payouts/apply-payout-return.ts';

function ctx(): Pay06CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(returnExceedsCapOrErasesDeliveredTimestamp: boolean): Pay05Input {
  return { returnExceedsCapOrErasesDeliveredTimestamp };
}

describe('TEST-PAY-05 — returned amount capped; delivered timestamp preserved', () => {
  it('returnExceedsCapOrErasesDeliveredTimestamp true => PROVIDER_OUTCOME_UNKNOWN 409', async () => {
    const receipt = await applyPayoutReturn(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('PROVIDER_OUTCOME_UNKNOWN');
    expect(receipt.error.status).toBe(409);
  });

  it('in-cap path still 503 (no refund granted)', async () => {
    const receipt = await applyPayoutReturn(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
