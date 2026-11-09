/**
 * @kita/domain/providers barrel — DISABLED external-dependency gates.
 *
 * Every adapter below is a no-op gate that throws ProviderDisabledError
 * ("external dependency not approved / outcome manufacturing forbidden").
 * They are deliberately NOT mocks: no method returns Confirmed/Pending/
 * success of any shape, because §H2 forbids default-success implementations
 * and §H6 forbids any runtime boolean turning a fake function into a live
 * rail. Banned identifiers that must never appear in Kita code:
 * addSandboxFunds, simulatePartnerCompletion, admin complete/fail money
 * shortcuts. This package exports types and these throwing gates only —
 * it contains zero journal writers and zero money reducers (T-CORE-02/
 * T-LEDGER-02 own those, behind the contracts freeze).
 */

export { PROVIDER_DISABLED, ProviderDisabledError } from './disabled.ts';
export type { ProviderOutcome, DisabledAdapterReturn } from './disabled.ts';

export { personaIdentityAdapter } from './kyc/persona.ts';
export type { PersonaIdentityAdapter } from './kyc/persona.ts';

export { thunesPayoutAdapter } from './payout/thunes.ts';
export type { ThunesPayoutAdapter } from './payout/thunes.ts';
export { niumPayoutAdapter } from './payout/nium.ts';
export type { NiumPayoutAdapter } from './payout/nium.ts';
export { peraHubPickupAdapter } from './payout/pera-hub.ts';
export type { PeraHubPickupAdapter } from './payout/pera-hub.ts';

export { stripeFundingAdapter } from './funding/stripe.ts';
export type { StripeFundingAdapter } from './funding/stripe.ts';
export { adyenFundingAdapter } from './funding/adyen.ts';
export type { AdyenFundingAdapter } from './funding/adyen.ts';
