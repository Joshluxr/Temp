/**
 * @kita/domain — list-capabilities (T-PUB-03).
 *
 * Pure fail-closed checker. Disabled US state or origin cannot accept money.
 * Never ok:true. No country-wide default allow.
 */

import type { Pub01CommandContext, Pub03Input, Pub03Output } from '../../contracts/src/catalog.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const LIST_CAPABILITIES_DISABLED_DETAIL =
  'T-PUB-03 disabled US state or origin cannot accept money';

export const LIST_CAPABILITIES_UNAVAILABLE_DETAIL =
  'T-PUB-03 listCapabilities cannot complete: capabilities catalog store is not implemented (fail closed)';

export async function listCapabilities(
  ctx: Pub01CommandContext,
  input: Pub03Input,
): Promise<Result<Pub03Output, Problem>> {
  ctx.trace('list_capabilities_fail_closed', {
    disabledUsStateOrOrigin: input.disabledUsStateOrOrigin,
  });
  if (input.disabledUsStateOrOrigin) {
    return err(problem('CAPABILITY_UNAVAILABLE', 403, false, LIST_CAPABILITIES_DISABLED_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, LIST_CAPABILITIES_UNAVAILABLE_DETAIL));
}
