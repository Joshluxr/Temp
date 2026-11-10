import type { UUID } from '@kita/contracts';
import type { Fin06CommandContext, Fin06Input } from '../../packages/contracts/src/treasury.ts';
import { describe, expect, it } from 'vitest';

import { allocateFxTrade } from '../../packages/domain/treasury/allocate-fx-trade.ts';

function ctx(): Fin06CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(customerTermsDriftFromTradeAllocation: boolean): Fin06Input {
  return { customerTermsDriftFromTradeAllocation };
}

describe('TEST-FIN-06 — trade allocations must not drift customer terms', () => {
  it('customerTermsDriftFromTradeAllocation true => POLICY_UNAVAILABLE 409', async () => {
    const receipt = await allocateFxTrade(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('POLICY_UNAVAILABLE');
    expect(receipt.error.status).toBe(409);
  });

  it('otherwise 503 (no allocation; T-FIN-01 HOLD)', async () => {
    const receipt = await allocateFxTrade(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
