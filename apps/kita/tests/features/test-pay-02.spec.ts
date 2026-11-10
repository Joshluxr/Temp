import type { UUID } from '@kita/contracts';
import type { Pay02Input, Pay06CommandContext } from '../../packages/contracts/src/payouts.ts';
import { describe, expect, it } from 'vitest';

import { resolveBankRoute } from '../../packages/domain/payouts/resolve-bank-route.ts';

function ctx(): Pay06CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(splitBypassesCutoffHolidayOrAmount: boolean): Pay02Input {
  return { splitBypassesCutoffHolidayOrAmount };
}

describe('TEST-PAY-02 — cutoff/holiday and amount cannot be bypassed by splitting', () => {
  it('splitBypassesCutoffHolidayOrAmount true => LIMIT_EXCEEDED 409', async () => {
    const receipt = await resolveBankRoute(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('LIMIT_EXCEEDED');
    expect(receipt.error.status).toBe(409);
  });

  it('non-split path still 503 CAPABILITY_UNAVAILABLE (no rail dispatch)', async () => {
    const receipt = await resolveBankRoute(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('CAPABILITY_UNAVAILABLE');
    expect(receipt.error.status).toBe(503);
  });
});
