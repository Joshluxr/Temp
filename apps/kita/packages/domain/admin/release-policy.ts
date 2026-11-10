/**
 * @kita/domain — release-policy (T-ADM-08).
 *
 * Pure fail-closed checker. Unauthorized release, stale approval, and
 * accepted-quote rewrite never publish a policy. Never ok:true.
 * T-CORE-02 and T-LEDGER-02 remain HOLD.
 */

import type { Adm08CommandContext, Adm08Input, Adm08Output } from '../../contracts/src/admin.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const RELEASE_POLICY_UNAUTHORIZED_DETAIL =
  'T-ADM-08 unauthorized release cannot publish policy';

export const RELEASE_POLICY_STALE_DETAIL =
  'T-ADM-08 stale approval cannot publish policy';

export const RELEASE_POLICY_QUOTE_REWRITE_DETAIL =
  'T-ADM-08 cannot rewrite accepted quote terms through a policy release';

export const RELEASE_POLICY_UNAVAILABLE_DETAIL =
  'T-ADM-08 releasePolicy cannot persist a policy release or grant command authority: T-CORE-02 and T-LEDGER-02 remain HOLD (fail closed)';

export async function releasePolicy(
  ctx: Adm08CommandContext,
  input: Adm08Input,
): Promise<Result<Adm08Output, Problem>> {
  ctx.trace('release_policy_fail_closed', {
    unauthorizedRelease: input.unauthorizedRelease,
    staleApproval: input.staleApproval,
    wouldRewriteAcceptedQuote: input.wouldRewriteAcceptedQuote,
  });
  if (input.unauthorizedRelease) {
    return err(problem('unauthorized', 403, false, RELEASE_POLICY_UNAUTHORIZED_DETAIL));
  }
  if (input.staleApproval) {
    return err(problem('APPROVAL_STALE', 409, false, RELEASE_POLICY_STALE_DETAIL));
  }
  if (input.wouldRewriteAcceptedQuote) {
    return err(problem('VERSION_CONFLICT', 409, false, RELEASE_POLICY_QUOTE_REWRITE_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, RELEASE_POLICY_UNAVAILABLE_DETAIL));
}
