/**
 * @kita/domain — credit-wallet-from-evidence (T-WAL-02).
 *
 * Pure fail-closed checker. No funds credited without real settlement/approved
 * risk evidence. Never ok:true. Never credit. T-FUND-02 remains HOLD.
 */

import type { Wal02CommandContext, Wal02Input, Wal02Output } from '../../contracts/src/wallets.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const CREDIT_WALLET_FROM_EVIDENCE_UNSETTLED_DETAIL =
  'No funds credited without real settlement/approved risk evidence.';

export const CREDIT_WALLET_FROM_EVIDENCE_UNAVAILABLE_DETAIL =
  'T-WAL-02 creditWalletFromEvidence cannot complete: funding/journals store is not implemented (fail closed); T-FUND-02 HOLD';

export async function creditWalletFromEvidence(
  ctx: Wal02CommandContext,
  input: Wal02Input,
): Promise<Result<Wal02Output, Problem>> {
  ctx.trace('credit_wallet_from_evidence_fail_closed', {
    creditWithoutSettlementOrApprovedEvidence: input.creditWithoutSettlementOrApprovedEvidence,
  });
  if (input.creditWithoutSettlementOrApprovedEvidence) {
    return err(problem('FUNDING_PENDING', 409, false, CREDIT_WALLET_FROM_EVIDENCE_UNSETTLED_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, CREDIT_WALLET_FROM_EVIDENCE_UNAVAILABLE_DETAIL));
}
