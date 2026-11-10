/**
 * @kita/domain — apply-card-evidence (T-FUND-03).
 *
 * Pure fail-closed checker. Authorization posts no cash and capture remains
 * receivable. Never ok:true. Never settle. T-LEDGER-02 remains HOLD.
 */

import type { Fund03CommandContext, Fund03Input, Fund03Output } from '../../contracts/src/funding.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const APPLY_CARD_EVIDENCE_CASH_DETAIL =
  'Authorization posts no cash and capture remains receivable.';

export const APPLY_CARD_EVIDENCE_UNAVAILABLE_DETAIL =
  'T-FUND-03 applyCardEvidence cannot complete: card/journals store is not implemented (fail closed); T-LEDGER-02 HOLD';

export async function applyCardEvidence(
  ctx: Fund03CommandContext,
  input: Fund03Input,
): Promise<Result<Fund03Output, Problem>> {
  ctx.trace('apply_card_evidence_fail_closed', {
    authorizationWouldPostCashOrCaptureLabeledBankCash:
      input.authorizationWouldPostCashOrCaptureLabeledBankCash,
  });
  if (input.authorizationWouldPostCashOrCaptureLabeledBankCash) {
    return err(problem('POLICY_UNAVAILABLE', 409, false, APPLY_CARD_EVIDENCE_CASH_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, APPLY_CARD_EVIDENCE_UNAVAILABLE_DETAIL));
}
