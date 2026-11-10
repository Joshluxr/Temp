import type { UUID } from '@kita/contracts';
import type { Tx06CommandContext, Tx06Input } from '../../packages/contracts/src/refunds.ts';
import { describe, expect, it } from 'vitest';

import { authorizeRefund } from '../../packages/domain/refunds/authorize-refund.ts';

function ctx(): Tx06CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(concurrentPartialRefundsWouldExceedEntitlement: boolean): Tx06Input {
  return { concurrentPartialRefundsWouldExceedEntitlement };
}

describe('TEST-TX-06 — concurrent partial refunds cannot exceed entitlement', () => {
  it('concurrentPartialRefundsWouldExceedEntitlement true => LIMIT_EXCEEDED 409', async () => {
    const receipt = await authorizeRefund(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('LIMIT_EXCEEDED');
    expect(receipt.error.status).toBe(409);
  });

  it('otherwise 503 (no refund; T-LEDGER-02 HOLD)', async () => {
    const receipt = await authorizeRefund(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
