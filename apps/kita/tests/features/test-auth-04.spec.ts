import type { UUID } from '@kita/contracts';
import type { Auth01CommandContext, Auth04Input } from '../../packages/contracts/src/identity.ts';
import { describe, expect, it } from 'vitest';

import { recoverAccount } from '../../packages/domain/identity/recover-account.ts';

function ctx(): Auth01CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(bypassNewDestinationHold: boolean): Auth04Input {
  return { bypassNewDestinationHold };
}

describe('TEST-AUTH-04 — recovery cannot bypass new-destination hold', () => {
  it('bypassNewDestinationHold true => COMPLIANCE_HOLD 409', async () => {
    const receipt = await recoverAccount(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('COMPLIANCE_HOLD');
    expect(receipt.error.status).toBe(409);
  });

  it('non-bypass path still 503 (no recovered session)', async () => {
    const receipt = await recoverAccount(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
