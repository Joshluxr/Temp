/**
 * @kita/domain — save-draft (T-QUOTE-08).
 *
 * Pure fail-closed checker. Stale draft version cannot overwrite newer
 * recipient/amount. Never ok:true. Never persist. T-CORE-02 remains HOLD.
 */

import type { Quote08CommandContext, Quote08Input, Quote08Output } from '../../contracts/src/quotes.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const SAVE_DRAFT_STALE_DETAIL =
  'Stale draft version cannot overwrite newer recipient/amount.';

export const SAVE_DRAFT_UNAVAILABLE_DETAIL =
  'T-QUOTE-08 saveDraft cannot complete: drafts store is not implemented (fail closed); T-CORE-02 HOLD';

export async function saveDraft(
  ctx: Quote08CommandContext,
  input: Quote08Input,
): Promise<Result<Quote08Output, Problem>> {
  ctx.trace('save_draft_fail_closed', {
    staleDraftWouldOverwriteNewerRecipientOrAmount: input.staleDraftWouldOverwriteNewerRecipientOrAmount,
  });
  if (input.staleDraftWouldOverwriteNewerRecipientOrAmount) {
    return err(problem('VERSION_CONFLICT', 409, false, SAVE_DRAFT_STALE_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, SAVE_DRAFT_UNAVAILABLE_DETAIL));
}
