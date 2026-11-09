import type { UUID } from '@kita/contracts';
import type { Auth01CommandContext, Auth01Input } from '../../packages/contracts/src/identity.ts';
import { describe, expect, it } from 'vitest';

import { verifyContact } from '../../packages/domain/identity/verify-contact.ts';

function ctx(): Auth01CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(contactVerified: boolean): Auth01Input {
  return { contactVerified };
}

describe('TEST-AUTH-01 — unverified contact cannot authorize transfer', () => {
  it('contactVerified false => unauthorized 403', async () => {
    const receipt = await verifyContact(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('unauthorized');
    expect(receipt.error.status).toBe(403);
  });

  it('contactVerified true still 503 (not financial authorization)', async () => {
    const receipt = await verifyContact(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
