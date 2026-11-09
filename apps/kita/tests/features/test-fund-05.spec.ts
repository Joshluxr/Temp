import type { UUID } from '@kita/contracts';
import type { Fund01CommandContext, Fund05Input } from '../../packages/contracts/src/funding.ts';
import { describe, expect, it } from 'vitest';

import { recoverFunding } from '../../packages/domain/funding/recover-funding.ts';

function ctx(): Fund01CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(timeoutAfterDebitWouldRecharge: boolean): Fund05Input {
  return { timeoutAfterDebitWouldRecharge };
}

describe('TEST-FUND-05 — timeout after debit never creates second charge', () => {
  it('timeoutAfterDebitWouldRecharge true => PROVIDER_OUTCOME_UNKNOWN 409', async () => {
    const receipt = await recoverFunding(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('PROVIDER_OUTCOME_UNKNOWN');
    expect(receipt.error.status).toBe(409);
  });

  it('known-result path still 503 (no second charge)', async () => {
    const receipt = await recoverFunding(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
