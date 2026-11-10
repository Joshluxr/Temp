import type { UUID } from '@kita/contracts';
import type { Adm06CommandContext, Adm06Input } from '../../packages/contracts/src/admin.ts';
import { describe, expect, it } from 'vitest';

import { requestAdjustment } from '../../packages/domain/admin/request-adjustment.ts';

function ctx(): Adm06CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(stalePayload: boolean, unauthorizedAccounts: boolean): Adm06Input {
  return { stalePayload, unauthorizedAccounts };
}

describe('TEST-ADM-06 — requestAdjustment never grants command authority', () => {
  it('unauthorizedAccounts (alone) => unauthorized 403', async () => {
    const receipt = await requestAdjustment(ctx(), body(false, true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('unauthorized');
    expect(receipt.error.status).toBe(403);
    expect(receipt.error.retryable).toBe(false);
  });

  it('both flags true => unauthorized 403 takes precedence', async () => {
    const receipt = await requestAdjustment(ctx(), body(true, true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('unauthorized');
    expect(receipt.error.status).toBe(403);
    expect(receipt.error.retryable).toBe(false);
  });

  it('stalePayload only => APPROVAL_STALE 409', async () => {
    const receipt = await requestAdjustment(ctx(), body(true, false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('APPROVAL_STALE');
    expect(receipt.error.status).toBe(409);
    expect(receipt.error.retryable).toBe(false);
  });

  it('otherwise 503 and does not claim a request was recorded or executed', async () => {
    const receipt = await requestAdjustment(ctx(), body(false, false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
    expect(receipt.error.retryable).toBe(true);
    expect(receipt.error.detail).toMatch(/T-CORE-02/);
    expect(receipt.error.detail).toMatch(/T-LEDGER-02/);
    expect(receipt.error.detail).not.toMatch(/recorded/i);
    expect(receipt.error.detail).not.toMatch(/executed/i);
    expect(receipt.error.detail).not.toMatch(/approved/i);
  });
});
