import type { UUID } from '@kita/contracts';
import type { Tx04Input, Tx08CommandContext } from '../../packages/contracts/src/transfers.ts';
import { describe, expect, it } from 'vitest';

import { renderReceipt } from '../../packages/domain/transfers/render-receipt.ts';

function ctx(): Tx08CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(rewriteIssuedReceiptAfterPricingUpdate: boolean): Tx04Input {
  return { rewriteIssuedReceiptAfterPricingUpdate };
}

describe('TEST-TX-04 — old receipt unchanged after pricing update', () => {
  it('rewriteIssuedReceiptAfterPricingUpdate true => POLICY_UNAVAILABLE 409', async () => {
    const receipt = await renderReceipt(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('POLICY_UNAVAILABLE');
    expect(receipt.error.status).toBe(409);
  });

  it('non-rewrite path still 503 (receipt store unimplemented)', async () => {
    const receipt = await renderReceipt(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
