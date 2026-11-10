import type { UUID } from '@kita/contracts';
import type { Fin02CommandContext, Fin02Input } from '../../packages/contracts/src/ledger.ts';
import { describe, expect, it } from 'vitest';

import { allocateCorrection } from '../../packages/domain/ledger/allocate-correction.ts';

function ctx(): Fin02CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(cumulativePartialFeesDoNotSumOnFinalRefund: boolean): Fin02Input {
  return { cumulativePartialFeesDoNotSumOnFinalRefund };
}

describe('TEST-FIN-02 — cumulative partial fees must sum exactly on final refund', () => {
  it('cumulativePartialFeesDoNotSumOnFinalRefund true => LIMIT_EXCEEDED 409', async () => {
    const receipt = await allocateCorrection(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('LIMIT_EXCEEDED');
    expect(receipt.error.status).toBe(409);
  });

  it('otherwise 503 (no original journal edit; T-FIN-01 HOLD)', async () => {
    const receipt = await allocateCorrection(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
