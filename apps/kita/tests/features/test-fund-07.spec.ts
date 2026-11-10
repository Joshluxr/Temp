import type { UUID } from '@kita/contracts';
import type { Fund01CommandContext, Fund07Input } from '../../packages/contracts/src/funding.ts';
import { describe, expect, it } from 'vitest';

import { attributeIncomingCash } from '../../packages/domain/funding/attribute-incoming-cash.ts';

function ctx(): Fund01CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(unownedCashRecognizedAsRevenue: boolean): Fund07Input {
  return { unownedCashRecognizedAsRevenue };
}

describe('TEST-FUND-07 — unowned cash remains suspense not revenue', () => {
  it('unownedCashRecognizedAsRevenue true => POLICY_UNAVAILABLE 409', async () => {
    const receipt = await attributeIncomingCash(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('POLICY_UNAVAILABLE');
    expect(receipt.error.status).toBe(409);
  });

  it('owned-match path still 503 (journal store unimplemented)', async () => {
    const receipt = await attributeIncomingCash(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
