import type { UUID } from '@kita/contracts';
import type { Tx08CommandContext, Tx08Input } from '../../packages/contracts/src/transfers.ts';
import { describe, expect, it } from 'vitest';

import { appendSupportMessage } from '../../packages/domain/transfers/append-support-message.ts';

function ctx(): Tx08CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(wrongAccountOrCrossCaseAttachment: boolean): Tx08Input {
  return { wrongAccountOrCrossCaseAttachment };
}

describe('TEST-TX-08 — wrong account cannot read or attach case evidence', () => {
  it('wrongAccountOrCrossCaseAttachment true => unauthorized 403', async () => {
    const receipt = await appendSupportMessage(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('unauthorized');
    expect(receipt.error.status).toBe(403);
  });

  it('owned-case path still 503 (case store unimplemented)', async () => {
    const receipt = await appendSupportMessage(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
