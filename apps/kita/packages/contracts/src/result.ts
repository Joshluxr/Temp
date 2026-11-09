/**
 * @kita/contracts — shared Result/problem types.
 *
 * Mirrors docs/kita-plan/06-api-contracts.md §F2 (wire problem body) and the
 * backlog M2 note: "Result<T> is success or the F2 problem
 * (code,status,retryable,operationId?,fieldErrors?)". Internal signatures never
 * replace the public wire schema without review (T-CONTRACT-01 owns the freeze).
 */

/** Stable problem codes from 06-api-contracts.md §F2. Additive only pre-freeze. */
export type ProblemCode =
  | 'invalid_request'
  | 'unauthenticated'
  | 'unauthorized'
  | 'not_found'
  | 'stale_or_conflicting_command'
  | 'throttled'
  | 'capability_unavailable'
  | 'dependency_unavailable'
  | 'QUOTE_EXPIRED'
  | 'QUOTE_ALREADY_ACCEPTED'
  | 'RECIPIENT_VERSION_CHANGED'
  | 'CAPABILITY_UNAVAILABLE'
  | 'RATE_STALE'
  | 'INSUFFICIENT_FUNDS'
  | 'LIQUIDITY_UNAVAILABLE'
  | 'FUNDING_PENDING'
  | 'COMPLIANCE_HOLD'
  | 'APPROVAL_REQUIRED'
  | 'APPROVAL_STALE'
  | 'PROVIDER_OUTCOME_UNKNOWN'
  | 'IDEMPOTENCY_MISMATCH'
  | 'VERSION_CONFLICT'
  | 'LIMIT_EXCEEDED'
  | 'POLICY_UNAVAILABLE'
  // T-PLAT task-specific codes (backlog 13-backlog.md T-PLAT-01/02 "additional errors")
  | 'UNRESOLVED_VERSION'
  | 'COMPATIBILITY_FAILURE'
  | 'SECURITY_FAILURE'
  | 'MIGRATION_CHECKSUM_FAILURE'
  | 'MIGRATION_PERMISSION_FAILURE'
  | 'MIGRATION_INVARIANT_FAILURE'
  | 'SANDBOX_MONEY_IMPORT_FORBIDDEN'
  | 'OUTCOME_MANUFACTURING_FORBIDDEN';

/** Field-level validation error (F2 `fieldErrors?`). */
export interface FieldError {
  readonly field: string;
  readonly message: string;
}

/** The F2 problem shape, minus `type/title` which the HTTP layer composes. */
export interface Problem {
  readonly code: ProblemCode;
  readonly status: number;
  readonly retryable: boolean;
  readonly detail: string;
  readonly operationId?: string;
  readonly fieldErrors?: readonly FieldError[];
}

/** Discriminated success/failure union used across all internal handlers. */
export type Result<T, E = Problem> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<T, E = Problem>(error: E): Result<T, E> {
  return { ok: false, error };
}

/** Convenience constructor keeping detail strings bounded and non-PII (§F2 rule). */
export function problem(
  code: ProblemCode,
  status: number,
  retryable: boolean,
  detail: string,
  extra?: { readonly operationId?: string; readonly fieldErrors?: readonly FieldError[] },
): Problem {
  const trimmed = detail.slice(0, 500);
  return extra ? { code, status, retryable, detail: trimmed, ...extra } : { code, status, retryable, detail: trimmed };
}
