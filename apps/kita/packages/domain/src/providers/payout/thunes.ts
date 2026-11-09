/**
 * Payout partner gate — Thunes primary PHP payout candidate (§H1/§H3).
 *
 * DISABLED no-op adapter: throws ProviderDisabledError on every method. A
 * created transaction is NOT proof of paid delivery (§H3), so this stub may
 * not even simulate creation. Neither enabled until the exact corridor/
 * account/method contract exists (DEP-01/DEP-04 outstanding); unsigned
 * callbacks are hints requiring authenticated inquiry, so verifyWebhook is
 * gated too. simulatePartnerCompletion is banned — nothing here advances a
 * payout state machine.
 */

import { ProviderDisabledError } from './disabled.ts';

const PROVIDER = 'thunes-payout';

function blocked(operation: string): never {
  // DISABLED: outcome manufacturing forbidden — external dependency (DEP-01/DEP-04) not approved.
  throw new ProviderDisabledError(PROVIDER, 'payout', operation);
}

export const thunesPayoutAdapter = {
  capabilities: (): never => blocked('capabilities'),
  catalog: (): never => blocked('catalog'),
  validateRecipient: (): never => blocked('validateRecipient'),
  quote: (): never => blocked('quote'),
  create: (): never => blocked('create'),
  confirm: (): never => blocked('confirm'),
  inquireByExternalReference: (): never => blocked('inquireByExternalReference'),
  cancel: (): never => blocked('cancel'),
  returns: (): never => blocked('returns'),
  balances: (): never => blocked('balances'),
  fetchStatements: (): never => blocked('fetchStatements'),
  verifyWebhook: (): never => blocked('verifyWebhook'),
} as const;

export type ThunesPayoutAdapter = typeof thunesPayoutAdapter;
