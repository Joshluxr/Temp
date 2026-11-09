import type { UUID } from '@kita/contracts';
import type { Pub01CommandContext, Pub03Input } from '../../packages/contracts/src/catalog.ts';
import { describe, expect, it } from 'vitest';

import { listCapabilities } from '../../packages/domain/catalog/list-capabilities.ts';

function ctx(): Pub01CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(disabledUsStateOrOrigin: boolean): Pub03Input {
  return { disabledUsStateOrOrigin };
}

describe('TEST-PUB-03 — disabled US state or origin cannot accept money', () => {
  it('disabledUsStateOrOrigin true => CAPABILITY_UNAVAILABLE 403', async () => {
    const receipt = await listCapabilities(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('CAPABILITY_UNAVAILABLE');
    expect(receipt.error.status).toBe(403);
  });

  it('enabled origin still 503 (no country-wide default allow)', async () => {
    const receipt = await listCapabilities(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
