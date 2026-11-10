import type { UUID } from '@kita/contracts';
import type { Fund01CommandContext, Fund06Input } from '../../packages/contracts/src/funding.ts';
import { describe, expect, it } from 'vitest';

import { applyFundingReturn } from '../../packages/domain/funding/apply-funding-return.ts';

function ctx(): Fund01CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(erasePaidPhpOrSeizeUnrelatedWallet: boolean): Fund06Input {
  return { erasePaidPhpOrSeizeUnrelatedWallet };
}

describe('TEST-FUND-06 — paid PHP persists with separate loss/recovery', () => {
  it('erasePaidPhpOrSeizeUnrelatedWallet true => POLICY_UNAVAILABLE 409', async () => {
    const receipt = await applyFundingReturn(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('POLICY_UNAVAILABLE');
    expect(receipt.error.status).toBe(409);
  });

  it('non-erase path still 503 (no wallet seizure)', async () => {
    const receipt = await applyFundingReturn(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
