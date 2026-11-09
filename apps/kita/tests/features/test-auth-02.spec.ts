import type { UUID } from '@kita/contracts';
import type { Auth01CommandContext, Auth02Input } from '../../packages/contracts/src/identity.ts';
import { describe, expect, it } from 'vitest';

import { revokeSession } from '../../packages/domain/identity/revoke-session.ts';

function ctx(): Auth01CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(tokenRevoked: boolean): Auth02Input {
  return { tokenRevoked };
}

describe('TEST-AUTH-02 — revoked token cannot continue financial command', () => {
  it('tokenRevoked true => unauthorized 403', async () => {
    const receipt = await revokeSession(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('unauthorized');
    expect(receipt.error.status).toBe(403);
  });

  it('tokenRevoked false still 503 (no live session)', async () => {
    const receipt = await revokeSession(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
