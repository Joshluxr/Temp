import type { UUID } from '@kita/contracts';
import type { Adm01CommandContext, Adm04Input } from '../../packages/contracts/src/admin.ts';
import { describe, expect, it } from 'vitest';

import { decideCase } from '../../packages/domain/admin/decide-case.ts';

function ctx(): Adm01CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(unqualifiedRole: boolean, overrideBlockedProperty: boolean): Adm04Input {
  return { unqualifiedRole, overrideBlockedProperty };
}

describe('TEST-ADM-04 — unqualified role cannot override blocked-property', () => {
  it('unqualifiedRole => unauthorized 403 even with override flag', async () => {
    const receipt = await decideCase(ctx(), body(true, true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('unauthorized');
    expect(receipt.error.status).toBe(403);
    expect(receipt.error.retryable).toBe(false);
  });

  it('overrideBlockedProperty => APPROVAL_REQUIRED 409', async () => {
    const receipt = await decideCase(ctx(), body(false, true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('APPROVAL_REQUIRED');
    expect(receipt.error.status).toBe(409);
    expect(receipt.error.retryable).toBe(false);
  });

  it('qualified without override still 503 (no invented decision)', async () => {
    const receipt = await decideCase(ctx(), body(false, false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
