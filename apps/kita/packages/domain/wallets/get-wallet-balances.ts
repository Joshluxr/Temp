/**
 * @kita/domain — get-wallet-balances (T-WAL-01).
 *
 * Pure fail-closed checker. Projection and ledger must agree per currency;
 * aggregate agreement cannot mask a disagreement in any currency.
 * Never ok:true. Never spendable balances. T-LEDGER-02 remains HOLD.
 */

import type { Wal01CommandContext, Wal01Input, Wal01Output } from '../../contracts/src/wallets.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const GET_WALLET_BALANCES_DISAGREE_DETAIL =
  'T-WAL-01 projection and ledger disagree per currency; aggregate agreement cannot mask a currency disagreement';

export const GET_WALLET_BALANCES_UNAVAILABLE_DETAIL =
  'T-WAL-01 getWalletBalances cannot complete: ledger_accounts store is not implemented (fail closed); T-LEDGER-02 HOLD';

export async function getWalletBalances(
  ctx: Wal01CommandContext,
  input: Wal01Input,
): Promise<Result<Wal01Output, Problem>> {
  ctx.trace('get_wallet_balances_fail_closed', {
    projectionLedgerDisagree: input.projectionLedgerDisagree,
  });
  if (input.projectionLedgerDisagree) {
    return err(problem('CAPABILITY_UNAVAILABLE', 409, false, GET_WALLET_BALANCES_DISAGREE_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, GET_WALLET_BALANCES_UNAVAILABLE_DETAIL));
}
