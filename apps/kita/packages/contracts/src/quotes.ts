/**
 * @kita/contracts — T-QUOTE-04 rate-validation types.
 * Additive only. Stale cached rates never execute.
 */

import type { UUID, WorkerContext } from './context.ts';

export type Quote04CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration' | 'trace'>;

export interface Quote04Input {
  readonly staleQuoteWouldExecuteFromCache: boolean;
  readonly journalPosting?: never;
  readonly transferAuthorization?: never;
}

export interface Quote04Output {
  readonly staleCachedRateExecuted: true;
  readonly quoteId: UUID;
  readonly traceEvents: readonly string[];
}

export type Quote05CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration' | 'trace'>;

export interface Quote05Input {
  readonly expiryEqualityOrRecipientChange: boolean;
  readonly journalPosting?: never;
  readonly transferAuthorization?: never;
}

export interface Quote05Output {
  readonly expiredQuoteAccepted: true;
  readonly transferId: UUID;
  readonly traceEvents: readonly string[];
}
