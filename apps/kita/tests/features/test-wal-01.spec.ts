import type { UUID } from '@kita/contracts';
import type { Wal01CommandContext, Wal01Input } from '../../packages/contracts/src/wallets.ts';
import { describe, expect, it } from 'vitest';

import { getWalletBalances } from '../../packages/domain/wallets/get-wallet-balances.ts';

function ctx(): Wal01CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(projectionLedgerDisagree: boolean): Wal01Input {
  return { projectionLedgerDisagree };
}

describe('TEST-WAL-01 — projection and ledger must agree per currency', () => {
  it('projectionLedgerDisagree true => CAPABILITY_UNAVAILABLE 409', async () => {
    const receipt = await getWalletBalances(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('CAPABILITY_UNAVAILABLE');
    expect(receipt.error.status).toBe(409);
  });

  it('otherwise 503 (no spendable balances; T-LEDGER-02 HOLD)', async () => {
    const receipt = await getWalletBalances(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
