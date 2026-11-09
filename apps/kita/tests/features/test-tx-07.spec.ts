import type { UUID } from '@kita/contracts';
import type { Tx07Input, Tx08CommandContext } from '../../packages/contracts/src/transfers.ts';
import { describe, expect, it } from 'vitest';

import { openErrorClaim } from '../../packages/domain/transfers/open-error-claim.ts';

function ctx(): Tx08CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(supportHandoffResetsStatutoryClock: boolean): Tx07Input {
  return { supportHandoffResetsStatutoryClock };
}

describe('TEST-TX-07 — support handoff never resets original statutory clock', () => {
  it('supportHandoffResetsStatutoryClock true => POLICY_UNAVAILABLE 409', async () => {
    const receipt = await openErrorClaim(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('POLICY_UNAVAILABLE');
    expect(receipt.error.status).toBe(409);
  });

  it('non-reset path still 503 (no refund granted)', async () => {
    const receipt = await openErrorClaim(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
