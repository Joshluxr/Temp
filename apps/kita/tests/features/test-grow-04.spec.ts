import type { UUID } from '@kita/contracts';
import type { Grow04CommandContext, Grow04Input } from '../../packages/contracts/src/rewards.ts';
import { describe, expect, it } from 'vitest';

import { qualifyReferral } from '../../packages/domain/rewards/qualify-referral.ts';

function ctx(): Grow04CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(selfReferral: boolean): Grow04Input {
  return { selfReferral };
}

describe('TEST-GROW-04 — self-referral blocked and household signal reviewed', () => {
  it('selfReferral true => LIMIT_EXCEEDED 409', async () => {
    const receipt = await qualifyReferral(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('LIMIT_EXCEEDED');
    expect(receipt.error.status).toBe(409);
  });

  it('non-self path still 503 (no points issued)', async () => {
    const receipt = await qualifyReferral(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
