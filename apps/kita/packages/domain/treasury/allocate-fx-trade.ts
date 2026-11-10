/**
 * @kita/domain — allocate-fx-trade (T-FIN-06).
 *
 * Pure fail-closed checker. Trade allocations equal actual cost and must not
 * drift customer terms. Never ok:true. Never allocate. T-FIN-01 remains HOLD.
 */

import type { Fin06CommandContext, Fin06Input, Fin06Output } from '../../contracts/src/treasury.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const ALLOCATE_FX_TRADE_DRIFT_DETAIL =
  'Trade allocations equal actual cost and no customer terms drift.';

export const ALLOCATE_FX_TRADE_UNAVAILABLE_DETAIL =
  'T-FIN-06 allocateFxTrade cannot complete: FX/treasury store is not implemented (fail closed); T-FIN-01 HOLD';

export async function allocateFxTrade(
  ctx: Fin06CommandContext,
  input: Fin06Input,
): Promise<Result<Fin06Output, Problem>> {
  ctx.trace('allocate_fx_trade_fail_closed', {
    customerTermsDriftFromTradeAllocation: input.customerTermsDriftFromTradeAllocation,
  });
  if (input.customerTermsDriftFromTradeAllocation) {
    return err(problem('POLICY_UNAVAILABLE', 409, false, ALLOCATE_FX_TRADE_DRIFT_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, ALLOCATE_FX_TRADE_UNAVAILABLE_DETAIL));
}
