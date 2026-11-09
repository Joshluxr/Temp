/**
 * @kita/domain — validate-wallet-recipient (T-REC-02).
 *
 * Pure fail-closed checker. Wrong network or expired validation blocks payout.
 * Never ok:true. Never echo plaintext wallet identifiers.
 */

import type { Rec01CommandContext, Rec02Input, Rec02Output } from '../../contracts/src/recipients.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const VALIDATE_WALLET_WRONG_NETWORK_DETAIL =
  'T-REC-02 wrong network blocks payout';

export const VALIDATE_WALLET_EXPIRED_DETAIL =
  'T-REC-02 expired validation blocks payout';

export const VALIDATE_WALLET_UNAVAILABLE_DETAIL =
  'T-REC-02 validateWalletRecipient cannot authorize payout: wallet catalog is not implemented (fail closed)';

export async function validateWalletRecipient(
  ctx: Rec01CommandContext,
  input: Rec02Input,
): Promise<Result<Rec02Output, Problem>> {
  ctx.trace('validate_wallet_recipient_fail_closed', {
    actorId: String(ctx.actorId),
    wrongNetwork: input.wrongNetwork,
    validationExpired: input.validationExpired,
  });
  if (input.wrongNetwork) {
    return err(problem('CAPABILITY_UNAVAILABLE', 409, false, VALIDATE_WALLET_WRONG_NETWORK_DETAIL));
  }
  if (input.validationExpired) {
    return err(problem('RECIPIENT_VERSION_CHANGED', 409, false, VALIDATE_WALLET_EXPIRED_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, VALIDATE_WALLET_UNAVAILABLE_DETAIL));
}
