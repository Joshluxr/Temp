import type { UUID } from '@kita/contracts';
import type { Adm03CommandContext, Adm03Input } from '../../packages/contracts/src/admin.ts';
import { describe, expect, it } from 'vitest';

import { setHold } from '../../packages/domain/admin/set-hold.ts';

function ctx(): Adm03CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(holdAfterDispatchWouldBeTreatedAsPreDispatchCancel: boolean): Adm03Input {
  return { holdAfterDispatchWouldBeTreatedAsPreDispatchCancel };
}

describe('TEST-ADM-03 — setHold never treats post-dispatch hold as pre-dispatch cancel', () => {
  it('holdAfterDispatchWouldBeTreatedAsPreDispatchCancel => COMPLIANCE_HOLD 409', async () => {
    const receipt = await setHold(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('COMPLIANCE_HOLD');
    expect(receipt.error.status).toBe(409);
    expect(receipt.error.retryable).toBe(false);
    expect(receipt.error.detail).not.toMatch(/pre-dispatch cancel(?:lation)? authorized/i);
  });

  it('otherwise 503 and does not claim a hold was recorded', async () => {
    const receipt = await setHold(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
    expect(receipt.error.detail).not.toMatch(/hold recorded/i);
    expect(receipt.error.detail).not.toMatch(/cancelled/i);
  });
});
