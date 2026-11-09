import type { UUID } from '@kita/contracts';
import type { Pub01CommandContext, Pub01Input } from '../../packages/contracts/src/catalog.ts';
import { describe, expect, it } from 'vitest';

import { publishContent } from '../../packages/domain/catalog/publish-content.ts';

function ctx(): Pub01CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(unapprovedLicenseOrPartnerClaim: boolean): Pub01Input {
  return { unapprovedLicenseOrPartnerClaim };
}

describe('TEST-PUB-01 — unapproved license or partner claim is absent', () => {
  it('unapprovedLicenseOrPartnerClaim true => POLICY_UNAVAILABLE 409', async () => {
    const receipt = await publishContent(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('POLICY_UNAVAILABLE');
    expect(receipt.error.status).toBe(409);
  });

  it('approved-claim path still 503 (nothing published)', async () => {
    const receipt = await publishContent(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
