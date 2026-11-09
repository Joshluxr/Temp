import type { UUID } from '@kita/contracts';
import type { Adm01CommandContext, Adm02Input } from '../../packages/contracts/src/admin.ts';
import { describe, expect, it } from 'vitest';

import { queryOpsQueue } from '../../packages/domain/admin/query-ops-queue.ts';

function ctx(): Adm01CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(staffAuthorized: boolean): Adm02Input {
  return { staffAuthorized };
}

describe('TEST-ADM-02 — ops queue does not invent rows or mutation rights', () => {
  it('staffAuthorized false => unauthorized 403', async () => {
    const receipt = await queryOpsQueue(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('unauthorized');
    expect(receipt.error.status).toBe(403);
  });

  it('staffAuthorized true still 503 (no invented transfers)', async () => {
    const receipt = await queryOpsQueue(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
