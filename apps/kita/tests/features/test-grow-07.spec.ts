import type { UUID } from '@kita/contracts';
import type { Grow07CommandContext, Grow07Input } from '../../packages/contracts/src/notifications.ts';
import { describe, expect, it } from 'vitest';

import { sendNotification } from '../../packages/domain/notifications/send-notification.ts';

function ctx(): Grow07CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(duplicateEventPerChannel: boolean): Grow07Input {
  return { duplicateEventPerChannel };
}

describe('TEST-GROW-07 — duplicate event gives one intended message per channel', () => {
  it('duplicateEventPerChannel true => CAPABILITY_UNAVAILABLE 409', async () => {
    const receipt = await sendNotification(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('CAPABILITY_UNAVAILABLE');
    expect(receipt.error.status).toBe(409);
  });

  it('first-attempt path still 503 (no vendor send)', async () => {
    const receipt = await sendNotification(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
