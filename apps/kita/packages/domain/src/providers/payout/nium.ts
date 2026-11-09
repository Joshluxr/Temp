/**
 * Payout partner gate — Nium secondary PHP payout/FX candidate (§H1/§H3).
 *
 * DISABLED no-op adapter: throws ProviderDisabledError on every method. A
 * second uncontracted route must not appear as available failover; never
 * reuse a Thunes ID namespace/key at Nium. Sandbox certification is gated on
 * DEP-01/DEP-04 sign-offs that do not exist yet, so no simulated outcome of
 * any kind is produced here (outcome manufacturing forbidden).
 */

import { ProviderDisabledError } from './disabled.ts';

const PROVIDER = 'nium-payout';

function blocked(operation: string): never {
  // DISABLED: outcome manufacturing forbidden — external dependency (DEP-01/DEP-04) not approved; no failover simulation.
  throw new ProviderDisabledError(PROVIDER, 'payout', operation);
}

export const niumPayoutAdapter = {
  capabilities: (): never => blocked('capabilities'),
  catalog: (): never => blocked('catalog'),
  validateRecipient: (): never => blocked('validateRecipient'),
  quote: (): never => blocked('quote'),
  create: (): never => blocked('create'),
  inquireByExternalReference: (): never => blocked('inquireByExternalReference'),
  cancel: (): never => blocked('cancel'),
  returns: (): never => blocked('returns'),
  balances: (): never => blocked('balances'),
  fetchStatements: (): never => blocked('fetchStatements'),
  verifyWebhook: (): never => blocked('verifyWebhook'),
} as const;

export type NiumPayoutAdapter = typeof niumPayoutAdapter;
