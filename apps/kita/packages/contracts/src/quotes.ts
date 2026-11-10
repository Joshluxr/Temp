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

export type Quote08CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration' | 'trace'>;

export interface Quote08Input {
  readonly staleDraftWouldOverwriteNewerRecipientOrAmount: boolean;
  readonly journalPosting?: never;
  readonly transferAuthorization?: never;
}

export interface Quote08Output {
  readonly staleDraftOverwroteNewerIntent: true;
  readonly draftId: UUID;
  readonly traceEvents: readonly string[];
}

export type Quote07CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration' | 'trace'>;

export interface Quote07Input {
  readonly displayRoundingWouldChangeExecutionArithmetic: boolean;
  readonly journalPosting?: never;
  readonly transferAuthorization?: never;
}

export interface Quote07Output {
  readonly executionArithmeticChangedByDisplayRounding: true;
  readonly quoteId: UUID;
  readonly traceEvents: readonly string[];
}

export type Quote02CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration' | 'trace'>;

export interface Quote02Input {
  readonly inverseWouldMissRequestedMinorAmount: boolean;
  readonly journalPosting?: never;
  readonly transferAuthorization?: never;
}

export interface Quote02Output {
  readonly payoutMissesRequestedMinor: true;
  readonly quoteId: UUID;
  readonly traceEvents: readonly string[];
}

export type Quote03CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration' | 'trace'>;

export interface Quote03Input {
  readonly missingTaxWouldDefaultZeroOrInexactTierTotals: boolean;
  readonly journalPosting?: never;
  readonly transferAuthorization?: never;
}

export interface Quote03Output {
  readonly missingTaxDefaultedZero: true;
  readonly quoteId: UUID;
  readonly traceEvents: readonly string[];
}
