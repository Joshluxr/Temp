/**
 * @kita/domain — apply-cash-pickup (T-PAY-04).
 *
 * Pure fail-closed checker. Available and collected differ; expiry alone never fabricates return.
 * Never ok:true.
 */

import type { Pay04Input, Pay04Output, Pay06CommandContext } from '../../contracts/src/payouts.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const APPLY_CASH_PICKUP_EXPIRY_DETAIL =
  'T-PAY-04 available and collected differ; expiry alone never fabricates return';

export const APPLY_CASH_PICKUP_UNAVAILABLE_DETAIL =
  'T-PAY-04 applyCashPickup cannot complete: pickup/collection store is not implemented (fail closed)';

export async function applyCashPickup(
  ctx: Pay06CommandContext,
  input: Pay04Input,
): Promise<Result<Pay04Output, Problem>> {
  ctx.trace('apply_cash_pickup_fail_closed', {
    expiryAloneFabricatesReturn: input.expiryAloneFabricatesReturn,
  });
  if (input.expiryAloneFabricatesReturn) {
    return err(problem('PROVIDER_OUTCOME_UNKNOWN', 409, false, APPLY_CASH_PICKUP_EXPIRY_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, APPLY_CASH_PICKUP_UNAVAILABLE_DETAIL));
}
