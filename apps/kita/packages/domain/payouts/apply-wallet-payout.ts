/**
 * @kita/domain — apply-wallet-payout (T-PAY-03).
 *
 * Pure fail-closed checker. Accepted request is not recipient credited.
 * Never ok:true. Never dispatch GCash/Maya credit.
 */

import type { Pay03Input, Pay03Output, Pay06CommandContext } from '../../contracts/src/payouts.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const APPLY_WALLET_PAYOUT_ACCEPTED_DETAIL =
  'T-PAY-03 accepted request is not recipient credited';

export const APPLY_WALLET_PAYOUT_UNAVAILABLE_DETAIL =
  'T-PAY-03 applyWalletPayout cannot complete: wallet-payout proof store is not implemented (fail closed)';

export async function applyWalletPayout(
  ctx: Pay06CommandContext,
  input: Pay03Input,
): Promise<Result<Pay03Output, Problem>> {
  ctx.trace('apply_wallet_payout_fail_closed', {
    acceptedRequestMarksRecipientCredited: input.acceptedRequestMarksRecipientCredited,
  });
  if (input.acceptedRequestMarksRecipientCredited) {
    return err(problem('PROVIDER_OUTCOME_UNKNOWN', 409, false, APPLY_WALLET_PAYOUT_ACCEPTED_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, APPLY_WALLET_PAYOUT_UNAVAILABLE_DETAIL));
}
