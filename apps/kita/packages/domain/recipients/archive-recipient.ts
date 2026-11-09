/**
 * @kita/domain — archive-recipient (T-REC-03).
 *
 * Pure fail-closed checker. Never mutates an old transfer snapshot.
 * Never claims archive completed. Never ok:true.
 */

import type { Rec01CommandContext, Rec03Input, Rec03Output } from '../../contracts/src/recipients.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const ARCHIVE_RECIPIENT_VERSION_DETAIL =
  'T-REC-03 expected recipient version conflict; old transfer snapshot must remain immutable';

export const ARCHIVE_RECIPIENT_UNAVAILABLE_DETAIL =
  'T-REC-03 archiveRecipient cannot archive: recipient_versions store is not implemented (fail closed)';

export async function archiveRecipient(
  ctx: Rec01CommandContext,
  input: Rec03Input,
): Promise<Result<Rec03Output, Problem>> {
  ctx.trace('archive_recipient_fail_closed', {
    actorId: String(ctx.actorId),
    expectedVersionMismatch: input.expectedVersionMismatch,
  });
  if (input.expectedVersionMismatch) {
    return err(problem('VERSION_CONFLICT', 409, false, ARCHIVE_RECIPIENT_VERSION_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, ARCHIVE_RECIPIENT_UNAVAILABLE_DETAIL));
}
