import type { UUID } from '@kita/contracts';
import type { Quote02CommandContext, Quote02Input } from '../../packages/contracts/src/quotes.ts';
import { describe, expect, it } from 'vitest';

import { solveReceive } from '../../packages/domain/quotes/solve-receive.ts';

function ctx(): Quote02CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(inverseWouldMissRequestedMinorAmount: boolean): Quote02Input {
  return { inverseWouldMissRequestedMinorAmount };
}

describe('TEST-QUOTE-02 — inversion must deliver requested minor amount exactly', () => {
  it('inverseWouldMissRequestedMinorAmount true => CAPABILITY_UNAVAILABLE 409', async () => {
    const receipt = await solveReceive(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('CAPABILITY_UNAVAILABLE');
    expect(receipt.error.status).toBe(409);
  });

  it('otherwise 503 (no solve; T-QUOTE-01 HOLD)', async () => {
    const receipt = await solveReceive(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
