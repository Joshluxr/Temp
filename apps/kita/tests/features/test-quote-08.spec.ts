import type { UUID } from '@kita/contracts';
import type { Quote08CommandContext, Quote08Input } from '../../packages/contracts/src/quotes.ts';
import { describe, expect, it } from 'vitest';

import { saveDraft } from '../../packages/domain/quotes/save-draft.ts';

function ctx(): Quote08CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(staleDraftWouldOverwriteNewerRecipientOrAmount: boolean): Quote08Input {
  return { staleDraftWouldOverwriteNewerRecipientOrAmount };
}

describe('TEST-QUOTE-08 — stale draft version cannot overwrite newer recipient/amount', () => {
  it('staleDraftWouldOverwriteNewerRecipientOrAmount true => VERSION_CONFLICT 409', async () => {
    const receipt = await saveDraft(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('VERSION_CONFLICT');
    expect(receipt.error.status).toBe(409);
  });

  it('otherwise 503 (no overwrite; T-CORE-02 HOLD)', async () => {
    const receipt = await saveDraft(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
