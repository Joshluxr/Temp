import type { UUID } from '@kita/contracts';
import type { Rec01CommandContext, Rec04Input } from '../../packages/contracts/src/recipients.ts';
import { describe, expect, it } from 'vitest';

import { repeatTransfer } from '../../packages/domain/recipients/repeat-transfer.ts';

function ctx(): Rec01CommandContext {
  return {
    actorId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    worker: {
      workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
      attemptGeneration: 1,
      correlationId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' as UUID,
    },
    trace: () => undefined,
  };
}

function body(reuseOldPayment: boolean): Rec04Input {
  return {
    historicalTransferId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' as UUID,
    recipientId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' as UUID,
    reuseOldPayment,
  };
}

describe('TEST-REC-04 — repeat never replays old payment', () => {
  it('reuseOldPayment true => CAPABILITY_UNAVAILABLE 409 non-retryable', async () => {
    const receipt = await repeatTransfer(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('CAPABILITY_UNAVAILABLE');
    expect(receipt.error.status).toBe(409);
    expect(receipt.error.retryable).toBe(false);
  });

  it('reuseOldPayment false => 503 (no payable draft)', async () => {
    const receipt = await repeatTransfer(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
