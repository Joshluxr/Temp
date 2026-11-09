/**
 * Funding gate — Stripe (§H1 funding row + restricted-business policy note).
 *
 * DISABLED no-op adapter: throws ProviderDisabledError on every method.
 * Stripe is NOT the launch default merely because the sandbox label says
 * "Stripe ACH"; an explicit entity/product decision (DEP-03) does not exist,
 * and an ordinary ecommerce account is not evidence of approved consumer
 * remittance. Sandbox labels must never reach production; there is no fake
 * capture/authorize success path here. addSandboxFunds is banned and its
 * replacement (real top-up) stays gated on DEP-07/DEP-03.
 */

import { ProviderDisabledError } from './disabled.ts';

const PROVIDER = 'stripe-funding';

function blocked(operation: string): never {
  // DISABLED: outcome manufacturing forbidden — external dependency (DEP-03) not approved; no sandbox-to-live funding path.
  throw new ProviderDisabledError(PROVIDER, 'funding', operation);
}

export const stripeFundingAdapter = {
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

export type StripeFundingAdapter = typeof stripeFundingAdapter;
