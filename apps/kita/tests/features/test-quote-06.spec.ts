import type { UUID } from '@kita/contracts';
import type { Quote06CommandContext, Quote06Input } from '../../packages/contracts/src/quotes.ts';
import { describe, expect, it } from 'vitest';

import { reserveFxExposure } from '../../packages/domain/quotes/reserve-fx-exposure.ts';

function ctx(): Quote06CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(wholesaleDeteriorationWouldChangeCustomerPromise: boolean): Quote06Input {
  return { wholesaleDeteriorationWouldChangeCustomerPromise };
}

describe('TEST-QUOTE-06 — wholesale deterioration cannot change the customer promise', () => {
  it('wholesaleDeteriorationWouldChangeCustomerPromise true => POLICY_UNAVAILABLE 409', async () => {
    const receipt = await reserveFxExposure(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('POLICY_UNAVAILABLE');
    expect(receipt.error.status).toBe(409);
  });

  it('otherwise 503 (customer promise preserved; T-QUOTE-01 HOLD)', async () => {
    const receipt = await reserveFxExposure(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
