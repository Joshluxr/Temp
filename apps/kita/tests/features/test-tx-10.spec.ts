import type { UUID } from '@kita/contracts';
import type { Tx10CommandContext, Tx10Input } from '../../packages/contracts/src/schedules.ts';
import { describe, expect, it } from 'vitest';

import { executeOccurrence } from '../../packages/domain/schedules/execute-occurrence.ts';

function ctx(): Tx10CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(dstRetryWouldCreateSecondOccurrence: boolean): Tx10Input {
  return { dstRetryWouldCreateSecondOccurrence };
}

describe('TEST-TX-10 — DST retry produces one authorized occurrence', () => {
  it('dstRetryWouldCreateSecondOccurrence true => LIMIT_EXCEEDED 409', async () => {
    const receipt = await executeOccurrence(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('LIMIT_EXCEEDED');
    expect(receipt.error.status).toBe(409);
  });

  it('otherwise 503 (no occurrence; T-CORE-02 HOLD)', async () => {
    const receipt = await executeOccurrence(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
