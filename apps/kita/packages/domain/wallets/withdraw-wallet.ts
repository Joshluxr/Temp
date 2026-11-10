/**
 * @kita/domain — withdraw-wallet (T-WAL-05).
 *
 * Pure fail-closed checker. Failed refund retains obligation; closure cannot
 * lose remaining funds. Never ok:true. Never drop funds. T-TX-06 remains HOLD.
 */

import type { Wal05CommandContext, Wal05Input, Wal05Output } from '../../contracts/src/wallets.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const WITHDRAW_WALLET_DROP_DETAIL =
  'Failed refund retains obligation; closure cannot lose remaining funds.';

export const WITHDRAW_WALLET_UNAVAILABLE_DETAIL =
  'T-WAL-05 withdrawWallet cannot complete: refund store is not implemented (fail closed); T-TX-06 HOLD';

export async function withdrawWallet(
  ctx: Wal05CommandContext,
  input: Wal05Input,
): Promise<Result<Wal05Output, Problem>> {
  ctx.trace('withdraw_wallet_fail_closed', {
    failedRefundDropsObligationOrClosureLosesFunds: input.failedRefundDropsObligationOrClosureLosesFunds,
  });
  if (input.failedRefundDropsObligationOrClosureLosesFunds) {
    return err(problem('COMPLIANCE_HOLD', 409, false, WITHDRAW_WALLET_DROP_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, WITHDRAW_WALLET_UNAVAILABLE_DETAIL));
}
