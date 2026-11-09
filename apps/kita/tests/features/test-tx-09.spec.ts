import type { UUID } from '@kita/contracts';
import type { Tx08CommandContext, Tx09Input } from '../../packages/contracts/src/transfers.ts';
import { describe, expect, it } from 'vitest';

import { respondToRfi } from '../../packages/domain/transfers/respond-to-rfi.ts';

function ctx(): Tx08CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(confidentialRiskInPublicProjection: boolean): Tx09Input {
  return { confidentialRiskInPublicProjection };
}

describe('TEST-TX-09 — confidential risk details absent from public projection', () => {
  it('confidentialRiskInPublicProjection true => unauthorized 403', async () => {
    const receipt = await respondToRfi(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('unauthorized');
    expect(receipt.error.status).toBe(403);
    expect(JSON.stringify(receipt.error)).not.toMatch(/pep|sar|typology|match-score/i);
  });

  it('non-leak path still 503 (RFI store unimplemented)', async () => {
    const receipt = await respondToRfi(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
