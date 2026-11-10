import type { UUID } from '@kita/contracts';
import type { Grow03CommandContext, Grow03Input } from '../../packages/contracts/src/rewards.ts';
import { describe, expect, it } from 'vitest';

import { reservePromotion } from '../../packages/domain/rewards/reserve-promotion.ts';

function ctx(): Grow03CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(lastBudgetUnitReservedTwice: boolean): Grow03Input {
  return { lastBudgetUnitReservedTwice };
}

describe('TEST-GROW-03 — last budget unit reserved by one transfer only', () => {
  it('lastBudgetUnitReservedTwice true => LIMIT_EXCEEDED 409', async () => {
    const receipt = await reservePromotion(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('LIMIT_EXCEEDED');
    expect(receipt.error.status).toBe(409);
  });

  it('otherwise 503 (no reservation; T-REWARD-01 HOLD)', async () => {
    const receipt = await reservePromotion(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
