/**
 * @kita/domain — resolve-bank-route (T-PAY-02).
 *
 * Pure fail-closed checker. Cutoff/holiday and amount cannot be bypassed by splitting.
 * Never ok:true. Never dispatch InstaPay/PESONet.
 */

import type { Pay02Input, Pay02Output, Pay06CommandContext } from '../../contracts/src/payouts.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const RESOLVE_BANK_ROUTE_SPLIT_DETAIL =
  'T-PAY-02 cutoff/holiday and amount cannot be bypassed by splitting';

export const RESOLVE_BANK_ROUTE_UNAVAILABLE_DETAIL =
  'T-PAY-02 resolveBankRoute cannot complete: calendar/capability store is not implemented (fail closed)';

export async function resolveBankRoute(
  ctx: Pay06CommandContext,
  input: Pay02Input,
): Promise<Result<Pay02Output, Problem>> {
  ctx.trace('resolve_bank_route_fail_closed', {
    splitBypassesCutoffHolidayOrAmount: input.splitBypassesCutoffHolidayOrAmount,
  });
  if (input.splitBypassesCutoffHolidayOrAmount) {
    return err(problem('LIMIT_EXCEEDED', 409, false, RESOLVE_BANK_ROUTE_SPLIT_DETAIL));
  }
  return err(problem('CAPABILITY_UNAVAILABLE', 503, true, RESOLVE_BANK_ROUTE_UNAVAILABLE_DETAIL));
}
