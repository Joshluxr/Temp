import type { UUID } from '@kita/contracts';
import type { Plat08CommandContext, Plat08Input } from '../../packages/contracts/src/platform.ts';
import { describe, expect, it } from 'vitest';

import { recoverFinancialAuthority } from '../../packages/platform/recover-financial-authority.ts';

function ctx(): Plat08CommandContext {
  return Object.freeze({
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
  });
}

function body(
  unauthorizedReopen: boolean,
  oldWriterNotFenced: boolean,
  uncertaintyWindowUnreconciled: boolean,
): Plat08Input {
  return Object.freeze({ unauthorizedReopen, oldWriterNotFenced, uncertaintyWindowUnreconciled });
}

function assertErrorOnly(
  receipt: Awaited<ReturnType<typeof recoverFinancialAuthority>>,
  code: string,
  status: number,
  retryable: boolean,
  detail: string,
): void {
  expect(receipt).toEqual({
    ok: false,
    error: {
      code,
      status,
      retryable,
      detail,
    },
  });
}

describe('TEST-PLAT-08 — recoverFinancialAuthority never reopens submission', () => {
  const unauthorizedCombos: ReadonlyArray<readonly [boolean, boolean, boolean]> = [
    [true, false, false],
    [true, false, true],
    [true, true, false],
    [true, true, true],
  ];

  it.each(unauthorizedCombos)(
    'unauthorizedReopen=%s oldWriterNotFenced=%s uncertaintyWindowUnreconciled=%s => unauthorized 403',
    async (unauthorizedReopen, oldWriterNotFenced, uncertaintyWindowUnreconciled) => {
      const input = body(unauthorizedReopen, oldWriterNotFenced, uncertaintyWindowUnreconciled);
      const context = ctx();
      const first = await recoverFinancialAuthority(context, input);
      const second = await recoverFinancialAuthority(context, input);
      expect(input).toEqual(body(unauthorizedReopen, oldWriterNotFenced, uncertaintyWindowUnreconciled));
      expect(context).toEqual(ctx());
      assertErrorOnly(
        first,
        'unauthorized',
        403,
        false,
        'T-PLAT-08 financial reopen is not authorized',
      );
      expect(second).toEqual(first);
    },
  );

  const fenceCombos: ReadonlyArray<readonly [boolean, boolean]> = [
    [true, false],
    [true, true],
  ];

  it.each(fenceCombos)(
    'oldWriterNotFenced=%s uncertaintyWindowUnreconciled=%s (authorized) => stale_or_conflicting_command 409',
    async (oldWriterNotFenced, uncertaintyWindowUnreconciled) => {
      const input = body(false, oldWriterNotFenced, uncertaintyWindowUnreconciled);
      const context = ctx();
      const receipt = await recoverFinancialAuthority(context, input);
      expect(input).toEqual(body(false, oldWriterNotFenced, uncertaintyWindowUnreconciled));
      expect(context).toEqual(ctx());
      assertErrorOnly(
        receipt,
        'stale_or_conflicting_command',
        409,
        false,
        'T-PLAT-08 former writer is not independently fenced; financial submission cannot reopen',
      );
    },
  );

  it('uncertaintyWindowUnreconciled only => PROVIDER_OUTCOME_UNKNOWN 409', async () => {
    const input = body(false, false, true);
    const context = ctx();
    const receipt = await recoverFinancialAuthority(context, input);
    expect(input).toEqual(body(false, false, true));
    expect(context).toEqual(ctx());
    assertErrorOnly(
      receipt,
      'PROVIDER_OUTCOME_UNKNOWN',
      409,
      false,
      'T-PLAT-08 uncertainty window is not independently reconciled; provider outcomes remain unknown',
    );
  });

  it('all flags false => 503 with exact hold detail and no success payload', async () => {
    const input = body(false, false, false);
    const context = ctx();
    const first = await recoverFinancialAuthority(context, input);
    const second = await recoverFinancialAuthority(context, input);
    expect(input).toEqual(body(false, false, false));
    expect(context).toEqual(ctx());
    assertErrorOnly(
      first,
      'dependency_unavailable',
      503,
      true,
      'T-PLAT-08 recoverFinancialAuthority cannot persist recovery or grant financial submission authority: recovery stores are unavailable; T-CORE-02 and T-LEDGER-02 remain HOLD (fail closed)',
    );
    expect(second).toEqual(first);
    expect('value' in first).toBe(false);
  });
});
