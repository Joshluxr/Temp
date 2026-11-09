/**
 * @kita/domain — apply-communication-consent (T-GROW-08).
 *
 * Pure fail-closed checker. Marketing opt-out suppresses campaign but never
 * suppresses necessary lawful service notices. Never ok:true. Never send a campaign.
 */

import type { Grow07CommandContext, Grow08Input, Grow08Output } from '../../contracts/src/notifications.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const APPLY_CONSENT_CAMPAIGN_DENIED_DETAIL =
  'T-GROW-08 marketing opt-out suppresses campaign; lawful service notices are preserved';

export const APPLY_CONSENT_UNAVAILABLE_DETAIL =
  'T-GROW-08 applyCommunicationConsent cannot complete: consent/notification store is not implemented (fail closed)';

export async function applyCommunicationConsent(
  ctx: Grow07CommandContext,
  input: Grow08Input,
): Promise<Result<Grow08Output, Problem>> {
  ctx.trace('apply_communication_consent_fail_closed', {
    marketingCampaignDespiteOptOut: input.marketingCampaignDespiteOptOut,
  });
  if (input.marketingCampaignDespiteOptOut) {
    return err(problem('CAPABILITY_UNAVAILABLE', 409, false, APPLY_CONSENT_CAMPAIGN_DENIED_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, APPLY_CONSENT_UNAVAILABLE_DETAIL));
}
