/**
 * @kita/contracts — T-FIN-03 statement-reconciliation types.
 * Additive only. Never posts a reconciling journal.
 */

import type { UUID, WorkerContext } from './context.ts';

export type Fin03CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration' | 'trace'>;

export interface Fin03Input {
  readonly threeWayMismatchWouldForceBalance: boolean;
  readonly journalPosting?: never;
  readonly transferAuthorization?: never;
}

export interface Fin03Output {
  readonly forcedBalancedBook: true;
  readonly reconcilingJournalPosted: true;
  readonly reconciliationId: UUID;
  readonly traceEvents: readonly string[];
}
