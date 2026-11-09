/**
 * @kita/domain — apply-kita-tokens (T-PUB-06).
 *
 * Pure fail-closed checker. Keyboard and screen reader flow must pass at required widths.
 * Never ok:true. Never ship inaccessible tokens.
 */

import type { Pub01CommandContext, Pub06Input, Pub06Output } from '../../contracts/src/catalog.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const APPLY_KITA_TOKENS_INACCESSIBLE_DETAIL =
  'T-PUB-06 keyboard and screen reader flow must pass at required widths';

export const APPLY_KITA_TOKENS_UNAVAILABLE_DETAIL =
  'T-PUB-06 applyKitaTokens cannot complete: design-token store is not implemented (fail closed)';

export async function applyKitaTokens(
  ctx: Pub01CommandContext,
  input: Pub06Input,
): Promise<Result<Pub06Output, Problem>> {
  ctx.trace('apply_kita_tokens_fail_closed', {
    inaccessibleContrastOrKeyboardContract: input.inaccessibleContrastOrKeyboardContract,
  });
  if (input.inaccessibleContrastOrKeyboardContract) {
    return err(problem('POLICY_UNAVAILABLE', 409, false, APPLY_KITA_TOKENS_INACCESSIBLE_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, APPLY_KITA_TOKENS_UNAVAILABLE_DETAIL));
}
