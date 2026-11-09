import type { UUID } from '@kita/contracts';
import type { Adm01CommandContext, Adm11Input } from '../../packages/contracts/src/admin.ts';
import { describe, expect, it } from 'vitest';

import { archiveAudit } from '../../packages/domain/admin/archive-audit.ts';

function ctx(): Adm01CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(archiveUnavailable: boolean, chainMismatch: boolean): Adm11Input {
  return { archiveUnavailable, chainMismatch };
}

describe('TEST-ADM-11 — hash anchors are never claimed verified without archive', () => {
  it('archiveUnavailable => SECURITY_FAILURE 409', async () => {
    const receipt = await archiveAudit(ctx(), body(true, false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('SECURITY_FAILURE');
    expect(receipt.error.status).toBe(409);
    expect(receipt.error.retryable).toBe(false);
  });

  it('chainMismatch => SECURITY_FAILURE 409', async () => {
    const receipt = await archiveAudit(ctx(), body(false, true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('SECURITY_FAILURE');
  });

  it('both flags => SECURITY_FAILURE 409 (precedence over 503)', async () => {
    const receipt = await archiveAudit(ctx(), body(true, true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('SECURITY_FAILURE');
  });

  it('neither flag still 503 (WORM archive not implemented)', async () => {
    const receipt = await archiveAudit(ctx(), body(false, false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
