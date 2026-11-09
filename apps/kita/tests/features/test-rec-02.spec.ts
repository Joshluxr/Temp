import type { UUID } from '@kita/contracts';
import type { Rec01CommandContext, Rec02Input } from '../../packages/contracts/src/recipients.ts';
import { describe, expect, it } from 'vitest';

import { validateWalletRecipient } from '../../packages/domain/recipients/validate-wallet-recipient.ts';

const WALLET_ID = '09XXXXXXXXX';

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

function body(wrongNetwork: boolean, validationExpired: boolean): Rec02Input {
  return {
    recipientId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' as UUID,
    network: 'gcash',
    wrongNetwork,
    validationExpired,
    walletIdentifier: WALLET_ID,
  };
}

describe('TEST-REC-02 — wrong network or expired validation blocks payout', () => {
  it('wrongNetwork => CAPABILITY_UNAVAILABLE 409 even if also expired', async () => {
    const sink = { blob: [] as string[] };
    const receipt = await validateWalletRecipient(ctx(sink), body(true, true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('CAPABILITY_UNAVAILABLE');
    expect(receipt.error.status).toBe(409);
    expect(receipt.error.retryable).toBe(false);
    expect(JSON.stringify({ receipt, sink })).not.toContain(WALLET_ID);
  });

  it('validationExpired => RECIPIENT_VERSION_CHANGED 409', async () => {
    const receipt = await validateWalletRecipient(ctx(), body(false, true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('RECIPIENT_VERSION_CHANGED');
    expect(receipt.error.status).toBe(409);
  });

  it('valid flags still 503 (catalog not implemented, no payout)', async () => {
    const sink = { blob: [] as string[] };
    const receipt = await validateWalletRecipient(ctx(sink), body(false, false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
    expect(JSON.stringify({ receipt, sink })).not.toContain(WALLET_ID);
  });
});
