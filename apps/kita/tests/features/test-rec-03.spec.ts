import type { UUID } from '@kita/contracts';
import type { Rec01CommandContext, Rec03Input } from '../../packages/contracts/src/recipients.ts';
import { describe, expect, it } from 'vitest';

import { archiveRecipient } from '../../packages/domain/recipients/archive-recipient.ts';

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

function body(expectedVersionMismatch: boolean): Rec03Input {
  return {
    recipientId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' as UUID,
    expectedVersion: 3,
    expectedVersionMismatch,
  };
}

describe('TEST-REC-03 — old transfer snapshot survives destination edit', () => {
  it('expectedVersionMismatch => VERSION_CONFLICT 409 (no archive)', async () => {
    const receipt = await archiveRecipient(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('VERSION_CONFLICT');
    expect(receipt.error.status).toBe(409);
    expect(receipt.error.retryable).toBe(false);
  });

  it('matching version still 503 and does not claim archive completed', async () => {
    const receipt = await archiveRecipient(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
