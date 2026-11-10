/**
 * Type-only T-GROW-08 consent-persistence contract v1.
 * No runtime values, validators, constructors, or export wiring.
 * Never ok:true.
 */

import type { UUID } from "./context.ts";

export type ConsentPersistenceContractVersion = "T-GROW-08/consent-persistence/v1";

export type ConsentPersistenceOperation = "updateNotificationPreferences";

export type ConsentLocale = "en" | "fil";

export type ConsentIdempotencyKey = string;

export type DecimalString = string;

export type QuietHoursClock = string;

export type OpaqueRef = string & { readonly __brand: "OpaqueRef" };

export type AuthorityRef = OpaqueRef & { readonly __authority: "customer-session-verifier" };

export type InstructionEvidenceRef = OpaqueRef & { readonly __instruction: "customer-instruction" };

export type AudienceKitaCustomer = "kita-customer";

export type PreferenceWritePurpose = "notification-preferences.write";

export type CommunicationPreferencesKind = "communication_preferences";

export interface ConsentPreferenceChange {
  readonly locale: ConsentLocale;
  readonly marketingEmail: boolean;
  readonly marketingSms: boolean;
  readonly marketingPush: boolean;
  readonly servicePush: boolean;
  readonly timeZone: string;
  readonly quietHoursStart?: QuietHoursClock;
  readonly quietHoursEnd?: QuietHoursClock;
  readonly expectedVersion: DecimalString;
}

export interface NormalizedConsentPreferenceChange {
  readonly locale: ConsentLocale;
  readonly marketingEmail: boolean;
  readonly marketingSms: boolean;
  readonly marketingPush: boolean;
  readonly servicePush: boolean;
  readonly timeZone: string;
  readonly quietHoursStart: QuietHoursClock | null;
  readonly quietHoursEnd: QuietHoursClock | null;
  readonly expectedVersion: DecimalString;
}

export interface ConsentPersistenceRequest {
  readonly operation: ConsentPersistenceOperation;
  readonly idempotencyKey: ConsentIdempotencyKey;
  readonly instructionEvidenceRef: InstructionEvidenceRef;
  readonly change: ConsentPreferenceChange;
}

export interface ConsentPersistenceContext {
  readonly authorityRef: AuthorityRef;
  readonly correlationId: string;
}

export interface SessionAuthorityEvidence {
  readonly issuerIdentity: string;
  readonly issuerVersion: string;
  readonly audience: AudienceKitaCustomer;
  readonly purpose: PreferenceWritePurpose;
  readonly sessionId: UUID;
  readonly bookId: UUID;
  readonly customerId: UUID;
  readonly verifiedAt: string;
  readonly expiresAt: string;
}

export interface CustomerInstructionEvidence {
  readonly issuerIdentity: string;
  readonly issuerVersion: string;
  readonly authorityRef: AuthorityRef;
  readonly sessionRef: OpaqueRef;
  readonly customerId: UUID;
  readonly bookId: UUID;
  readonly operation: ConsentPersistenceOperation;
  readonly idempotencyKey: ConsentIdempotencyKey;
  readonly change: NormalizedConsentPreferenceChange;
  readonly governingDocumentRef: OpaqueRef;
  readonly governingDocumentVersion: string;
  readonly governingDocumentHash: string;
  readonly governingDocumentLocale: ConsentLocale;
  readonly instructionAt: string;
  readonly expiresAt: string;
}

export interface ConsentPreferenceSnapshot {
  readonly locale: ConsentLocale;
  readonly timeZone: string;
  readonly marketingEmail: boolean;
  readonly marketingSms: boolean;
  readonly marketingPush: boolean;
  readonly servicePush: boolean;
  readonly quietHoursStart: QuietHoursClock | null;
  readonly quietHoursEnd: QuietHoursClock | null;
  readonly version: DecimalString;
  readonly consentId: UUID;
}

export interface ConsentWriteReceipt {
  readonly writeId: UUID;
  readonly bookId: UUID;
  readonly customerId: UUID;
  readonly actorId: UUID;
  readonly operation: ConsentPersistenceOperation;
  readonly idempotencyKey: ConsentIdempotencyKey;
  readonly requestHash: string;
  readonly instructionEvidenceRef: InstructionEvidenceRef;
  readonly disposition: "committed";
  readonly recordedAt: string;
  readonly consentId: UUID;
  readonly previousVersion: DecimalString;
  readonly version: DecimalString;
  readonly snapshot: ConsentPreferenceSnapshot;
  readonly governingDocumentRef: OpaqueRef;
  readonly governingDocumentVersion: string;
  readonly governingDocumentHash: string;
  readonly auditEventId: DecimalString;
}

export interface ConsentRejectionReceipt {
  readonly writeId: UUID;
  readonly bookId: UUID;
  readonly customerId: UUID;
  readonly actorId: UUID;
  readonly operation: ConsentPersistenceOperation;
  readonly idempotencyKey: ConsentIdempotencyKey;
  readonly requestHash: string;
  readonly instructionEvidenceRef: InstructionEvidenceRef;
  readonly disposition: "rejected";
  readonly recordedAt: string;
  readonly error: ConsentFixedError;
  readonly auditEventId: DecimalString;
}

export interface ConsentFixedError {
  readonly code: string;
  readonly status: number;
  readonly retryable: boolean;
  readonly detail: string;
}

export interface ConsentPersistenceBase {
  readonly ok: false;
  readonly error: ConsentFixedError;
}

export interface ConsentCommittedPersistence {
  readonly state: "committed";
  readonly receipt: ConsentWriteReceipt;
  readonly replayed: boolean;
}

export interface ConsentVersionConflictPersistence {
  readonly state: "conflict";
  readonly recorded: true;
  readonly receipt: ConsentRejectionReceipt;
  readonly replayed: boolean;
}

export interface ConsentUnrecordedConflictPersistence {
  readonly state: "conflict";
  readonly recorded: false;
}

export interface ConsentRejectedPersistence {
  readonly state: "rejected";
  readonly recorded: false;
}

export interface ConsentUnavailablePersistence {
  readonly state: "unavailable";
}

export interface ConsentUnconfirmedPersistence {
  readonly state: "unconfirmed";
}

export type ConsentCommittedOutcome = ConsentPersistenceBase & {
  readonly error: {
    readonly code: "CAPABILITY_UNAVAILABLE";
    readonly status: 503;
    readonly retryable: false;
    readonly detail: "Command execution is unavailable.";
  };
  readonly persistence: ConsentCommittedPersistence;
};

export type ConsentVersionConflictOutcome = ConsentPersistenceBase & {
  readonly error: {
    readonly code: "VERSION_CONFLICT";
    readonly status: 409;
    readonly retryable: false;
    readonly detail: "Preference version conflicts.";
  };
  readonly persistence: ConsentVersionConflictPersistence;
};

export type ConsentIdempotencyMismatchOutcome = ConsentPersistenceBase & {
  readonly error: {
    readonly code: "IDEMPOTENCY_MISMATCH";
    readonly status: 409;
    readonly retryable: false;
    readonly detail: "Idempotency key conflicts.";
  };
  readonly persistence: ConsentUnrecordedConflictPersistence;
};

export type ConsentEvidenceConsumedOutcome = ConsentPersistenceBase & {
  readonly error: {
    readonly code: "stale_or_conflicting_command";
    readonly status: 409;
    readonly retryable: false;
    readonly detail: "Instruction evidence was already consumed.";
  };
  readonly persistence: ConsentUnrecordedConflictPersistence;
};

export type ConsentInvalidRequestOutcome = ConsentPersistenceBase & {
  readonly error: {
    readonly code: "invalid_request";
    readonly status: 400;
    readonly retryable: false;
    readonly detail: "Invalid preference request.";
  };
  readonly persistence: ConsentRejectedPersistence;
};

export type ConsentUnauthenticatedOutcome = ConsentPersistenceBase & {
  readonly error: {
    readonly code: "unauthenticated";
    readonly status: 401;
    readonly retryable: false;
    readonly detail: "Customer authentication required.";
  };
  readonly persistence: ConsentRejectedPersistence;
};

export type ConsentUnauthorizedOutcome = ConsentPersistenceBase & {
  readonly error: {
    readonly code: "unauthorized";
    readonly status: 403;
    readonly retryable: false;
    readonly detail: "Preference authority denied.";
  };
  readonly persistence: ConsentRejectedPersistence;
};

export type ConsentNotFoundOutcome = ConsentPersistenceBase & {
  readonly error: {
    readonly code: "not_found";
    readonly status: 404;
    readonly retryable: false;
    readonly detail: "Owned preference resource unavailable.";
  };
  readonly persistence: ConsentRejectedPersistence;
};

export type ConsentDependencyUnavailableOutcome = ConsentPersistenceBase & {
  readonly error: {
    readonly code: "dependency_unavailable";
    readonly status: 503;
    readonly retryable: true;
    readonly detail: "Consent persistence dependency unavailable.";
  };
  readonly persistence: ConsentUnavailablePersistence;
};

export type ConsentCapabilityUnavailableOutcome = ConsentPersistenceBase & {
  readonly error: {
    readonly code: "CAPABILITY_UNAVAILABLE";
    readonly status: 503;
    readonly retryable: false;
    readonly detail: "Consent persistence is unavailable.";
  };
  readonly persistence: ConsentUnavailablePersistence;
};

export type ConsentUnconfirmedOutcome = ConsentPersistenceBase & {
  readonly error: {
    readonly code: "dependency_unavailable";
    readonly status: 503;
    readonly retryable: false;
    readonly detail: "Consent persistence is unconfirmed; recover using the same key.";
  };
  readonly persistence: ConsentUnconfirmedPersistence;
};

export type ConsentPersistenceOutcome =
  | ConsentCommittedOutcome
  | ConsentVersionConflictOutcome
  | ConsentIdempotencyMismatchOutcome
  | ConsentEvidenceConsumedOutcome
  | ConsentInvalidRequestOutcome
  | ConsentUnauthenticatedOutcome
  | ConsentUnauthorizedOutcome
  | ConsentNotFoundOutcome
  | ConsentDependencyUnavailableOutcome
  | ConsentCapabilityUnavailableOutcome
  | ConsentUnconfirmedOutcome;
