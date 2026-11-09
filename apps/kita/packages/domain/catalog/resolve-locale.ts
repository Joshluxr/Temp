/**
 * @kita/domain — resolve-locale (T-PUB-05).
 *
 * Pure fail-closed checker. Receipt and consent retain chosen language.
 * Never ok:true. Never rewrite an issued receipt/consent language.
 */

import type { Pub01CommandContext, Pub05Input, Pub05Output } from '../../contracts/src/catalog.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const RESOLVE_LOCALE_REWRITE_DENIED_DETAIL =
  'T-PUB-05 receipt and consent retain chosen language';

export const RESOLVE_LOCALE_UNAVAILABLE_DETAIL =
  'T-PUB-05 resolveLocale cannot complete: locale/receipt store is not implemented (fail closed)';

export async function resolveLocale(
  ctx: Pub01CommandContext,
  input: Pub05Input,
): Promise<Result<Pub05Output, Problem>> {
  ctx.trace('resolve_locale_fail_closed', {
    rewriteIssuedReceiptLocale: input.rewriteIssuedReceiptLocale,
  });
  if (input.rewriteIssuedReceiptLocale) {
    return err(problem('POLICY_UNAVAILABLE', 409, false, RESOLVE_LOCALE_REWRITE_DENIED_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, RESOLVE_LOCALE_UNAVAILABLE_DETAIL));
}
