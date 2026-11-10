import type { UUID } from '@kita/contracts';
import type { Fin04CommandContext, Fin04Input } from '../../packages/contracts/src/reconciliation.ts';
import { describe, expect, it } from 'vitest';

import { resolveBreak } from '../../packages/domain/reconciliation/resolve-break.ts';

function ctx(): Fin04CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(forceMatchWithoutApprovedJournal: boolean): Fin04Input {
  return { forceMatchWithoutApprovedJournal };
}

describe('TEST-FIN-04 — force match impossible without approved journal', () => {
  it('forceMatchWithoutApprovedJournal true => POLICY_UNAVAILABLE 409', async () => {
    const receipt = await resolveBreak(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('POLICY_UNAVAILABLE');
    expect(receipt.error.status).toBe(409);
  });

  it('otherwise 503 (no force-match; T-FIN-01 HOLD)', async () => {
    const receipt = await resolveBreak(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
