/**
 * @kita/domain — describe-delivery (T-PUB-04).
 *
 * Pure fail-closed checker. Fee and deadline must agree with accepted terms.
 * Never ok:true. Never disclose fees/deadlines that disagree with accepted terms.
 */

import type { Pub01CommandContext, Pub04Input, Pub04Output } from '../../contracts/src/catalog.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const DESCRIBE_DELIVERY_MISMATCH_DETAIL =
  'Fee and deadline must agree with accepted terms.';

export const DESCRIBE_DELIVERY_UNAVAILABLE_DETAIL =
  'T-PUB-04 describeDelivery cannot complete: pricing/calendar store is not implemented (fail closed); T-QUOTE-03 HOLD';

export async function describeDelivery(
  ctx: Pub01CommandContext,
  input: Pub04Input,
): Promise<Result<Pub04Output, Problem>> {
  ctx.trace('describe_delivery_fail_closed', {
    feeOrDeadlineMismatch: input.feeOrDeadlineMismatch,
  });
  if (input.feeOrDeadlineMismatch) {
    return err(problem('POLICY_UNAVAILABLE', 409, false, DESCRIBE_DELIVERY_MISMATCH_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, DESCRIBE_DELIVERY_UNAVAILABLE_DETAIL));
}
