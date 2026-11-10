/**
 * @kita/platform — recover-financial-authority (T-PLAT-08).
 *
 * Pure fail-closed checker. Unauthorized reopen, unfenced former writers, and
 * unreconciled uncertainty never reopen financial submission. Never ok:true.
 * T-CORE-02 and T-LEDGER-02 remain HOLD.
 */

import type { Plat08CommandContext, Plat08Input, Plat08Output } from '../contracts/src/platform.ts';
import type { Problem, Result } from '../contracts/src/result.ts';
import { err, problem } from '../contracts/src/result.ts';

export const RECOVER_FINANCIAL_AUTHORITY_UNAUTHORIZED_DETAIL =
  'T-PLAT-08 financial reopen is not authorized';

export const RECOVER_FINANCIAL_AUTHORITY_FENCE_DETAIL =
  'T-PLAT-08 former writer is not independently fenced; financial submission cannot reopen';

export const RECOVER_FINANCIAL_AUTHORITY_UNCERTAINTY_DETAIL =
  'T-PLAT-08 uncertainty window is not independently reconciled; provider outcomes remain unknown';

export const RECOVER_FINANCIAL_AUTHORITY_UNAVAILABLE_DETAIL =
  'T-PLAT-08 recoverFinancialAuthority cannot persist recovery or grant financial submission authority: recovery stores are unavailable; T-CORE-02 and T-LEDGER-02 remain HOLD (fail closed)';

export async function recoverFinancialAuthority(
  _ctx: Plat08CommandContext,
  input: Plat08Input,
): Promise<Result<Plat08Output, Problem>> {
  if (input.unauthorizedReopen) {
    return err(problem('unauthorized', 403, false, RECOVER_FINANCIAL_AUTHORITY_UNAUTHORIZED_DETAIL));
  }
  if (input.oldWriterNotFenced) {
    return err(problem('stale_or_conflicting_command', 409, false, RECOVER_FINANCIAL_AUTHORITY_FENCE_DETAIL));
  }
  if (input.uncertaintyWindowUnreconciled) {
    return err(problem('PROVIDER_OUTCOME_UNKNOWN', 409, false, RECOVER_FINANCIAL_AUTHORITY_UNCERTAINTY_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, RECOVER_FINANCIAL_AUTHORITY_UNAVAILABLE_DETAIL));
}
