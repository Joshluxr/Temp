import type { UUID } from '@kita/contracts';
import type { Grow06CommandContext, Grow06Input } from '../../packages/contracts/src/schedules.ts';
import { describe, expect, it } from 'vitest';

import { executeAutoConversion } from '../../packages/domain/schedules/execute-auto-conversion.ts';

function ctx(): Grow06CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(
  revokedMandate: boolean,
  staleRevokeVersion: boolean,
  wouldViolateMandateBounds: boolean,
): Grow06Input {
  return { revokedMandate, staleRevokeVersion, wouldViolateMandateBounds };
}

describe('TEST-GROW-06 — executeAutoConversion never reserves or converts', () => {
  const revokedCombos: ReadonlyArray<readonly [boolean, boolean, boolean]> = [
    [true, false, false],
    [true, false, true],
    [true, true, false],
    [true, true, true],
  ];

  it.each(revokedCombos)(
    'revokedMandate=%s staleRevokeVersion=%s wouldViolateMandateBounds=%s => unauthorized 403',
    async (revokedMandate, staleRevokeVersion, wouldViolateMandateBounds) => {
      const input = body(revokedMandate, staleRevokeVersion, wouldViolateMandateBounds);
      const frozen = { ...input };
      const receipt = await executeAutoConversion(ctx(), input);
      expect(input).toEqual(frozen);
      expect(receipt.ok).toBe(false);
      if (receipt.ok) return;
      expect(receipt.error.code).toBe('unauthorized');
      expect(receipt.error.status).toBe(403);
      expect(receipt.error.retryable).toBe(false);
      expect('value' in receipt).toBe(false);
    },
  );

  const staleCombos: ReadonlyArray<readonly [boolean, boolean]> = [
    [true, false],
    [true, true],
  ];

  it.each(staleCombos)(
    'staleRevokeVersion=%s wouldViolateMandateBounds=%s (unrevoked) => VERSION_CONFLICT 409',
    async (staleRevokeVersion, wouldViolateMandateBounds) => {
      const input = body(false, staleRevokeVersion, wouldViolateMandateBounds);
      const frozen = { ...input };
      const receipt = await executeAutoConversion(ctx(), input);
      expect(input).toEqual(frozen);
      expect(receipt.ok).toBe(false);
      if (receipt.ok) return;
      expect(receipt.error.code).toBe('VERSION_CONFLICT');
      expect(receipt.error.status).toBe(409);
      expect(receipt.error.retryable).toBe(false);
    },
  );

  it('wouldViolateMandateBounds only => LIMIT_EXCEEDED 409 without arming the mandate', async () => {
    const input = body(false, false, true);
    const frozen = { ...input };
    const receipt = await executeAutoConversion(ctx(), input);
    expect(input).toEqual(frozen);
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('LIMIT_EXCEEDED');
    expect(receipt.error.status).toBe(409);
    expect(receipt.error.retryable).toBe(false);
    expect(receipt.error.detail).not.toMatch(/armed/i);
    expect(receipt.error.detail).not.toMatch(/paused/i);
  });

  it('all flags false => 503 with no conversion or reservation claim', async () => {
    const input = body(false, false, false);
    const frozen = { ...input };
    const receipt = await executeAutoConversion(ctx(), input);
    expect(input).toEqual(frozen);
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
    expect(receipt.error.retryable).toBe(true);
    expect(receipt.error.detail).toMatch(/T-CORE-02/);
    expect(receipt.error.detail).toMatch(/T-LEDGER-02/);
    expect(receipt.error.detail).not.toMatch(/converted/i);
    expect(receipt.error.detail).not.toMatch(/reserved/i);
    expect('value' in receipt).toBe(false);
  });
});
