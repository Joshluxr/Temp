import type { UUID } from '@kita/contracts';
import type { Adm01CommandContext, Adm01Input } from '../../packages/contracts/src/admin.ts';
import { describe, expect, it } from 'vitest';

import { authorizeStaff } from '../../packages/domain/admin/authorize-staff.ts';

function ctx(): Adm01CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(audience: Adm01Input['audience'], unrelatedEntity: boolean): Adm01Input {
  return { audience, unrelatedEntity };
}

describe('TEST-ADM-01 — customer token and unrelated entity denied', () => {
  it('customer audience => unauthorized 403', async () => {
    const receipt = await authorizeStaff(ctx(), body('customer', false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('unauthorized');
    expect(receipt.error.status).toBe(403);
  });

  it('staff + unrelatedEntity => unauthorized 403', async () => {
    const receipt = await authorizeStaff(ctx(), body('staff', true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('unauthorized');
    expect(receipt.error.status).toBe(403);
  });

  it('customer + unrelatedEntity still 403 (customer takes precedence)', async () => {
    const receipt = await authorizeStaff(ctx(), body('customer', true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('unauthorized');
  });

  it('staff related entity still 503 (SSO not implemented, no session)', async () => {
    const receipt = await authorizeStaff(ctx(), body('staff', false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
