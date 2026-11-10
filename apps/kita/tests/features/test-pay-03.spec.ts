import type { UUID } from '@kita/contracts';
import type { Pay03Input, Pay06CommandContext } from '../../packages/contracts/src/payouts.ts';
import { describe, expect, it } from 'vitest';

import { applyWalletPayout } from '../../packages/domain/payouts/apply-wallet-payout.ts';

function ctx(): Pay06CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(acceptedRequestMarksRecipientCredited: boolean): Pay03Input {
  return { acceptedRequestMarksRecipientCredited };
}

describe('TEST-PAY-03 — accepted request is not recipient credited', () => {
  it('acceptedRequestMarksRecipientCredited true => PROVIDER_OUTCOME_UNKNOWN 409', async () => {
    const receipt = await applyWalletPayout(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('PROVIDER_OUTCOME_UNKNOWN');
    expect(receipt.error.status).toBe(409);
  });

  it('credited-proof path still 503 (no GCash/Maya dispatch)', async () => {
    const receipt = await applyWalletPayout(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
