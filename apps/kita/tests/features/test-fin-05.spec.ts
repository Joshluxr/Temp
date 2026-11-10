import type { UUID } from '@kita/contracts';
import type { Fin05CommandContext, Fin05Input } from '../../packages/contracts/src/treasury.ts';
import { describe, expect, it } from 'vitest';

import { reserveLiquidity } from '../../packages/domain/treasury/reserve-liquidity.ts';

function ctx(): Fin05CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(concurrentSpendSameLastPrefund: boolean): Fin05Input {
  return { concurrentSpendSameLastPrefund };
}

describe('TEST-FIN-05 — concurrent transfers cannot spend same last prefund', () => {
  it('concurrentSpendSameLastPrefund true => LIQUIDITY_UNAVAILABLE 409', async () => {
    const receipt = await reserveLiquidity(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('LIQUIDITY_UNAVAILABLE');
    expect(receipt.error.status).toBe(409);
  });

  it('otherwise 503 (no reservation; T-LEDGER-02 HOLD)', async () => {
    const receipt = await reserveLiquidity(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
