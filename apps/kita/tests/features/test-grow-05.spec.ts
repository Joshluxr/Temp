import type { UUID } from '@kita/contracts';
import type { Grow05CommandContext, Grow05Input } from '../../packages/contracts/src/rate-alerts.ts';
import { describe, expect, it } from 'vitest';

import { evaluateAlerts } from '../../packages/domain/rate-alerts/evaluate-alerts.ts';

function ctx(): Grow05CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(oscillatingOrStaleRate: boolean): Grow05Input {
  return { oscillatingOrStaleRate };
}

describe('TEST-GROW-05 — oscillating or stale rate does not spam or execute money', () => {
  it('oscillatingOrStaleRate true => RATE_STALE 409', async () => {
    const receipt = await evaluateAlerts(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('RATE_STALE');
    expect(receipt.error.status).toBe(409);
  });

  it('fresh-rate path still 503 (no spend authority)', async () => {
    const receipt = await evaluateAlerts(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
