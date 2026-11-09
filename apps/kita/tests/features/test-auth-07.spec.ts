import type { UUID } from '@kita/contracts';
import type { Auth01CommandContext, Auth07Input } from '../../packages/contracts/src/identity.ts';
import { describe, expect, it } from 'vitest';

import { exchangeMobileCode } from '../../packages/domain/identity/exchange-mobile-code.ts';

function ctx(): Auth01CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(expiredKeyOrHostileDeepLink: boolean): Auth07Input {
  return { expiredKeyOrHostileDeepLink };
}

describe('TEST-AUTH-07 — expired key or hostile deep link requires safe reauthentication', () => {
  it('expiredKeyOrHostileDeepLink true => unauthorized 403', async () => {
    const receipt = await exchangeMobileCode(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('unauthorized');
    expect(receipt.error.status).toBe(403);
  });

  it('non-hostile path still 503 CAPABILITY_UNAVAILABLE (no mobile session)', async () => {
    const receipt = await exchangeMobileCode(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('CAPABILITY_UNAVAILABLE');
    expect(receipt.error.status).toBe(503);
  });
});
