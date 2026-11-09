/**
 * @kita/domain — send-notification (T-GROW-07).
 *
 * Pure fail-closed checker. Duplicate event gives one intended message per channel.
 * Never ok:true. Never send a live vendor message or report duplicate success.
 */

import type { Grow07CommandContext, Grow07Input, Grow07Output } from '../../contracts/src/notifications.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const SEND_NOTIFICATION_DUPLICATE_DETAIL =
  'T-GROW-07 duplicate event gives one intended message per channel; second send denied';

export const SEND_NOTIFICATION_UNAVAILABLE_DETAIL =
  'T-GROW-07 sendNotification cannot complete: notification/outbox store is not implemented (fail closed)';

export async function sendNotification(
  ctx: Grow07CommandContext,
  input: Grow07Input,
): Promise<Result<Grow07Output, Problem>> {
  ctx.trace('send_notification_fail_closed', {
    duplicateEventPerChannel: input.duplicateEventPerChannel,
  });
  if (input.duplicateEventPerChannel) {
    return err(problem('CAPABILITY_UNAVAILABLE', 409, false, SEND_NOTIFICATION_DUPLICATE_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, SEND_NOTIFICATION_UNAVAILABLE_DETAIL));
}
