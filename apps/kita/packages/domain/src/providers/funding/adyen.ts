/**
 * Funding gate — Adyen debit acquiring / wallet buttons (§H1 funding row).
 *
 * DISABLED no-op adapter: throws ProviderDisabledError on every method.
 * Activation requires an explicitly approved money-movement arrangement plus
 * per-brand certification (debit/credit/Apple Pay/Google Pay each separate),
 * none of which exists (DEP-03 outstanding; ADR-08 gate). No tokenized
 * authorization may be simulated; funded-exposure caps are unconfigured.
 */

import { ProviderDisabledError } from './disabled.ts';

const PROVIDER = 'adyen-funding';

function blocked(operation: string): never {
  // DISABLED: outcome manufacturing forbidden — external dependency (DEP-03) not approved; per-brand certification absent.
  throw new ProviderDisabledError(PROVIDER, 'funding', operation);
}

export const adyenFundingAdapter = {
  createHostedSession: (): never => blocked('createHostedSession'),
  createMandate: (): never => blocked('createMandate'),
  verifyOwnership: (): never => blocked('verifyOwnership'),
  authorize: (): never => blocked('authorize'),
  capture: (): never => blocked('capture'),
  void: (): never => blocked('void'),
  collect: (): never => blocked('collect'),
  inquire: (): never => blocked('inquire'),
  refund: (): never => blocked('refund'),
  fetchStatements: (): never => blocked('fetchStatements'),
  verifyWebhook: (): never => blocked('verifyWebhook'),
} as const;

export type AdyenFundingAdapter = typeof adyenFundingAdapter;
