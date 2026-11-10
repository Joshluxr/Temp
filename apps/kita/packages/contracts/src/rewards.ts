/**
 * @kita/contracts — T-GROW-04 referral types.
 * Additive only. Self-referral never issues points.
 */

import type { UUID, WorkerContext } from './context.ts';

export type Grow04CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration' | 'trace'>;

export interface Grow04Input {
  readonly selfReferral: boolean;
  readonly journalPosting?: never;
  readonly transferAuthorization?: never;
}

export interface Grow04Output {
  readonly pointsIssued: true;
  readonly selfReferralQualified: true;
  readonly referralId: UUID;
  readonly traceEvents: readonly string[];
}

export type Grow01CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration' | 'trace'>;

export interface Grow01Input {
  readonly duplicatePayoutCallbackAwardsTwice: boolean;
  readonly journalPosting?: never;
  readonly transferAuthorization?: never;
}

export interface Grow01Output {
  readonly pointsAwardedTwice: true;
  readonly duplicateCallbackAccepted: true;
  readonly vestId: UUID;
  readonly traceEvents: readonly string[];
}

export type Grow02CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration' | 'trace'>;

export interface Grow02Input {
  readonly concurrentRedemptionExpiryOverspend: boolean;
  readonly journalPosting?: never;
  readonly transferAuthorization?: never;
}

export interface Grow02Output {
  readonly lotOverspent: true;
  readonly reservationId: UUID;
  readonly traceEvents: readonly string[];
}

export type Grow03CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration' | 'trace'>;

export interface Grow03Input {
  readonly lastBudgetUnitReservedTwice: boolean;
  readonly journalPosting?: never;
  readonly transferAuthorization?: never;
}

export interface Grow03Output {
  readonly lastBudgetUnitReservedTwice: true;
  readonly promotionReservationId: UUID;
  readonly traceEvents: readonly string[];
}
