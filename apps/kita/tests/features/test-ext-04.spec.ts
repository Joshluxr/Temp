import type { UUID } from '@kita/contracts';
import type { Ext04CommandContext, Ext04Input } from '../../packages/contracts/src/business.ts';
import { describe, expect, it } from 'vitest';

import { executeBatch } from '../../packages/domain/business/execute-batch.ts';

function ctx(): Ext04CommandContext {
  return Object.freeze({
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
  });
}

function body(
  unauthorizedBatchExecution: boolean,
  approvalStale: boolean,
  limitExceeded: boolean,
  paidItemWouldBeRetried: boolean,
  itemSubmissionUncertain: boolean,
): Ext04Input {
  return Object.freeze({
    unauthorizedBatchExecution,
    approvalStale,
    limitExceeded,
    paidItemWouldBeRetried,
    itemSubmissionUncertain,
  });
}

function expected(
  unauthorizedBatchExecution: boolean,
  approvalStale: boolean,
  limitExceeded: boolean,
  paidItemWouldBeRetried: boolean,
  itemSubmissionUncertain: boolean,
): { code: string; status: number; retryable: boolean; detail: string } {
  if (unauthorizedBatchExecution) {
    return {
      code: 'unauthorized',
      status: 403,
      retryable: false,
      detail: 'T-EXT-04 batch execution is not authorized',
    };
  }
  if (approvalStale) {
    return {
      code: 'APPROVAL_STALE',
      status: 409,
      retryable: false,
      detail: 'T-EXT-04 batch approval is stale or no longer binds the ordered items and currency totals',
    };
  }
  if (limitExceeded) {
    return {
      code: 'LIMIT_EXCEEDED',
      status: 409,
      retryable: false,
      detail: 'T-EXT-04 supplied item or aggregate limit breach blocks batch execution',
    };
  }
  if (paidItemWouldBeRetried) {
    return {
      code: 'stale_or_conflicting_command',
      status: 409,
      retryable: false,
      detail: 'T-EXT-04 a paid batch item cannot be retried',
    };
  }
  if (itemSubmissionUncertain) {
    return {
      code: 'PROVIDER_OUTCOME_UNKNOWN',
      status: 409,
      retryable: false,
      detail: 'T-EXT-04 item submission remains uncertain; no retry is authorized',
    };
  }
  return {
    code: 'dependency_unavailable',
    status: 503,
    retryable: true,
    detail:
      'T-EXT-04 executeBatch cannot persist batch or item state or grant payout authority: T-CORE-02 and T-LEDGER-02 remain HOLD; DEP-12 is not cleared (fail closed)',
  };
}

const combos: ReadonlyArray<readonly [boolean, boolean, boolean, boolean, boolean]> = Array.from(
  { length: 32 },
  (_, n) =>
    [
      Boolean(n & 16),
      Boolean(n & 8),
      Boolean(n & 4),
      Boolean(n & 2),
      Boolean(n & 1),
    ] as const,
);

describe('TEST-EXT-04 — executeBatch never pays, retries paid items, or grants payout', () => {
  it.each(combos)(
    'unauth=%s stale=%s limit=%s paidRetry=%s uncertain=%s',
    async (
      unauthorizedBatchExecution,
      approvalStale,
      limitExceeded,
      paidItemWouldBeRetried,
      itemSubmissionUncertain,
    ) => {
      const input = body(
        unauthorizedBatchExecution,
        approvalStale,
        limitExceeded,
        paidItemWouldBeRetried,
        itemSubmissionUncertain,
      );
      const context = ctx();
      const want = expected(
        unauthorizedBatchExecution,
        approvalStale,
        limitExceeded,
        paidItemWouldBeRetried,
        itemSubmissionUncertain,
      );
      const first = await executeBatch(context, input);
      const second = await executeBatch(context, input);
      expect(input).toEqual(
        body(
          unauthorizedBatchExecution,
          approvalStale,
          limitExceeded,
          paidItemWouldBeRetried,
          itemSubmissionUncertain,
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
