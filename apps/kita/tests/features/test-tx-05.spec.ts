import type { UUID } from '@kita/contracts';
import type { Tx05CommandContext, Tx05Input } from '../../packages/contracts/src/transfers.ts';
import { describe, expect, it } from 'vitest';

import { requestCancellation } from '../../packages/domain/transfers/request-cancellation.ts';

function ctx(): Tx05CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(rewrittenReceiptTimestampWouldChangeEligibleRemedy: boolean): Tx05Input {
  return { rewrittenReceiptTimestampWouldChangeEligibleRemedy };
}

describe('TEST-TX-05 — receipt timestamp and actual delivery determine eligible remedy', () => {
  it('rewrittenReceiptTimestampWouldChangeEligibleRemedy true => POLICY_UNAVAILABLE 409', async () => {
    const receipt = await requestCancellation(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('POLICY_UNAVAILABLE');
    expect(receipt.error.status).toBe(409);
  });

  it('otherwise 503 (no rewritten clock; T-TX-06 HOLD)', async () => {
    const receipt = await requestCancellation(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
