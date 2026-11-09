import type { UUID } from '@kita/contracts';
import type { Grow07CommandContext, Grow08Input } from '../../packages/contracts/src/notifications.ts';
import { describe, expect, it } from 'vitest';

import { applyCommunicationConsent } from '../../packages/domain/notifications/apply-communication-consent.ts';

function ctx(): Grow07CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(marketingCampaignDespiteOptOut: boolean): Grow08Input {
  return { marketingCampaignDespiteOptOut };
}

describe('TEST-GROW-08 — marketing opt-out suppresses campaign; service notices preserved', () => {
  it('marketingCampaignDespiteOptOut true => CAPABILITY_UNAVAILABLE 409', async () => {
    const receipt = await applyCommunicationConsent(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('CAPABILITY_UNAVAILABLE');
    expect(receipt.error.status).toBe(409);
  });

  it('non-campaign path still 503 (service notices not claimed delivered)', async () => {
    const receipt = await applyCommunicationConsent(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
