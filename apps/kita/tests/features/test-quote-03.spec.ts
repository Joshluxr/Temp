import type { UUID } from '@kita/contracts';
import type { Quote03CommandContext, Quote03Input } from '../../packages/contracts/src/quotes.ts';
import { describe, expect, it } from 'vitest';

import { priceFees } from '../../packages/domain/quotes/price-fees.ts';

function ctx(): Quote03CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(missingTaxWouldDefaultZeroOrInexactTierTotals: boolean): Quote03Input {
  return { missingTaxWouldDefaultZeroOrInexactTierTotals };
}

describe('TEST-QUOTE-03 — tier/tax totals exact; missing tax cannot default to zero', () => {
  it('missingTaxWouldDefaultZeroOrInexactTierTotals true => POLICY_UNAVAILABLE 409', async () => {
    const receipt = await priceFees(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('POLICY_UNAVAILABLE');
    expect(receipt.error.status).toBe(409);
  });

  it('otherwise 503 (no pricing; T-QUOTE-01 HOLD)', async () => {
    const receipt = await priceFees(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
