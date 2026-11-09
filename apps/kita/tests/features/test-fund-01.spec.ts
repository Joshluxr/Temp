import type { UUID } from '@kita/contracts';
import type { Fund01CommandContext, Fund01Input } from '../../packages/contracts/src/funding.ts';
import { describe, expect, it } from 'vitest';

import { createInstrumentSession } from '../../packages/domain/funding/create-instrument-session.ts';

function ctx(): Fund01CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(rawPanOrCvvPresent: boolean): Fund01Input {
  return { rawPanOrCvvPresent };
}

describe('TEST-FUND-01 — no raw PAN/CVV in app server logs or DB', () => {
  it('rawPanOrCvvPresent true => CAPABILITY_UNAVAILABLE 409', async () => {
    const receipt = await createInstrumentSession(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('CAPABILITY_UNAVAILABLE');
    expect(receipt.error.status).toBe(409);
  });

  it('tokenized path still 503 (no funds collected)', async () => {
    const receipt = await createInstrumentSession(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
