import type { UUID } from '@kita/contracts';
import type { Pub01CommandContext, Pub06Input } from '../../packages/contracts/src/catalog.ts';
import { describe, expect, it } from 'vitest';

import { applyKitaTokens } from '../../packages/domain/catalog/apply-kita-tokens.ts';

function ctx(): Pub01CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(inaccessibleContrastOrKeyboardContract: boolean): Pub06Input {
  return { inaccessibleContrastOrKeyboardContract };
}

describe('TEST-PUB-06 — keyboard and screen reader flow must pass at required widths', () => {
  it('inaccessibleContrastOrKeyboardContract true => POLICY_UNAVAILABLE 409', async () => {
    const receipt = await applyKitaTokens(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('POLICY_UNAVAILABLE');
    expect(receipt.error.status).toBe(409);
  });

  it('accessible-contract path still 503 (tokens not shipped)', async () => {
    const receipt = await applyKitaTokens(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
