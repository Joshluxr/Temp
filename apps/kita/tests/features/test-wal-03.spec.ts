import type { UUID } from '@kita/contracts';
import type { Wal03CommandContext, Wal03Input } from '../../packages/contracts/src/wallets.ts';
import { describe, expect, it } from 'vitest';

import { reserveWallet } from '../../packages/domain/wallets/reserve-wallet.ts';

function ctx(): Wal03CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(twoSimultaneousSpendsWouldOverdraw: boolean): Wal03Input {
  return { twoSimultaneousSpendsWouldOverdraw };
}

describe('TEST-WAL-03 — two simultaneous spends cannot overdraw', () => {
  it('twoSimultaneousSpendsWouldOverdraw true => INSUFFICIENT_FUNDS 409', async () => {
    const receipt = await reserveWallet(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('INSUFFICIENT_FUNDS');
    expect(receipt.error.status).toBe(409);
  });

  it('otherwise 503 (no reservation; T-CORE-02 HOLD)', async () => {
    const receipt = await reserveWallet(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
