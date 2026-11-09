/**
 * @kita/contracts — T-GROW-05 rate-alert types.
 * Additive only. Oscillating or stale rates never execute money.
 */

import type { UUID, WorkerContext } from './context.ts';

export type Grow05CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration' | 'trace'>;

export interface Grow05Input {
  readonly oscillatingOrStaleRate: boolean;
  readonly journalPosting?: never;
  readonly transferAuthorization?: never;
}

export interface Grow05Output {
  readonly moneyExecuted: true;
  readonly alertSpammed: true;
  readonly alertId: UUID;
  readonly traceEvents: readonly string[];
}
