import type { UUID } from '@kita/contracts';
import type { Adm01CommandContext, Adm10Input } from '../../packages/contracts/src/admin.ts';
import { describe, expect, it } from 'vitest';

import { changeAccess } from '../../packages/domain/admin/change-access.ts';

function ctx(): Adm01CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(revokedApprover: boolean, financialSelfGrant: boolean): Adm10Input {
  return { revokedApprover, financialSelfGrant };
}

describe('TEST-ADM-10 — revoked approver cannot execute queued request', () => {
  it('financialSelfGrant => unauthorized 403 even if also revoked', async () => {
    const receipt = await changeAccess(ctx(), body(true, true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('unauthorized');
    expect(receipt.error.status).toBe(403);
    expect(receipt.error.retryable).toBe(false);
  });

  it('revokedApprover => APPROVAL_STALE 409 non-retryable', async () => {
    const receipt = await changeAccess(ctx(), body(true, false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('APPROVAL_STALE');
    expect(receipt.error.status).toBe(409);
    expect(receipt.error.retryable).toBe(false);
  });

  it('neither flag still 503 (grants store not implemented)', async () => {
    const receipt = await changeAccess(ctx(), body(false, false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
