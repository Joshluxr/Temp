/**
 * @kita/domain — build-quote (T-QUOTE-01).
 *
 * Pure fail-closed checker. Unauthorized creation, limit breach, and missing
 * pricing policy never produce a quote. Never ok:true. T-CORE-02 and
 * T-LEDGER-02 remain HOLD.
 */

import type { Quote01CommandContext, Quote01Input, Quote01Output } from '../../contracts/src/quotes.ts';
import type { Problem, Result } from '../../contracts/src/result.ts';
import { err, problem } from '../../contracts/src/result.ts';

export const BUILD_QUOTE_UNAUTHORIZED_DETAIL =
  'T-QUOTE-01 quote creation is not authorized';

export const BUILD_QUOTE_LIMIT_DETAIL =
  'T-QUOTE-01 supplied corridor, customer or rail limit breach blocks quote creation';

export const BUILD_QUOTE_POLICY_DETAIL =
  'T-QUOTE-01 required pricing policy is unavailable; no fee or tax fallback is authorized';

export const BUILD_QUOTE_UNAVAILABLE_DETAIL =
  'T-QUOTE-01 buildQuote cannot price or persist a quote or grant financial authority: quote/policy stores, T-CORE-02 and T-LEDGER-02 remain HOLD (fail closed)';

export async function buildQuote(
  _ctx: Quote01CommandContext,
  input: Quote01Input,
): Promise<Result<Quote01Output, Problem>> {
  if (input.unauthorizedQuoteCreation) {
    return err(problem('unauthorized', 403, false, BUILD_QUOTE_UNAUTHORIZED_DETAIL));
  }
  if (input.limitExceeded) {
    return err(problem('LIMIT_EXCEEDED', 409, false, BUILD_QUOTE_LIMIT_DETAIL));
  }
  if (input.pricingPolicyUnavailable) {
    return err(problem('POLICY_UNAVAILABLE', 409, false, BUILD_QUOTE_POLICY_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, BUILD_QUOTE_UNAVAILABLE_DETAIL));
}
