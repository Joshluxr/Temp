/**
 * @kita/domain — route-payout (T-PAY-01).
 *
 * Pure fail-closed checker. Unknown first provider blocks second payout.
 * Never ok:true. Never dispatch a payout.
 */

import type { Pay01Input, Pay01Output, Pay06CommandContext } from '../../contracts/src/payouts.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const ROUTE_PAYOUT_UNKNOWN_FIRST_DETAIL =
  'T-PAY-01 unknown first provider blocks second payout';

export const ROUTE_PAYOUT_UNAVAILABLE_DETAIL =
  'T-PAY-01 routePayout cannot complete: routing/liquidity store is not implemented (fail closed)';

export async function routePayout(
  ctx: Pay06CommandContext,
  input: Pay01Input,
): Promise<Result<Pay01Output, Problem>> {
  ctx.trace('route_payout_fail_closed', {
    unknownFirstProviderWouldDispatchSecond: input.unknownFirstProviderWouldDispatchSecond,
  });
  if (input.unknownFirstProviderWouldDispatchSecond) {
    return err(problem('PROVIDER_OUTCOME_UNKNOWN', 409, false, ROUTE_PAYOUT_UNKNOWN_FIRST_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, ROUTE_PAYOUT_UNAVAILABLE_DETAIL));
}
