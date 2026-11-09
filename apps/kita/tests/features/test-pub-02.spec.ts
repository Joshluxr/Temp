import type { UUID } from '@kita/contracts';
import type { Pub01CommandContext, Pub02Input } from '../../packages/contracts/src/catalog.ts';
import { describe, expect, it } from 'vitest';

import { estimateQuote } from '../../packages/domain/catalog/estimate-quote.ts';

function ctx(): Pub01CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(staleIndicativeFeed: boolean): Pub02Input {
  return { staleIndicativeFeed };
}

describe('TEST-PUB-02 — stale feed cannot yield executable transfer', () => {
  it('staleIndicativeFeed true => RATE_STALE 409', async () => {
    const receipt = await estimateQuote(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('RATE_STALE');
    expect(receipt.error.status).toBe(409);
  });

  it('fresh-feed path still 503 (no quoteId)', async () => {
    const receipt = await estimateQuote(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
