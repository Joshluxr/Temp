import type { UUID } from '@kita/contracts';
import type { Ext02CommandContext, Ext02Input } from '../../packages/contracts/src/treasury.ts';
import { describe, expect, it } from 'vitest';

import { settleCustodyLeg } from '../../packages/domain/treasury/settle-custody-leg.ts';

function ctx(): Ext02CommandContext {
  return Object.freeze({
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
  });
}

function body(
  unauthorizedCustodyMovement: boolean,
  assetOrNetworkPolicyMismatch: boolean,
  depegOrReorgDetected: boolean,
  settlementUncertain: boolean,
): Ext02Input {
  return Object.freeze({
    unauthorizedCustodyMovement,
    assetOrNetworkPolicyMismatch,
    depegOrReorgDetected,
    settlementUncertain,
  });
}

function expected(
  unauthorizedCustodyMovement: boolean,
  assetOrNetworkPolicyMismatch: boolean,
  depegOrReorgDetected: boolean,
  settlementUncertain: boolean,
): { code: string; status: number; retryable: boolean; detail: string } {
  if (unauthorizedCustodyMovement) {
    return {
      code: 'unauthorized',
      status: 403,
      retryable: false,
      detail: 'T-EXT-02 institutional custody movement is not authorized',
    };
  }
  if (assetOrNetworkPolicyMismatch) {
    return {
      code: 'CAPABILITY_UNAVAILABLE',
      status: 409,
      retryable: false,
      detail: 'T-EXT-02 custody asset or network policy mismatch blocks settlement',
    };
  }
  if (depegOrReorgDetected) {
    return {
      code: 'CAPABILITY_UNAVAILABLE',
      status: 409,
      retryable: false,
      detail: 'T-EXT-02 depeg or reorganization blocks custody settlement',
    };
  }
  if (settlementUncertain) {
    return {
      code: 'PROVIDER_OUTCOME_UNKNOWN',
      status: 409,
      retryable: false,
      detail: 'T-EXT-02 custody or fiat settlement remains uncertain; no available PHP cash is established',
    };
  }
  return {
    code: 'dependency_unavailable',
    status: 503,
    retryable: true,
    detail:
      'T-EXT-02 settleCustodyLeg cannot persist custody or fiat settlement or grant financial authority: T-CORE-02 and T-LEDGER-02 remain HOLD; DEP-11 is not cleared (fail closed)',
  };
}

const combos: ReadonlyArray<readonly [boolean, boolean, boolean, boolean]> = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(
  (n) =>
    [
      Boolean(n & 8),
      Boolean(n & 4),
      Boolean(n & 2),
      Boolean(n & 1),
    ] as const,
);

describe('TEST-EXT-02 — settleCustodyLeg never produces available PHP cash', () => {
  it.each(combos)(
    'unauth=%s mismatch=%s depeg=%s uncertain=%s',
    async (unauthorizedCustodyMovement, assetOrNetworkPolicyMismatch, depegOrReorgDetected, settlementUncertain) => {
      const input = body(
        unauthorizedCustodyMovement,
        assetOrNetworkPolicyMismatch,
        depegOrReorgDetected,
        settlementUncertain,
      );
      const context = ctx();
      const want = expected(
        unauthorizedCustodyMovement,
        assetOrNetworkPolicyMismatch,
        depegOrReorgDetected,
        settlementUncertain,
      );
      const first = await settleCustodyLeg(context, input);
      const second = await settleCustodyLeg(context, input);
      expect(input).toEqual(
        body(
          unauthorizedCustodyMovement,
          assetOrNetworkPolicyMismatch,
          depegOrReorgDetected,
          settlementUncertain,
        ),
      );
      expect(context).toEqual(ctx());
      expect(first).toEqual({
        ok: false,
        error: want,
      });
      expect(second).toEqual(first);
      expect('value' in first).toBe(false);
    },
  );
});
