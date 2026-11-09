import type { UUID } from '@kita/contracts';
import type { Pub01CommandContext, Pub05Input } from '../../packages/contracts/src/catalog.ts';
import { describe, expect, it } from 'vitest';

import { resolveLocale } from '../../packages/domain/catalog/resolve-locale.ts';

function ctx(): Pub01CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(rewriteIssuedReceiptLocale: boolean): Pub05Input {
  return { rewriteIssuedReceiptLocale };
}

describe('TEST-PUB-05 — receipt and consent retain chosen language', () => {
  it('rewriteIssuedReceiptLocale true => POLICY_UNAVAILABLE 409', async () => {
    const receipt = await resolveLocale(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('POLICY_UNAVAILABLE');
    expect(receipt.error.status).toBe(409);
  });

  it('non-rewrite path still 503 (locale store unimplemented)', async () => {
    const receipt = await resolveLocale(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
