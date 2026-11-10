import type { UUID } from '@kita/contracts';
import type { Quote05CommandContext, Quote05Input } from '../../packages/contracts/src/quotes.ts';
import { describe, expect, it } from 'vitest';

import { acceptQuote } from '../../packages/domain/quotes/accept-quote.ts';

function ctx(): Quote05CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(expiryEqualityOrRecipientChange: boolean): Quote05Input {
  return { expiryEqualityOrRecipientChange };
}

describe('TEST-QUOTE-05 — expiry equality or recipient change produces conflict', () => {
  it('expiryEqualityOrRecipientChange true => QUOTE_EXPIRED 409', async () => {
    const receipt = await acceptQuote(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('QUOTE_EXPIRED');
    expect(receipt.error.status).toBe(409);
  });

  it('otherwise 503 (no acceptance; T-QUOTE-01 HOLD)', async () => {
    const receipt = await acceptQuote(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
