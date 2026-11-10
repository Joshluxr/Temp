import type { UUID } from '@kita/contracts';
import type { Fin08CommandContext, Fin08Input } from '../../packages/contracts/src/ledger.ts';
import { describe, expect, it } from 'vitest';

import { resolveCreditOverlap } from '../../packages/domain/ledger/resolve-credit-overlap.ts';

function ctx(): Fin08CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(secondAutomaticCreditSameEntitlement: boolean): Fin08Input {
  return { secondAutomaticCreditSameEntitlement };
}

describe('TEST-FIN-08 — no second automatic customer credit for same entitlement', () => {
  it('secondAutomaticCreditSameEntitlement true => POLICY_UNAVAILABLE 409', async () => {
    const receipt = await resolveCreditOverlap(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('POLICY_UNAVAILABLE');
    expect(receipt.error.status).toBe(409);
  });

  it('otherwise 503 (no credit; T-TX-06 HOLD)', async () => {
    const receipt = await resolveCreditOverlap(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
