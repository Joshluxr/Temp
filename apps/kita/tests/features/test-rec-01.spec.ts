import type { UUID } from '@kita/contracts';
import type { Rec01CommandContext, Rec01Input } from '../../packages/contracts/src/recipients.ts';
import { describe, expect, it } from 'vitest';

import { createRecipient } from '../../packages/domain/recipients/create-recipient.ts';

const FULL_ACCOUNT = '123456789012';

function ctx(sink?: { blob: string[] }): Rec01CommandContext {
  return {
    actorId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    worker: {
      workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
      attemptGeneration: 1,
      correlationId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' as UUID,
    },
    trace: (message, fields) => {
      sink?.blob.push(JSON.stringify({ message, fields }));
    },
  };
}

function body(serverSideOwned: boolean, clientClaimedValidated: boolean): Rec01Input {
  return {
    customerId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' as UUID,
    serverSideOwned,
    clientClaimedValidated,
    accountNumberFull: FULL_ACCOUNT,
    accountNumberMasked: '************',
  };
}

describe('TEST-REC-01 — ownership and validation enforced server-side', () => {
  it('serverSideOwned false => unauthorized 403 even if clientClaimedValidated', async () => {
    const sink = { blob: [] as string[] };
    const receipt = await createRecipient(ctx(sink), body(false, true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('unauthorized');
    expect(receipt.error.status).toBe(403);
    expect(JSON.stringify({ receipt, sink })).not.toContain(FULL_ACCOUNT);
  });

  it('owned but clientClaimedValidated => CAPABILITY_UNAVAILABLE 409 non-retryable', async () => {
    const receipt = await createRecipient(ctx(), body(true, true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('CAPABILITY_UNAVAILABLE');
    expect(receipt.error.status).toBe(409);
    expect(receipt.error.retryable).toBe(false);
  });

  it('owned and not client-claimed still 503 (catalog not implemented)', async () => {
    const sink = { blob: [] as string[] };
    const receipt = await createRecipient(ctx(sink), body(true, false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
    expect(JSON.stringify({ receipt, sink })).not.toContain(FULL_ACCOUNT);
  });
});
