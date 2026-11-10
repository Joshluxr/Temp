/**
 * @kita/contracts — T-FIN-05 liquidity-reservation types.
 * Additive only. Never spends the last prefund twice.
 */

import type { UUID, WorkerContext } from './context.ts';

export type Fin05CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration' | 'trace'>;

export interface Fin05Input {
  readonly concurrentSpendSameLastPrefund: boolean;
  readonly journalPosting?: never;
  readonly transferAuthorization?: never;
}

export interface Fin05Output {
  readonly lastPrefundSpentTwice: true;
  readonly reservationId: UUID;
  readonly traceEvents: readonly string[];
}

export type Fin06CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration' | 'trace'>;

export interface Fin06Input {
  readonly customerTermsDriftFromTradeAllocation: boolean;
  readonly journalPosting?: never;
  readonly transferAuthorization?: never;
}

export interface Fin06Output {
  readonly customerTermsDrifted: true;
  readonly allocationId: UUID;
  readonly traceEvents: readonly string[];
}
