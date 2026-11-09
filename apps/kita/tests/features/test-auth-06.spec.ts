import type { UUID } from '@kita/contracts';
import type { Auth01CommandContext, Auth06Input } from '../../packages/contracts/src/identity.ts';
import { describe, expect, it } from 'vitest';

import { requestClosure } from '../../packages/domain/identity/request-closure.ts';

function ctx(): Auth01CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(outstandingRefundOrObligation: boolean): Auth06Input {
  return { outstandingRefundOrObligation };
}

describe('TEST-AUTH-06 — closure preserves outstanding refund and lawful records', () => {
  it('outstandingRefundOrObligation true => FUNDING_PENDING 409', async () => {
    const receipt = await requestClosure(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('FUNDING_PENDING');
    expect(receipt.error.status).toBe(409);
  });

  it('no outstanding obligation still 503 (account not closed)', async () => {
    const receipt = await requestClosure(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
