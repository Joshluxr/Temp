import type { UUID } from '@kita/contracts';
import type { Fund03CommandContext, Fund03Input } from '../../packages/contracts/src/funding.ts';
import { describe, expect, it } from 'vitest';

import { applyCardEvidence } from '../../packages/domain/funding/apply-card-evidence.ts';

function ctx(): Fund03CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(authorizationWouldPostCashOrCaptureLabeledBankCash: boolean): Fund03Input {
  return { authorizationWouldPostCashOrCaptureLabeledBankCash };
}

describe('TEST-FUND-03 — authorization posts no cash and capture remains receivable', () => {
  it('authorizationWouldPostCashOrCaptureLabeledBankCash true => POLICY_UNAVAILABLE 409', async () => {
    const receipt = await applyCardEvidence(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('POLICY_UNAVAILABLE');
    expect(receipt.error.status).toBe(409);
  });

  it('otherwise 503 (no cash posting; T-LEDGER-02 HOLD)', async () => {
    const receipt = await applyCardEvidence(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
