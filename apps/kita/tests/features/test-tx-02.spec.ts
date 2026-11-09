import type { UUID } from '@kita/contracts';
import type { Tx02Input, Tx08CommandContext } from '../../packages/contracts/src/transfers.ts';
import { describe, expect, it } from 'vitest';

import { deriveCustomerStatus } from '../../packages/domain/transfers/derive-customer-status.ts';

function ctx(): Tx08CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(lateReturnErasesPaidHistory: boolean): Tx02Input {
  return { lateReturnErasesPaidHistory };
}

describe('TEST-TX-02 — late return preserves paid history', () => {
  it('lateReturnErasesPaidHistory true => POLICY_UNAVAILABLE 409', async () => {
    const receipt = await deriveCustomerStatus(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('POLICY_UNAVAILABLE');
    expect(receipt.error.status).toBe(409);
  });

  it('non-erase path still 503 (projection does not authorize money)', async () => {
    const receipt = await deriveCustomerStatus(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
