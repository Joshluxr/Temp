import type { UUID } from '@kita/contracts';
import type { Tx01CommandContext, Tx01Input } from '../../packages/contracts/src/transfers.ts';
import { describe, expect, it } from 'vitest';

import { acceptTransfer } from '../../packages/domain/transfers/accept-transfer.ts';

function ctx(): Tx01CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(doubleTapOrDifferentKeysWouldCreateSecondTransfer: boolean): Tx01Input {
  return { doubleTapOrDifferentKeysWouldCreateSecondTransfer };
}

describe('TEST-TX-01 — double tap and different keys on one quote create one transfer', () => {
  it('double-tap second transfer => IDEMPOTENCY_MISMATCH 409', async () => {
    const receipt = await acceptTransfer(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('IDEMPOTENCY_MISMATCH');
    expect(receipt.error.status).toBe(409);
  });

  it('otherwise 503 (no transfer created; T-CORE-02 HOLD)', async () => {
    const receipt = await acceptTransfer(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
