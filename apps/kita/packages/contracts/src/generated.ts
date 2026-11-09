/**
 * @kita/contracts — generated-style client type barrel.
 *
 * HAND-WRITTEN to mirror the frozen contract bundle (docs/kita-plan/openapi/
 * kita-v1.yaml + evidence/operations.json). Per 06-api-contracts.md §F6, real
 * generated TypeScript clients and runtime validators must derive from the same
 * schemas at T-CONTRACT-01; this file is the placeholder shape that generation
 * will reproduce, so downstream lanes can compile against the final surface
 * today. Do not add fields here that are not in the wire schema.
 *
 * Money on the wire is `{currency, minor: "50399"}` with minor as a decimal
 * STRING (§F1); these types describe money but no client function executes a
 * money effect. No generated client returns mock data when the server is
 * unreachable — recovery is read-oriented only (see @kita/api-client).
 */

import type { Problem, ProblemCode, Result } from './result.ts';

export type WireMoney = { readonly currency: string; readonly minor: string };
export type WireRate = { readonly numerator: string; readonly denominator: string };
export type OpaqueCursor = string;

export interface WireFieldErrors {
  readonly field: string;
  readonly message: string;
}

/** Mirrors F2 problem body exactly (type/title/status/code/requestId/retryable/…). */
export interface WireProblem {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly code: ProblemCode;
  readonly requestId: string;
  readonly retryable: boolean;
  readonly operationId?: string;
  readonly fieldErrors?: readonly WireFieldErrors[];
}

/* ---- transfer operations (read projections + recovery lookup) ---- */

export interface TransferSummary {
  readonly id: string;
  readonly state: string;
  readonly version: string;
  readonly sourceAmount: WireMoney;
  readonly targetAmount: WireMoney;
  readonly allowedActions: readonly string[];
}

/** GET /v1/commands/{key}?operation=acceptTransfer — scoped replay lookup (§F1). */
export interface CommandState<TResponse = unknown> {
  readonly key: string;
  readonly operation: string;
  readonly status: 'pending' | 'succeeded' | 'failed' | 'unknown';
  readonly response?: TResponse;
  readonly problem?: WireProblem;
  readonly recordedAt: string;
}

/* ---- public estimate/catalog (no executable quote ID ever returned) ---- */

export interface PublicEstimate {
  readonly corridor: string;
  readonly indicative: WireRate;
  readonly displayLow: WireMoney;
  readonly displayHigh: WireMoney;
}

/* ---- envelope helpers ---- */

export interface Page<T> {
  readonly items: readonly T[];
  readonly nextCursor?: OpaqueCursor;
}

export type ClientResult<T> = Result<T, Problem>;

export type { Problem, ProblemCode, Result } from './result.ts';
export type * from './platform.ts';
export type * from './context.ts';
