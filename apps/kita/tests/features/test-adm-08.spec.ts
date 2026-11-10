import type { UUID } from '@kita/contracts';
import type { Adm08CommandContext, Adm08Input } from '../../packages/contracts/src/admin.ts';
import { describe, expect, it } from 'vitest';

import { releasePolicy } from '../../packages/domain/admin/release-policy.ts';

function ctx(): Adm08CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(
  unauthorizedRelease: boolean,
  staleApproval: boolean,
  wouldRewriteAcceptedQuote: boolean,
): Adm08Input {
  return { unauthorizedRelease, staleApproval, wouldRewriteAcceptedQuote };
}

describe('TEST-ADM-08 — releasePolicy never publishes or rewrites accepted quotes', () => {
  const unauthorizedCombos: ReadonlyArray<readonly [boolean, boolean, boolean]> = [
    [true, false, false],
    [true, false, true],
    [true, true, false],
    [true, true, true],
  ];

  it.each(unauthorizedCombos)(
    'unauthorizedRelease=%s staleApproval=%s wouldRewriteAcceptedQuote=%s => unauthorized 403',
    async (unauthorizedRelease, staleApproval, wouldRewriteAcceptedQuote) => {
      const receipt = await releasePolicy(
        ctx(),
        body(unauthorizedRelease, staleApproval, wouldRewriteAcceptedQuote),
      );
      expect(receipt.ok).toBe(false);
      if (receipt.ok) return;
      expect(receipt.error.code).toBe('unauthorized');
      expect(receipt.error.status).toBe(403);
      expect(receipt.error.retryable).toBe(false);
    },
  );

  const staleCombos: ReadonlyArray<readonly [boolean, boolean]> = [
    [true, false],
    [true, true],
  ];

  it.each(staleCombos)(
    'staleApproval=%s wouldRewriteAcceptedQuote=%s (authorized) => APPROVAL_STALE 409',
    async (staleApproval, wouldRewriteAcceptedQuote) => {
      const receipt = await releasePolicy(ctx(), body(false, staleApproval, wouldRewriteAcceptedQuote));
      expect(receipt.ok).toBe(false);
      if (receipt.ok) return;
      expect(receipt.error.code).toBe('APPROVAL_STALE');
      expect(receipt.error.status).toBe(409);
      expect(receipt.error.retryable).toBe(false);
    },
  );

  it('wouldRewriteAcceptedQuote only => VERSION_CONFLICT 409', async () => {
    const receipt = await releasePolicy(ctx(), body(false, false, true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('VERSION_CONFLICT');
    expect(receipt.error.status).toBe(409);
    expect(receipt.error.retryable).toBe(false);
  });

  it('all flags false => 503 with no success payload or release claim', async () => {
    const receipt = await releasePolicy(ctx(), body(false, false, false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
    expect(receipt.error.retryable).toBe(true);
    expect(receipt.error.detail).toMatch(/T-CORE-02/);
    expect(receipt.error.detail).toMatch(/T-LEDGER-02/);
    expect(receipt.error.detail).not.toMatch(/effective/i);
    expect(receipt.error.detail).not.toMatch(/approved/i);
    expect(receipt.error.detail).not.toMatch(/executed/i);
    expect('value' in receipt).toBe(false);
  });
});
