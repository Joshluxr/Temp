import type { UUID } from '@kita/contracts';
import type { Wal02CommandContext, Wal02Input } from '../../packages/contracts/src/wallets.ts';
import { describe, expect, it } from 'vitest';

import { creditWalletFromEvidence } from '../../packages/domain/wallets/credit-wallet-from-evidence.ts';

function ctx(): Wal02CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: () => undefined,
  };
}

function body(creditWithoutSettlementOrApprovedEvidence: boolean): Wal02Input {
  return { creditWithoutSettlementOrApprovedEvidence };
}

describe('TEST-WAL-02 — no funds credited without settlement/approved evidence', () => {
  it('creditWithoutSettlementOrApprovedEvidence true => FUNDING_PENDING 409', async () => {
    const receipt = await creditWalletFromEvidence(ctx(), body(true));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('FUNDING_PENDING');
    expect(receipt.error.status).toBe(409);
  });

  it('otherwise 503 (no credit; T-FUND-02 HOLD)', async () => {
    const receipt = await creditWalletFromEvidence(ctx(), body(false));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
  });
});
