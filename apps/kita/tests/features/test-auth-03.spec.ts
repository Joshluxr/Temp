import type { UUID } from '@kita/contracts';
import type { Auth01CommandContext, Auth03Input } from '../../packages/contracts/src/identity.ts';
import { describe, expect, it } from 'vitest';

import { requireStepUp } from '../../packages/domain/identity/require-step-up.ts';

function ctx(): Auth01CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(newDestinationWithoutFreshAssurance: boolean): Auth03Input {
  return { newDestinationWithoutFreshAssurance };
}

describe('TEST-AUTH-03 — new destination needs fresh assurance', () => {
  it('newDestinationWithoutFreshAssurance true => APPROVAL_REQUIRED 409', async () => {
    const receipt = await requireStepUp(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('APPROVAL_REQUIRED');
    expect(receipt.error.status).toBe(409);
  });

  it('fresh-assurance path still 503 (no live step-up)', async () => {
    const receipt = await requireStepUp(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
