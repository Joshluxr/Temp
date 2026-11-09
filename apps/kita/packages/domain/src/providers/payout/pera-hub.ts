/**
 * Cash-pickup route gate — PERA HUB via contracted aggregator (§H1 cash-pickup row).
 *
 * DISABLED no-op adapter: throws ProviderDisabledError on every method. The
 * actual network/location/name/ID/expiry and collected-status contract has
 * not been obtained (DEP-04 outstanding), and raw-research branch counts are
 * third-party claims, not contracted coverage. Collected/expiry evidence can
 * only come from the vendor; simulating "cash collected" is banned outcome
 * manufacturing.
 */

import { ProviderDisabledError } from './disabled.ts';

const PROVIDER = 'pera-hub-cash-pickup';

function blocked(operation: string): never {
  // DISABLED: outcome manufacturing forbidden — external dependency (DEP-04) not approved; pickup collection cannot be simulated.
  throw new ProviderDisabledError(PROVIDER, 'payout', operation);
}

export const peraHubPickupAdapter = {
  capabilities: (): never => blocked('capabilities'),
  catalog: (): never => blocked('catalog'),
  validateRecipient: (): never => blocked('validateRecipient'),
  quote: (): never => blocked('quote'),
  create: (): never => blocked('create'),
  inquireByExternalReference: (): never => blocked('inquireByExternalReference'),
  cancel: (): never => blocked('cancel'),
  returns: (): never => blocked('returns'),
  verifyWebhook: (): never => blocked('verifyWebhook'),
} as const;

export type PeraHubPickupAdapter = typeof peraHubPickupAdapter;
