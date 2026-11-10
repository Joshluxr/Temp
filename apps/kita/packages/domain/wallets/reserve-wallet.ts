/**
 * @kita/domain — reserve-wallet (T-WAL-03).
 *
 * Pure fail-closed checker. Two simultaneous spends cannot overdraw.
 * Never ok:true. Never reserve. T-CORE-02 remains HOLD.
 */

import type { Wal03CommandContext, Wal03Input, Wal03Output } from '../../contracts/src/wallets.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const RESERVE_WALLET_OVERDRAW_DETAIL =
  'Two simultaneous spends cannot overdraw.';

export const RESERVE_WALLET_UNAVAILABLE_DETAIL =
  'T-WAL-03 reserveWallet cannot complete: journals store is not implemented (fail closed); T-CORE-02 HOLD';

export async function reserveWallet(
  ctx: Wal03CommandContext,
  input: Wal03Input,
): Promise<Result<Wal03Output, Problem>> {
  ctx.trace('reserve_wallet_fail_closed', {
    twoSimultaneousSpendsWouldOverdraw: input.twoSimultaneousSpendsWouldOverdraw,
  });
  if (input.twoSimultaneousSpendsWouldOverdraw) {
    return err(problem('INSUFFICIENT_FUNDS', 409, false, RESERVE_WALLET_OVERDRAW_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, RESERVE_WALLET_UNAVAILABLE_DETAIL));
}
