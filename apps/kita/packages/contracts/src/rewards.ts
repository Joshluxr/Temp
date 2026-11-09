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
