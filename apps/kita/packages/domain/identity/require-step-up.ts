/**
 * @kita/domain — require-step-up (T-AUTH-03).
 *
 * Pure fail-closed checker. New destination needs fresh assurance.
 * Never ok:true. Never bind a live step-up or authorize a financial action.
 */

import type { Auth01CommandContext, Auth03Input, Auth03Output } from '../../contracts/src/identity.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const REQUIRE_STEP_UP_DESTINATION_DETAIL =
  'T-AUTH-03 new destination needs fresh assurance';

export const REQUIRE_STEP_UP_UNAVAILABLE_DETAIL =
  'T-AUTH-03 requireStepUp cannot complete: passkey/step-up store is not implemented (fail closed)';

export async function requireStepUp(
  ctx: Auth01CommandContext,
  input: Auth03Input,
): Promise<Result<Auth03Output, Problem>> {
  ctx.trace('require_step_up_fail_closed', {
    newDestinationWithoutFreshAssurance: input.newDestinationWithoutFreshAssurance,
  });
  if (input.newDestinationWithoutFreshAssurance) {
    return err(problem('APPROVAL_REQUIRED', 409, false, REQUIRE_STEP_UP_DESTINATION_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, REQUIRE_STEP_UP_UNAVAILABLE_DETAIL));
}
