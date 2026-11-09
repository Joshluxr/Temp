import type { UUID } from '@kita/contracts';
import type { Adm01CommandContext, Adm05Input } from '../../packages/contracts/src/admin.ts';
import { describe, expect, it } from 'vitest';

import { decideApproval } from '../../packages/domain/admin/decide-approval.ts';

function ctx(): Adm01CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(samePersonSecondLogin: boolean): Adm05Input {
  return { samePersonSecondLogin };
}

describe('TEST-ADM-05 — second login of same person cannot approve', () => {
  it('samePersonSecondLogin => APPROVAL_STALE 409 non-retryable', async () => {
    const receipt = await decideApproval(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('APPROVAL_STALE');
    expect(receipt.error.status).toBe(409);
    expect(receipt.error.retryable).toBe(false);
  });

  it('distinct checker still 503 (no command authority)', async () => {
    const receipt = await decideApproval(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
