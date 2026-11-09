import type { UUID } from '@kita/contracts';
import type { Adm01CommandContext, Adm07Input } from '../../packages/contracts/src/admin.ts';
import { describe, expect, it } from 'vitest';

import { ingestManualEvidence } from '../../packages/domain/admin/ingest-manual-evidence.ts';

function ctx(): Adm01CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(missingVerifiedEvidence: boolean, missingReviewer: boolean): Adm07Input {
  return { missingVerifiedEvidence, missingReviewer };
}

describe('TEST-ADM-07 — no manual paid without verified evidence and reviewer', () => {
  it('missingVerifiedEvidence => APPROVAL_REQUIRED 409', async () => {
    const receipt = await ingestManualEvidence(ctx(), body(true, false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('APPROVAL_REQUIRED');
    expect(receipt.error.status).toBe(409);
    expect(receipt.error.retryable).toBe(false);
  });

  it('missingReviewer => APPROVAL_REQUIRED 409', async () => {
    const receipt = await ingestManualEvidence(ctx(), body(false, true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('APPROVAL_REQUIRED');
  });

  it('both missing => APPROVAL_REQUIRED 409', async () => {
    const receipt = await ingestManualEvidence(ctx(), body(true, true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('APPROVAL_REQUIRED');
  });

  it('complete flags still 503 and not paid', async () => {
    const receipt = await ingestManualEvidence(ctx(), body(false, false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
