/**
 * @kita/domain — evaluate-market-permission (T-EXT-01).
 *
 * Pure fail-closed policy checker. Never ok:true. Unapproved markets stay
 * disabled. Intended US→PH remittance still 503 until T-DEPEND-01.
 * No DB, journals, provider calls, or executeCommand.
 */

import type { Ext01Input, Ext01Output } from '../../contracts/src/extensions.ts';
import type { Problem, Result, WorkerContext } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const EVALUATE_MARKET_UNAPPROVED_DETAIL =
  'T-EXT-01 unapproved country/state/product remains disabled';

export const EVALUATE_MARKET_USPH_UNAVAILABLE_DETAIL =
  'T-EXT-01 intended US→PH corridor is not live: T-DEPEND-01 activation is absent (fail closed)';

/** ISO 3166-1 alpha-2: EU members plus EEA (IS, LI, NO) and GB handled separately. */
export const EU_EEA_COUNTRIES: ReadonlySet<string> = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU',
  'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES',
  'SE', 'IS', 'LI', 'NO',
]);

const NAMED_UNAPPROVED = new Set(['CA', 'GB', 'UK', 'JP', 'SG', 'AU']);

function norm(code: string): string {
  return code.trim().toUpperCase();
}

export function isIntendedUsPhRemittance(input: Ext01Input): boolean {
  return (
    norm(input.originCountry) === 'US' &&
    norm(input.destinationCountry) === 'PH' &&
    (input.product === 'remittance' || input.product === '')
  );
}

export function isNamedUnapprovedMarket(input: Ext01Input): boolean {
  const origin = norm(input.originCountry);
  const dest = norm(input.destinationCountry);
  if (NAMED_UNAPPROVED.has(origin) || NAMED_UNAPPROVED.has(dest)) return true;
  if (EU_EEA_COUNTRIES.has(origin) || EU_EEA_COUNTRIES.has(dest)) return true;
  return false;
}

export async function evaluateMarketPermission(
  ctx: WorkerContext,
  input: Ext01Input,
): Promise<Result<Ext01Output, Problem>> {
  ctx.trace('evaluate_market_permission_fail_closed', {
    workId: String(ctx.workId),
    attemptGeneration: ctx.attemptGeneration,
  });
  if (isIntendedUsPhRemittance(input) && !isNamedUnapprovedMarket(input)) {
    return err(problem('dependency_unavailable', 503, true, EVALUATE_MARKET_USPH_UNAVAILABLE_DETAIL));
  }
  return err(problem('CAPABILITY_UNAVAILABLE', 409, false, EVALUATE_MARKET_UNAPPROVED_DETAIL));
}
