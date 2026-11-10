import type { UUID } from '@kita/contracts';
import type { Fund02CommandContext, Fund02Input } from '../../packages/contracts/src/funding.ts';
import { describe, expect, it } from 'vitest';

import { applyAchSettlement } from '../../packages/domain/funding/apply-ach-settlement.ts';

function ctx(): Fund02CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(initiationAloneWouldAuthorizePayout: boolean): Fund02Input {
  return { initiationAloneWouldAuthorizePayout };
}

describe('TEST-FUND-02 — initiation alone cannot authorize payout', () => {
  it('initiationAloneWouldAuthorizePayout true => FUNDING_PENDING 409', async () => {
    const receipt = await applyAchSettlement(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('FUNDING_PENDING');
    expect(receipt.error.status).toBe(409);
  });

  it('otherwise 503 (no ACH advance; T-LEDGER-02 HOLD)', async () => {
    const receipt = await applyAchSettlement(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
