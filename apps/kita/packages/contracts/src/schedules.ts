/**
 * @kita/contracts — T-TX-10 schedule types.
 * Additive only. DST retry produces one authorized occurrence.
 */

import type { UUID, WorkerContext } from './context.ts';

export type Tx10CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration' | 'trace'>;

export interface Tx10Input {
  readonly dstRetryWouldCreateSecondOccurrence: boolean;
  readonly journalPosting?: never;
  readonly transferAuthorization?: never;
}

export interface Tx10Output {
  readonly secondOccurrenceCreated: true;
  readonly occurrenceId: UUID;
  readonly traceEvents: readonly string[];
}
