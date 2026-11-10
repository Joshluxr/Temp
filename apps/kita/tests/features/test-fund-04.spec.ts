import type { UUID } from '@kita/contracts';
import type { Fund01CommandContext, Fund04Input } from '../../packages/contracts/src/funding.ts';
import { describe, expect, it } from 'vitest';

import { validateFundingCapability } from '../../packages/domain/funding/validate-funding-capability.ts';

function ctx(): Fund01CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(unapprovedMethod: boolean): Fund04Input {
  return { unapprovedMethod };
}

describe('TEST-FUND-04 — unapproved method fails closed', () => {
  it('unapprovedMethod true => CAPABILITY_UNAVAILABLE 403', async () => {
    const receipt = await validateFundingCapability(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('CAPABILITY_UNAVAILABLE');
    expect(receipt.error.status).toBe(403);
  });

  it('approved-method path still 503 (no funds collected)', async () => {
    const receipt = await validateFundingCapability(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
