/**
 * @kita/domain — attribute-incoming-cash (T-FUND-07).
 *
 * Pure fail-closed checker. Unowned cash remains suspense not revenue.
 * Never ok:true. T-FIN-03 remains HOLD.
 */

import type { Fund01CommandContext, Fund07Input, Fund07Output } from '../../contracts/src/funding.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const ATTRIBUTE_INCOMING_CASH_REVENUE_DETAIL =
  'T-FUND-07 unowned cash remains suspense not revenue';

export const ATTRIBUTE_INCOMING_CASH_UNAVAILABLE_DETAIL =
  'T-FUND-07 attributeIncomingCash cannot complete: reconciliation/journal store is not implemented (fail closed); T-FIN-03 HOLD';

export async function attributeIncomingCash(
  ctx: Fund01CommandContext,
  input: Fund07Input,
): Promise<Result<Fund07Output, Problem>> {
  ctx.trace('attribute_incoming_cash_fail_closed', {
    unownedCashRecognizedAsRevenue: input.unownedCashRecognizedAsRevenue,
  });
  if (input.unownedCashRecognizedAsRevenue) {
    return err(problem('POLICY_UNAVAILABLE', 409, false, ATTRIBUTE_INCOMING_CASH_REVENUE_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, ATTRIBUTE_INCOMING_CASH_UNAVAILABLE_DETAIL));
}
