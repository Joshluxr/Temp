/**
 * @kita/domain — reserve-liquidity (T-FIN-05).
 *
 * Pure fail-closed checker. Concurrent transfers cannot spend the same last
 * prefund. Never ok:true. Never create a reservation. T-LEDGER-02 remains HOLD.
 */

import type { Fin05CommandContext, Fin05Input, Fin05Output } from '../../contracts/src/treasury.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const RESERVE_LIQUIDITY_DOUBLE_SPEND_DETAIL =
  'Concurrent transfers cannot spend the same last prefund.';

export const RESERVE_LIQUIDITY_UNAVAILABLE_DETAIL =
  'T-FIN-05 reserveLiquidity cannot complete: liquidity/ledger store is not implemented (fail closed); T-LEDGER-02 HOLD';

export async function reserveLiquidity(
  ctx: Fin05CommandContext,
  input: Fin05Input,
): Promise<Result<Fin05Output, Problem>> {
  ctx.trace('reserve_liquidity_fail_closed', {
    concurrentSpendSameLastPrefund: input.concurrentSpendSameLastPrefund,
  });
  if (input.concurrentSpendSameLastPrefund) {
    return err(problem('LIQUIDITY_UNAVAILABLE', 409, false, RESERVE_LIQUIDITY_DOUBLE_SPEND_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, RESERVE_LIQUIDITY_UNAVAILABLE_DETAIL));
}
