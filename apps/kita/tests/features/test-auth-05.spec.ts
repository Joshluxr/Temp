import type { UUID } from '@kita/contracts';
import type { Auth01CommandContext, Auth05Input } from '../../packages/contracts/src/identity.ts';
import { describe, expect, it } from 'vitest';

import { listSessions } from '../../packages/domain/identity/list-sessions.ts';

function ctx(): Auth01CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(deviceRevoked: boolean): Auth05Input {
  return { deviceRevoked };
}

describe('TEST-AUTH-05 — revoked device cannot refresh token', () => {
  it('deviceRevoked true => unauthorized 403', async () => {
    const receipt = await listSessions(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('unauthorized');
    expect(receipt.error.status).toBe(403);
  });

  it('unrevoked device still 503 (no token refresh or SSE)', async () => {
    const receipt = await listSessions(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
