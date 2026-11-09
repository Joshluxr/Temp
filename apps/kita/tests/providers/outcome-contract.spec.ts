import { describe, expect, it } from 'vitest';

import { inquire, submit, TRANSPORT_UNIMPLEMENTED_REFERENCE } from '../../packages/providers/transport.ts';
import { verifyWebhook } from '../../packages/providers/evidence.ts';

describe('T-ADAPTER-01 outcome contract — fail closed', () => {
  it('submit is Unknown, never Confirmed or Rejected', async () => {
    const outcome = await submit({
      providerAccountId: 'acct',
      environment: 'sandbox',
      operation: 'payout.create',
      idempotencyReference: 'idem-1',
      payload: {},
    });
    expect(outcome.kind).toBe('Unknown');
    if (outcome.kind !== 'Unknown') return;
    expect(outcome.reference).toBe(TRANSPORT_UNIMPLEMENTED_REFERENCE);
  });

  it('inquire is Unknown, never Confirmed or Rejected', async () => {
    const outcome = await inquire({ providerAccountId: 'acct', externalRef: 'ext-1' });
    expect(outcome.kind).toBe('Unknown');
  });

  it('unsigned webhook is not Verified', () => {
    const raw = new TextEncoder().encode('{"event":"payout"}');
    const result = verifyWebhook(raw, {});
    expect(result.kind).not.toBe('Verified');
    expect(result.kind).toBe('Quarantined');
  });

  it('missing signature header is not Verified', () => {
    const raw = new TextEncoder().encode('body');
    const result = verifyWebhook(raw, { 'content-type': 'application/json' });
    expect(result.kind).not.toBe('Verified');
  });
});
