/**
 * @kita/domain — create-instrument-session (T-FUND-01).
 *
 * Pure fail-closed checker. No raw PAN/CVV in app server logs or DB.
 * Never ok:true. Never collect funds.
 */

import type { Fund01CommandContext, Fund01Input, Fund01Output } from '../../contracts/src/funding.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const CREATE_INSTRUMENT_SESSION_PAN_DETAIL =
  'T-FUND-01 no raw PAN/CVV in app server logs or DB';

export const CREATE_INSTRUMENT_SESSION_UNAVAILABLE_DETAIL =
  'T-FUND-01 createInstrumentSession cannot complete: hosted instrument session store is not implemented (fail closed)';

export async function createInstrumentSession(
  ctx: Fund01CommandContext,
  input: Fund01Input,
): Promise<Result<Fund01Output, Problem>> {
  ctx.trace('create_instrument_session_fail_closed', {
    rawPanOrCvvPresent: input.rawPanOrCvvPresent,
  });
  if (input.rawPanOrCvvPresent) {
    return err(problem('CAPABILITY_UNAVAILABLE', 409, false, CREATE_INSTRUMENT_SESSION_PAN_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, CREATE_INSTRUMENT_SESSION_UNAVAILABLE_DETAIL));
}
