/**
 * @kita/contracts — auth/session contract types (T-IDENTITY-01 lane).
 *
 * Types ONLY: no runtime validators, no token generation, no hashing logic
 * (the single allowed runtime value is the tiny `unavailable()` helper below).
 * Field names mirror docs/kita-plan/openapi/kita-v1.yaml (HostedSession,
 * InstrumentInput, IdentityInput, SessionResult, MobileTokens, AuthCallback)
 * and the authority tables in the migration set (auth_sessions,
 * refresh_tokens, contact_verifications, notification_preferences,
 * funding_instruments, document_access_grants). The frozen registry of
 * assurance levels and runtime schemas is owned by T-CONTRACT-01; everything
 * here must stay additive-safe until that freeze.
 */

import { problem, type Problem } from './result.ts';
import type { Instant, UUID, WorkerContext } from './context.ts';

/* ------------------------------------------------------------------ brands */

/** Lowercase 64-char hex string (SHA-256-sized HMAC/digest). Compile-time brand only. */
export type Hmac64Hex = string & { readonly __brand: 'Hmac64Hex' };

/* ------------------------------------------------------------------- enums */

/** auth_sessions.audience CHECK: exactly these two values. */
export type SessionAudience = 'kita-customer' | 'kita-admin';

/**
 * Assurance levels referenced by sessions and step-up grants. This union is a
 * PLACEHOLDER covering the levels named in the planning docs; the exact
 * registry is owned by the T-CONTRACT-01 freeze. Keep changes additive-safe
 * (new levels may be added here pre-freeze; existing ones must not change).
 */
export type AssuranceLevel = 'aal1' | 'aal2' | 'phishing_resistant_mfa' | 'step_up';

/** funding_instruments.method CHECK (mirrors OpenAPI InstrumentInput.method enum). */
export type FundingInstrumentMethod = 'ach' | 'debit' | 'credit' | 'apple_pay' | 'google_pay';

/** funding_instruments.state surface visible to the customer projection. */
export type FundingInstrumentState = 'pending' | 'verified' | 'restricted' | 'revoked';

/* -------------------------------------------------------------- OIDC input */

/**
 * Verified OIDC/PKCE evidence handed to bindSession. Mirrors the I1 login
 * flow in docs/kita-plan/09-admin-security.md (OIDC authorization-code +
 * PKCE + nonce + one-use state) and OpenAPI AuthCallback
 * (code/state/redirectUri) after server-side exchange — this is the INPUT
 * evidence shape, never a token-minting surface.
 */
export interface OidcEvidence {
  /** `iss` claim — exact issuer allowlist match, validated upstream. */
  readonly issuer: string;
  /** `sub` claim at the given issuer; stable subject reference. */
  readonly subject: string;
  /** `aud` claim — expected client audience, validated before use. */
  readonly audience: string;
  /** SHA-256 of the nonce as a 64-hex digest; the raw nonce is never stored. */
  readonly nonceHash: Hmac64Hex;
  /** PKCE transform. Only S256 is accepted (OpenAPI/RFC 7636 requirement). */
  readonly codeChallengeMethod: 'S256';
  /** Exact redirect URI that was registered and returned (AuthCallback.redirectUri). */
  readonly returnedUri: string;
  /** Moment the evidence was verified server-side. */
  readonly verifiedAt: Instant;
}

/* ----------------------------------------------------------------- session */

/**
 * auth_sessions row shape. INVARIANT: `customerId` and `staffSubject` are
 * mutually exclusive per audience — a 'kita-customer' session carries
 * customerId without staffSubject, and vice versa for 'kita-admin'; neither
 * field is client-selectable.
 */
export interface Session {
  /** auth_sessions.id (uuid). */
  readonly sessionId: UUID;
  /** auth_sessions.audience — 'kita-customer' | 'kita-admin'. */
  readonly audience: SessionAudience;
  /** auth_sessions.assurance — see AssuranceLevel (T-CONTRACT-01 owns registry). */
  readonly assurance: AssuranceLevel;
  /** auth_sessions.device_ref — opaque device pointer; never raw fingerprint data. */
  readonly deviceRef: string;
  /** auth_sessions.customer_id — present only for customer-audience sessions. */
  readonly customerId?: UUID;
  /** auth_sessions.staff_subject — present only for admin-audience sessions. */
  readonly staffSubject?: string;
  /** auth_sessions.expires_at. */
  readonly expiresAt: Instant;
  /** auth_sessions.last_seen_at — sliding-window touch timestamp. */
  readonly lastSeenAt: Instant;
  /** auth_sessions.revoked_at — set on revocation; absent while live. */
  readonly revokedAt?: Instant;
}

/* ---------------------------------------------------------- refresh tokens */

/**
 * refresh_tokens row shape. Stores only the HMAC of the opaque refresh token
 * (MobileTokens.refreshToken on the wire); this contract NEVER mints, rotates,
 * or hashes tokens — that is T-CORE-02 command authority territory.
 */
export interface RefreshTokenRecord {
  /** refresh_tokens.session_id → Session.sessionId. */
  readonly sessionId: UUID;
  /** refresh_tokens.family_id — rotation lineage for reuse detection. */
  readonly familyId: UUID;
  /** refresh_tokens.generation — monotonic rotation counter within the family. */
  readonly generation: number;
  /** refresh_tokens.token_hmac — 64-hex digest of the presented token. */
  readonly tokenHmac: Hmac64Hex;
  /** refresh_tokens.state CHECK; 'reuse_detected' trips family revocation upstream. */
  readonly state: 'active' | 'rotated' | 'revoked' | 'reuse_detected';
  /** refresh_tokens.issued_at. */
  readonly issuedAt: Instant;
  /** refresh_tokens.expires_at. */
  readonly expiresAt: Instant;
  /** refresh_tokens.rotated_at — set when state moves to 'rotated'. */
  readonly rotatedAt?: Instant;
}

/* ------------------------------------------------------ contact challenges */

/**
 * contact_verifications row shape (SMS/OTP channel). Hashes only — the raw
 * destination and code never appear in this type.
 */
export interface ContactChallenge {
  /** contact_verifications.destination_hmac — 64-hex HMAC of the normalized destination. */
  readonly destinationHmac: Hmac64Hex;
  /** contact_verifications.challenge_hash — 64-hex digest of the issued code. */
  readonly challengeHash: Hmac64Hex;
  /** contact_verifications.expires_at. */
  readonly expiresAt: Instant;
  /**
   * contact_verifications.attempts — CHECK-bounded integer, 0..10 inclusive;
   * a counter beyond 10 must fail closed upstream (type cannot enforce bounds).
   */
  readonly attempts: number;
  /** contact_verifications.verified_at — set once on success. */
  readonly verifiedAt?: Instant;
}

/* -------------------------------------------------- notification prefs */

/**
 * notification_preferences row shape. Per-channel booleans keyed by stable
 * channel/topic names; `version` supports optimistic-concurrency updates and
 * `consentId` points at the governing consent record.
 */
export interface NotificationPreferences {
  /** notification_preferences.locale — BCP-47 tag. */
  readonly locale: string;
  /** notification_preferences.time_zone — IANA zone name. */
  readonly timeZone: string;
  /** notification_preferences.preferences — channel key → enabled. */
  readonly preferences: Readonly<Record<string, boolean>>;
  /** notification_preferences.version — monotonically increasing row version. */
  readonly version: number;
  /** notification_preferences.consent_id → consent record (uuid). */
  readonly consentId: UUID;
}

/* ------------------------------------------------------ hosted instruments */

/**
 * Evidence returned from a hosted wallet/tokenization session (OpenAPI
 * HostedSession + InstrumentInput) after provider-side completion, ready for
 * storage against funding_instruments.
 *
 * HARD BAN: this type MUST NEVER carry PAN, CVV/CVC, expiry, or any other
 * cardholder sensitive payload (PCI scope stays with the hosted provider —
 * only the opaque token reference and display mask cross the boundary).
 */
export interface HostedInstrumentEvidence {
  /** funding_instruments.provider_account_external_ref — exact provider string. */
  readonly providerAccountExternalRef: string;
  /** funding_instruments.method CHECK (InstrumentInput.method enum). */
  readonly method: FundingInstrumentMethod;
  /** funding_instruments.provider_token_hmac — 64-hex HMAC of the provider token. */
  readonly providerTokenHmac: Hmac64Hex;
  /** funding_instruments.mask — display-only last4/label; never derivable to a PAN. */
  readonly mask: string;
  /** funding_instruments.ownership_evidence_id (uuid) when ownership proof exists. */
  readonly ownershipEvidenceId?: UUID;
  /**
   * InstrumentInput.returnUri echo. JSDoc rule: validated against the EXACT
   * operator-configured allowlist BEFORE any storage occurs; an unsafe or
   * non-exact return URI is rejected outright (no prefix/wildcard matching).
   */
  readonly returnUri: string;
}

/**
 * Customer-visible instrument reference (funding_instruments projection).
 * Carries no provider secrets — mask and state only.
 */
export interface InstrumentRef {
  /** funding_instruments.id (uuid). */
  readonly instrumentId: UUID;
  /** funding_instruments.state — lifecycle visible to the customer. */
  readonly state: FundingInstrumentState;
  /** funding_instruments.mask — display-only. */
  readonly mask: string;
  /** funding_instruments.mandate_id (uuid) once the ACH/debit mandate is bound. */
  readonly mandateId?: UUID;
}

/* --------------------------------------------------- document access grants */

/**
 * document_access_grants row shape — single-use, purpose-bound links to
 * customer documents; step-up assurance is referenced, not embedded.
 */
export interface DocumentAccessGrant {
  /** document_access_grants.id (uuid). */
  readonly grantId: UUID;
  /** document_access_grants.document_id (uuid). */
  readonly documentId: UUID;
  /** document_access_grants.actor_ref — opaque actor pointer; never a client-selected role. */
  readonly actorRef: string;
  /** document_access_grants.purpose — audited business reason string. */
  readonly purpose: string;
  /** document_access_grants.step_up_ref — pointer to the satisfying step-up event. */
  readonly stepUpRef: string;
  /** document_access_grants.link_expires_at — short-lived bearer link deadline. */
  readonly linkExpiresAt: Instant;
  /** document_access_grants.state CHECK. */
  readonly state: 'issued' | 'consumed' | 'expired' | 'revoked';
}

/* ------------------------------------------------------------ capabilities */

/**
 * Fail-closed Problem for auth features that need T-CORE-02 command authority
 * (token minting, rotation, revocation effects) and are therefore NOT
 * implemented in this types-only lane. Detail text is fixed-shape and PII-free.
 */
export function unavailable(feature: string): Problem {
  return problem('capability_unavailable', 503, false, `${feature} requires T-CORE-02 command authority; not implemented`);
}

/**
 * Identity binding (T-IDENTITY-01). Ownership mismatch, replay, expired
 * challenge, reused refresh, and unsafe return URI never bind a session.
 * T-CORE-02 remains HOLD.
 */
export interface Identity01Input {
  readonly identityOwnershipMismatch: boolean;
  readonly identityEvidenceReplayed: boolean;
  readonly identityChallengeExpired: boolean;
  readonly refreshTokenReused: boolean;
  readonly unsafeReturnUri: boolean;
}

export type Identity01Output = never;

export type Identity01CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration'>;
