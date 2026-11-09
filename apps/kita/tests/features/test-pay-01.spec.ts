import type { UUID } from '@kita/contracts';
import type { Pay01Input, Pay06CommandContext } from '../../packages/contracts/src/payouts.ts';
import { describe, expect, it } from 'vitest';

import { routePayout } from '../../packages/domain/payouts/route-payout.ts';

function ctx(): Pay06CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(unknownFirstProviderWouldDispatchSecond: boolean): Pay01Input {
  return { unknownFirstProviderWouldDispatchSecond };
}

describe('TEST-PAY-01 — unknown first provider blocks second payout', () => {
  it('unknownFirstProviderWouldDispatchSecond true => PROVIDER_OUTCOME_UNKNOWN 409', async () => {
    const receipt = await routePayout(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('PROVIDER_OUTCOME_UNKNOWN');
    expect(receipt.error.status).toBe(409);
  });

  it('known-first path still 503 (no payout dispatch)', async () => {
    const receipt = await routePayout(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
