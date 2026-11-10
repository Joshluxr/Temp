/**
 * @kita/contracts — T-FIN-07 period-close types.
 * Additive only. Never accepts unauthorized backdated posting.
 */

import type { UUID, WorkerContext } from './context.ts';

export type Fin07CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration' | 'trace'>;

export interface Fin07Input {
  readonly unauthorizedBackdatedPostingIntoClosedPeriod: boolean;
  readonly journalPosting?: never;
  readonly transferAuthorization?: never;
}

export interface Fin07Output {
  readonly closedPeriodPosted: true;
  readonly periodId: UUID;
  readonly traceEvents: readonly string[];
}
