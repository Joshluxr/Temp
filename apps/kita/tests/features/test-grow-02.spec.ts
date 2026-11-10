import type { UUID } from '@kita/contracts';
import type { Grow02CommandContext, Grow02Input } from '../../packages/contracts/src/rewards.ts';
import { describe, expect, it } from 'vitest';

import { reservePoints } from '../../packages/domain/rewards/reserve-points.ts';

function ctx(): Grow02CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(concurrentRedemptionExpiryOverspend: boolean): Grow02Input {
  return { concurrentRedemptionExpiryOverspend };
}

describe('TEST-GROW-02 — concurrent redemption/expiry cannot overspend lot', () => {
  it('concurrentRedemptionExpiryOverspend true => INSUFFICIENT_FUNDS 409', async () => {
    const receipt = await reservePoints(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('INSUFFICIENT_FUNDS');
    expect(receipt.error.status).toBe(409);
  });

  it('otherwise 503 (no reservation; T-REWARD-01 HOLD)', async () => {
    const receipt = await reservePoints(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
