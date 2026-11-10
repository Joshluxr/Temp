import type { UUID } from '@kita/contracts';
import type { Wal05CommandContext, Wal05Input } from '../../packages/contracts/src/wallets.ts';
import { describe, expect, it } from 'vitest';

import { withdrawWallet } from '../../packages/domain/wallets/withdraw-wallet.ts';

function ctx(): Wal05CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(failedRefundDropsObligationOrClosureLosesFunds: boolean): Wal05Input {
  return { failedRefundDropsObligationOrClosureLosesFunds };
}

describe('TEST-WAL-05 — failed refund retains obligation; closure cannot lose remaining funds', () => {
  it('failedRefundDropsObligationOrClosureLosesFunds true => COMPLIANCE_HOLD 409', async () => {
    const receipt = await withdrawWallet(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('COMPLIANCE_HOLD');
    expect(receipt.error.status).toBe(409);
  });

  it('otherwise 503 (no drop; T-TX-06 HOLD)', async () => {
    const receipt = await withdrawWallet(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
