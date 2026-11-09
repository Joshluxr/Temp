/**
 * @kita/domain/providers — shared failure type for DISABLED provider gates.
 *
 * These adapters are GATES, not mocks: per docs/kita-plan/08-providers.md §H2,
 * "Unsupported operations fail explicitly; no default success implementation"
 * and §H6, "No runtime boolean can turn a fake funding function into a live
 * rail." An approval to manufacture an outcome (KYC pass, payout settled,
 * funds captured) does not exist anywhere in Kita — addSandboxFunds and
 * simulatePartnerCompletion are banned identifiers, never to be introduced.
 */

export const PROVIDER_DISABLED = 'PROVIDER_DISABLED';

/** Typed error every disabled adapter throws; message always states the ban reason. */
export class ProviderDisabledError extends Error {
  readonly code = PROVIDER_DISABLED as const;
  readonly provider: string;
  readonly port: 'identity' | 'payout' | 'funding';
  readonly operation: string;

  constructor(provider: string, port: 'identity' | 'payout' | 'funding', operation: string) {
    // One-line safety constraint: external dependency not approved / outcome manufacturing forbidden.
    super(
      `DISABLED: outcome manufacturing forbidden — ${provider}.${port}.${operation} blocked: external dependency not approved (DEP gate open; see docs/kita-plan/07-provider-matrix.md). No default success implementation exists.`,
    );
    this.name = 'ProviderDisabledError';
    this.provider = provider;
    this.port = port;
    this.operation = operation;
  }
}

/** Canonical H2 result union — declared so adapters CANNOT invent a success shape beyond it. */
export type ProviderOutcome<T> =
  | { readonly kind: 'Confirmed'; readonly evidence: T }
  | { readonly kind: 'Pending'; readonly providerRef: string; readonly nextInquiryAt: string }
  | { readonly kind: 'Rejected'; readonly code: string; readonly definitiveNonacceptance: true }
  | { readonly kind: 'Unknown'; readonly reference: string }
  | { readonly kind: 'Unsupported'; readonly capability: string };

/** Every disabled adapter method returns this type: nothing but Unsupported is constructible without vendor evidence. */
export type DisabledAdapterReturn = never;
