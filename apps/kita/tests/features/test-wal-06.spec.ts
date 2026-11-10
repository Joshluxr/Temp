import type { UUID } from '@kita/contracts';
import type { Wal06CommandContext, Wal06Input } from '../../packages/contracts/src/wallets.ts';
import { describe, expect, it } from 'vitest';

import { transferWallet } from '../../packages/domain/wallets/transfer-wallet.ts';

function ctx(): Wal06CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(unscreenedPartyOrCrossBookWithoutSettlementPolicy: boolean): Wal06Input {
  return { unscreenedPartyOrCrossBookWithoutSettlementPolicy };
}

describe('TEST-WAL-06 — both parties screened; cross-book unsupported without settlement policy', () => {
  it('unscreenedPartyOrCrossBookWithoutSettlementPolicy true => CAPABILITY_UNAVAILABLE 409', async () => {
    const receipt = await transferWallet(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('CAPABILITY_UNAVAILABLE');
    expect(receipt.error.status).toBe(409);
  });

  it('otherwise 503 (no transfer; T-CORE-02 HOLD)', async () => {
    const receipt = await transferWallet(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
