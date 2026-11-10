import type { UUID } from '@kita/contracts';
import type { Grow09CommandContext, Grow09Input } from '../../packages/contracts/src/rewards.ts';
import { describe, expect, it } from 'vitest';

import { reportRewardLiability } from '../../packages/domain/rewards/report-reward-liability.ts';

function ctx(): Grow09CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(issuedVestedRedeemedExpiredDisagreeProvision: boolean): Grow09Input {
  return { issuedVestedRedeemedExpiredDisagreeProvision };
}

describe('TEST-GROW-09 — issued/vested/redeemed/expired totals reconcile to provision', () => {
  it('issuedVestedRedeemedExpiredDisagreeProvision true => VERSION_CONFLICT 409', async () => {
    const receipt = await reportRewardLiability(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('VERSION_CONFLICT');
    expect(receipt.error.status).toBe(409);
  });

  it('otherwise 503 (no fiat implication; T-REWARD-01 HOLD)', async () => {
    const receipt = await reportRewardLiability(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
