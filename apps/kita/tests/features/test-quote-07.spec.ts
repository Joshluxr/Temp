import type { UUID } from '@kita/contracts';
import type { Quote07CommandContext, Quote07Input } from '../../packages/contracts/src/quotes.ts';
import { describe, expect, it } from 'vitest';

import { renderQuoteTerms } from '../../packages/domain/quotes/render-quote-terms.ts';

function ctx(): Quote07CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(displayRoundingWouldChangeExecutionArithmetic: boolean): Quote07Input {
  return { displayRoundingWouldChangeExecutionArithmetic };
}

describe('TEST-QUOTE-07 — display rounding never changes execution arithmetic', () => {
  it('displayRoundingWouldChangeExecutionArithmetic true => POLICY_UNAVAILABLE 409', async () => {
    const receipt = await renderQuoteTerms(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('POLICY_UNAVAILABLE');
    expect(receipt.error.status).toBe(409);
  });

  it('otherwise 503 (no rewrite; T-QUOTE-01 HOLD)', async () => {
    const receipt = await renderQuoteTerms(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
