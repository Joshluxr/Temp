/**
 * @kita/domain — create-recipient (T-REC-01).
 *
 * Pure fail-closed checker. Ownership and name/account validation are
 * server-side. Never persist. Never ok:true. Never echo full account numbers.
 */

import type { Rec01CommandContext, Rec01Input, Rec01Output } from '../../contracts/src/recipients.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const CREATE_RECIPIENT_OWNERSHIP_DETAIL =
  'T-REC-01 ownership must be enforced server-side';

export const CREATE_RECIPIENT_CLIENT_VALIDATION_DETAIL =
  'T-REC-01 name/account validation must be server-side; client claims are not proof';

export const CREATE_RECIPIENT_UNAVAILABLE_DETAIL =
  'T-REC-01 createRecipient cannot persist a recipient: T-ADAPTER-01 institution catalog is not implemented (fail closed)';

export async function createRecipient(
  ctx: Rec01CommandContext,
  input: Rec01Input,
): Promise<Result<Rec01Output, Problem>> {
  ctx.trace('create_recipient_fail_closed', {
    actorId: String(ctx.actorId),
    serverSideOwned: input.serverSideOwned,
    clientClaimedValidated: input.clientClaimedValidated,
  });
  if (!input.serverSideOwned) {
    return err(problem('unauthorized', 403, false, CREATE_RECIPIENT_OWNERSHIP_DETAIL));
  }
  if (input.clientClaimedValidated) {
    return err(problem('CAPABILITY_UNAVAILABLE', 409, false, CREATE_RECIPIENT_CLIENT_VALIDATION_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, CREATE_RECIPIENT_UNAVAILABLE_DETAIL));
}
