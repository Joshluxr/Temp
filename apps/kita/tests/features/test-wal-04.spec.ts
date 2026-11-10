import type { UUID } from '@kita/contracts';
import type { Wal04CommandContext, Wal04Input } from '../../packages/contracts/src/wallets.ts';
import { describe, expect, it } from 'vitest';

import { convertWallet } from '../../packages/domain/wallets/convert-wallet.ts';

function ctx(): Wal04CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(fourCurrencyLegsUnbalancedOrUnconfirmedTarget: boolean): Wal04Input {
  return { fourCurrencyLegsUnbalancedOrUnconfirmedTarget };
}

describe('TEST-WAL-04 — four currency legs must balance; unconfirmed target is not available', () => {
  it('fourCurrencyLegsUnbalancedOrUnconfirmedTarget true => INSUFFICIENT_FUNDS 409', async () => {
    const receipt = await convertWallet(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('INSUFFICIENT_FUNDS');
    expect(receipt.error.status).toBe(409);
  });

  it('otherwise 503 (no conversion; T-QUOTE-01 HOLD)', async () => {
    const receipt = await convertWallet(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
