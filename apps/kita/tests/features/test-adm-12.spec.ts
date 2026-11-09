import type { UUID } from '@kita/contracts';
import type { Adm01CommandContext, Adm12Input } from '../../packages/contracts/src/admin.ts';
import { describe, expect, it } from 'vitest';

import { pauseRoute } from '../../packages/domain/admin/pause-route.ts';

function ctx(): Adm01CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(reenableWithoutApproval: boolean): Adm12Input {
  return { reenableWithoutApproval };
}

describe('TEST-ADM-12 — pauseRoute never persists a live money-affecting pause', () => {
  it('reenableWithoutApproval => APPROVAL_REQUIRED 409', async () => {
    const receipt = await pauseRoute(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('APPROVAL_REQUIRED');
    expect(receipt.error.status).toBe(409);
    expect(receipt.error.retryable).toBe(false);
  });

  it('otherwise 503 and does not claim production commands stopped', async () => {
    const receipt = await pauseRoute(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
    expect(receipt.error.detail).not.toMatch(/stopped in production/i);
  });
});
