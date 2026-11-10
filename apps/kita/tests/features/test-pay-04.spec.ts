import type { UUID } from '@kita/contracts';
import type { Pay04Input, Pay06CommandContext } from '../../packages/contracts/src/payouts.ts';
import { describe, expect, it } from 'vitest';

import { applyCashPickup } from '../../packages/domain/payouts/apply-cash-pickup.ts';

function ctx(): Pay06CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(expiryAloneFabricatesReturn: boolean): Pay04Input {
  return { expiryAloneFabricatesReturn };
}

describe('TEST-PAY-04 — expiry alone never fabricates return', () => {
  it('expiryAloneFabricatesReturn true => PROVIDER_OUTCOME_UNKNOWN 409', async () => {
    const receipt = await applyCashPickup(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('PROVIDER_OUTCOME_UNKNOWN');
    expect(receipt.error.status).toBe(409);
  });

  it('non-fabricate path still 503 (available is not collected)', async () => {
    const receipt = await applyCashPickup(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
