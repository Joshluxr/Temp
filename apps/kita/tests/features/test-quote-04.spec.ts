import type { UUID } from '@kita/contracts';
import type { Quote04CommandContext, Quote04Input } from '../../packages/contracts/src/quotes.ts';
import { describe, expect, it } from 'vitest';

import { validateRate } from '../../packages/domain/quotes/validate-rate.ts';

function ctx(): Quote04CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(staleQuoteWouldExecuteFromCache: boolean): Quote04Input {
  return { staleQuoteWouldExecuteFromCache };
}

describe('TEST-QUOTE-04 — stale quote unavailable; no cached execution fallback', () => {
  it('staleQuoteWouldExecuteFromCache true => RATE_STALE 409', async () => {
    const receipt = await validateRate(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('RATE_STALE');
    expect(receipt.error.status).toBe(409);
  });

  it('otherwise 503 (no execution; T-QUOTE-01 HOLD)', async () => {
    const receipt = await validateRate(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
