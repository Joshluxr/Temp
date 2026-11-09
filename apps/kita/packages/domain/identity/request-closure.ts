/**
 * @kita/domain — request-closure (T-AUTH-06).
 *
 * Pure fail-closed checker. Closure preserves outstanding refund and lawful records.
 * Never ok:true. Never close an account or drop outstanding refund/lawful records.
 */

import type { Auth01CommandContext, Auth06Input, Auth06Output } from '../../contracts/src/identity.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const REQUEST_CLOSURE_PENDING_DETAIL =
  'T-AUTH-06 closure preserves outstanding refund and lawful records';

export const REQUEST_CLOSURE_UNAVAILABLE_DETAIL =
  'T-AUTH-06 requestClosure cannot complete: closure/liability store is not implemented (fail closed)';

export async function requestClosure(
  ctx: Auth01CommandContext,
  input: Auth06Input,
): Promise<Result<Auth06Output, Problem>> {
  ctx.trace('request_closure_fail_closed', {
    outstandingRefundOrObligation: input.outstandingRefundOrObligation,
  });
  if (input.outstandingRefundOrObligation) {
    return err(problem('FUNDING_PENDING', 409, false, REQUEST_CLOSURE_PENDING_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, REQUEST_CLOSURE_UNAVAILABLE_DETAIL));
}
