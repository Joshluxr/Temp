/**
 * @kita/domain — publish-content (T-PUB-01).
 *
 * Pure fail-closed checker. Unapproved license or partner claim is absent.
 * Never ok:true. Never publish unapproved claims.
 */

import type { Pub01CommandContext, Pub01Input, Pub01Output } from '../../contracts/src/catalog.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const PUBLISH_CONTENT_UNAPPROVED_DETAIL =
  'Unapproved license or partner claim is absent.';

export const PUBLISH_CONTENT_UNAVAILABLE_DETAIL =
  'T-PUB-01 publishContent cannot complete: approved content store is not implemented (fail closed)';

export async function publishContent(
  ctx: Pub01CommandContext,
  input: Pub01Input,
): Promise<Result<Pub01Output, Problem>> {
  ctx.trace('publish_content_fail_closed', {
    unapprovedLicenseOrPartnerClaim: input.unapprovedLicenseOrPartnerClaim,
  });
  if (input.unapprovedLicenseOrPartnerClaim) {
    return err(problem('POLICY_UNAVAILABLE', 409, false, PUBLISH_CONTENT_UNAPPROVED_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, PUBLISH_CONTENT_UNAVAILABLE_DETAIL));
}
