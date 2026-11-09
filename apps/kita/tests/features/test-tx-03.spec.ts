import type { UUID } from '@kita/contracts';
import type { Tx03Input, Tx08CommandContext } from '../../packages/contracts/src/transfers.ts';
import { describe, expect, it } from 'vitest';

import { listTransfers } from '../../packages/domain/transfers/list-transfers.ts';

function ctx(): Tx08CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(cursorExposesOtherCustomer: boolean): Tx03Input {
  return { cursorExposesOtherCustomer };
}

describe('TEST-TX-03 — stable cursor cannot expose another customer records', () => {
  it('cursorExposesOtherCustomer true => unauthorized 403', async () => {
    const receipt = await listTransfers(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('unauthorized');
    expect(receipt.error.status).toBe(403);
  });

  it('in-scope cursor still 503 (history store unimplemented)', async () => {
    const receipt = await listTransfers(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
