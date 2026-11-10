import type { UUID } from '@kita/contracts';
import type { Grow01CommandContext, Grow01Input } from '../../packages/contracts/src/rewards.ts';
import { describe, expect, it } from 'vitest';

import { vestPoints } from '../../packages/domain/rewards/vest-points.ts';

function ctx(): Grow01CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(duplicatePayoutCallbackAwardsTwice: boolean): Grow01Input {
  return { duplicatePayoutCallbackAwardsTwice };
}

describe('TEST-GROW-01 — duplicate payout callback awards once', () => {
  it('duplicatePayoutCallbackAwardsTwice true => POLICY_UNAVAILABLE 409', async () => {
    const receipt = await vestPoints(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('POLICY_UNAVAILABLE');
    expect(receipt.error.status).toBe(409);
  });

  it('otherwise 503 (no points awarded; T-REWARD-01 HOLD)', async () => {
    const receipt = await vestPoints(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
