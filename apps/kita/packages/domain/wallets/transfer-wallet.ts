/**
 * @kita/domain — transfer-wallet (T-WAL-06).
 *
 * Pure fail-closed checker. Both parties screened; cross-book unsupported
 * without settlement policy. Never ok:true. Never transfer. T-CORE-02 remains HOLD.
 */

import type { Wal06CommandContext, Wal06Input, Wal06Output } from '../../contracts/src/wallets.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const TRANSFER_WALLET_UNSCREENED_DETAIL =
  'Both parties screened; cross-book unsupported without settlement policy.';

export const TRANSFER_WALLET_UNAVAILABLE_DETAIL =
  'T-WAL-06 transferWallet cannot complete: journals/screening store is not implemented (fail closed); T-CORE-02 HOLD';

export async function transferWallet(
  ctx: Wal06CommandContext,
  input: Wal06Input,
): Promise<Result<Wal06Output, Problem>> {
  ctx.trace('transfer_wallet_fail_closed', {
    unscreenedPartyOrCrossBookWithoutSettlementPolicy:
      input.unscreenedPartyOrCrossBookWithoutSettlementPolicy,
  });
  if (input.unscreenedPartyOrCrossBookWithoutSettlementPolicy) {
    return err(problem('CAPABILITY_UNAVAILABLE', 409, false, TRANSFER_WALLET_UNSCREENED_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, TRANSFER_WALLET_UNAVAILABLE_DETAIL));
}
