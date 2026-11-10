/**
 * @kita/domain — convert-wallet (T-WAL-04).
 *
 * Pure fail-closed checker. Four currency legs must balance and the exact
 * target obligation must be funded. Never ok:true. Never convert.
 * T-QUOTE-01 remains HOLD.
 */

import type { Wal04CommandContext, Wal04Input, Wal04Output } from '../../contracts/src/wallets.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const CONVERT_WALLET_UNBALANCED_DETAIL =
  'Four currency legs must balance and the exact target obligation must be funded.';

export const CONVERT_WALLET_UNAVAILABLE_DETAIL =
  'T-WAL-04 convertWallet cannot complete: quotes/journals store is not implemented (fail closed); T-QUOTE-01 HOLD';

export async function convertWallet(
  ctx: Wal04CommandContext,
  input: Wal04Input,
): Promise<Result<Wal04Output, Problem>> {
  ctx.trace('convert_wallet_fail_closed', {
    fourCurrencyLegsUnbalancedOrUnconfirmedTarget: input.fourCurrencyLegsUnbalancedOrUnconfirmedTarget,
  });
  if (input.fourCurrencyLegsUnbalancedOrUnconfirmedTarget) {
    return err(problem('INSUFFICIENT_FUNDS', 409, false, CONVERT_WALLET_UNBALANCED_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, CONVERT_WALLET_UNAVAILABLE_DETAIL));
}
