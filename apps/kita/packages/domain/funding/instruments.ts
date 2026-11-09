/**
 * @kita/domain/funding — funding instrument GATE (T-PLAT-01 stub lane).
 *
 * This module models the `funding_instruments` row shape (packages/database/
 * migrations/001_core.sql line 39) and exposes registration as an explicit
 * denial: `registerInstrument` returns `unavailable` on every call. It is a
 * GATE, not a mock — nothing here persists, tokens, verifies ownership, or
 * mints state transitions. Real registration lands behind the T-CONTRACT-01
 * freeze with T-CORE-02 command authority (scoped SQL functions + evidence),
 * after DEP-03 funding-provider sign-off exists (§H6: production startup
 * rejects unapproved capabilities; no runtime boolean turns this into a rail).
 *
 * PCI boundary (hard): PAN, CVV/CVC, expiry, and any full cardholder payload
 * must NEVER appear as fields, parameters, or log material in this module or
 * anywhere in Kita. Only opaque provider token references and display-only
 * masks cross the boundary (see HostedInstrumentEvidence in @kita/contracts).
 * Outcome manufacturing is forbidden: addSandboxFunds /
 * simulatePartnerCompletion are banned identifiers that must not appear as
 * callable code here or in any production-reachable path (apps/kita/docs/
 * FORBIDDEN.md).
 */

import type { FundingInstrumentState, FundingMethod } from '../enums.ts';

/** Canonical unavailable reason code (mirrors OpenAPI problem enum CAPABILITY_UNAVAILABLE). */
export const INSTRUMENT_REGISTRATION_UNAVAILABLE = 'CAPABILITY_UNAVAILABLE' as const;

/**
 * Tokenized instrument reference — mirrors the funding_instruments columns a
 * hosted tokenization session can produce. Deliberately absent by design:
 * - No PAN/CVV/expiry field of any kind; only `providerTokenCipher` (encrypted
 *   opaque token envelope, ciphertext bytes) and `mask` (display last4/label,
 *   never derivable back to a card number).
 * - No balance, capture, or top-up capability — state arrives only from
 *   authenticated provider evidence via T-CORE-02 reducers, never synthesized.
 */
export interface InstrumentRegistrationInput {
  /** funding_instruments.book_id (uuid). */
  readonly bookId: string;
  /** funding_instruments.customer_id (uuid). */
  readonly customerId: string;
  /** funding_instruments.provider_account_id (uuid) — environment-pinned account. */
  readonly providerAccountId: string;
  /** funding_instruments.method CHECK. */
  readonly method: FundingMethod;
  /** funding_instruments.provider_token_cipher — encrypted opaque token; never plaintext card data. */
  readonly providerTokenCipher: Uint8Array;
  /** Key-registry pointer for the cipher (funding_instruments.key_ref). */
  readonly keyRef: string;
  /** funding_instruments.mask — display-only last4/label. */
  readonly mask: string;
  /** funding_instruments.ownership_evidence_id — set only from real verification evidence. */
  readonly ownershipEvidenceId?: string;
}

/** Customer-visible projection (OpenAPI Instrument schema): id, method, mask, state. */
export interface FundingInstrumentView {
  readonly id: string;
  readonly method: FundingMethod;
  readonly mask: string;
  readonly state: FundingInstrumentState;
}

/** Discriminated outcome for the funding-instrument port. */
export type InstrumentResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly code: typeof INSTRUMENT_REGISTRATION_UNAVAILABLE; readonly retryable: false; readonly detail: string };

/**
 * Registration gate: always returns `unavailable`. The hosted-session →
 * confirm flow has no approved external dependency (DEP-03 open) and no
 * frozen contract implementation yet, so there is exactly one constructible
 * outcome here — a definitive non-permission error, never Pending, never a
 * fabricated `verified` instrument.
 */
export function registerInstrument(_input: InstrumentRegistrationInput): InstrumentResult<FundingInstrumentView> {
  return {
    ok: false,
    code: INSTRUMENT_REGISTRATION_UNAVAILABLE,
    retryable: false,
    detail: 'funding instrument registration requires T-CORE-02 command authority and DEP-03 provider approval; not implemented',
  };
}
