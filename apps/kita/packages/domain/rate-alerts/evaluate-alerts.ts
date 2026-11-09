/**
 * @kita/domain — evaluate-alerts (T-GROW-05).
 *
 * Pure fail-closed checker. Oscillating or stale rate does not spam or execute money.
 * Never ok:true. No spend authority.
 */

import type { Grow05CommandContext, Grow05Input, Grow05Output } from '../../contracts/src/rate-alerts.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const EVALUATE_ALERTS_STALE_DETAIL =
  'Oscillating or stale rate does not spam or execute money.';

export const EVALUATE_ALERTS_UNAVAILABLE_DETAIL =
  'T-GROW-05 evaluateAlerts cannot complete: rate-alert store is not implemented (fail closed); T-QUOTE-04 HOLD';

export async function evaluateAlerts(
  ctx: Grow05CommandContext,
  input: Grow05Input,
): Promise<Result<Grow05Output, Problem>> {
  ctx.trace('evaluate_alerts_fail_closed', {
    oscillatingOrStaleRate: input.oscillatingOrStaleRate,
  });
  if (input.oscillatingOrStaleRate) {
    return err(problem('RATE_STALE', 409, false, EVALUATE_ALERTS_STALE_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, EVALUATE_ALERTS_UNAVAILABLE_DETAIL));
}
