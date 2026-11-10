import type { UUID } from '@kita/contracts';
import type { Fin03CommandContext, Fin03Input } from '../../packages/contracts/src/reconciliation.ts';
import { describe, expect, it } from 'vitest';

import { reconcileStatements } from '../../packages/domain/reconciliation/reconcile-statements.ts';

function ctx(): Fin03CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(threeWayMismatchWouldForceBalance: boolean): Fin03Input {
  return { threeWayMismatchWouldForceBalance };
}

describe('TEST-FIN-03 — three-way mismatch cannot force a balanced book', () => {
  it('threeWayMismatchWouldForceBalance true => VERSION_CONFLICT 409', async () => {
    const receipt = await reconcileStatements(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('VERSION_CONFLICT');
    expect(receipt.error.status).toBe(409);
  });

  it('otherwise 503 (no reconciling journal; T-FIN-01 HOLD)', async () => {
    const receipt = await reconcileStatements(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
