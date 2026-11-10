import type { UUID } from '@kita/contracts';
import type { Fin07CommandContext, Fin07Input } from '../../packages/contracts/src/ledger.ts';
import { describe, expect, it } from 'vitest';

import { closePeriod } from '../../packages/domain/ledger/close-period.ts';

function ctx(): Fin07CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(unauthorizedBackdatedPostingIntoClosedPeriod: boolean): Fin07Input {
  return { unauthorizedBackdatedPostingIntoClosedPeriod };
}

describe('TEST-FIN-07 — closed period cannot receive unauthorized backdated posting', () => {
  it('unauthorizedBackdatedPostingIntoClosedPeriod true => POLICY_UNAVAILABLE 409', async () => {
    const receipt = await closePeriod(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('POLICY_UNAVAILABLE');
    expect(receipt.error.status).toBe(409);
  });

  it('otherwise 503 (no posting; T-FIN-01 HOLD)', async () => {
    const receipt = await closePeriod(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
