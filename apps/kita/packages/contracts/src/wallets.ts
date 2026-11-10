/**
 * @kita/contracts — T-WAL-01 wallet-balance types.
 * Additive only. Spendable balances are never returned from this checker.
 */

import type { UUID, WorkerContext } from './context.ts';

export type Wal01CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration' | 'trace'>;

export interface Wal01Input {
  readonly projectionLedgerDisagree: boolean;
  readonly journalPosting?: never;
  readonly transferAuthorization?: never;
}

export interface Wal01Output {
  readonly spendableBalances: true;
  readonly available: true;
  readonly pending: true;
  readonly reserved: true;
  readonly walletId: UUID;
  readonly traceEvents: readonly string[];
}

export type Wal02CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration' | 'trace'>;

export interface Wal02Input {
  readonly creditWithoutSettlementOrApprovedEvidence: boolean;
  readonly journalPosting?: never;
  readonly transferAuthorization?: never;
}

export interface Wal02Output {
  readonly fundsCredited: true;
  readonly topupId: UUID;
  readonly traceEvents: readonly string[];
}

export type Wal03CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration' | 'trace'>;

export interface Wal03Input {
  readonly twoSimultaneousSpendsWouldOverdraw: boolean;
  readonly journalPosting?: never;
  readonly transferAuthorization?: never;
}

export interface Wal03Output {
  readonly overdrawn: true;
  readonly reservationId: UUID;
  readonly traceEvents: readonly string[];
}

export type Wal04CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration' | 'trace'>;

export interface Wal04Input {
  readonly fourCurrencyLegsUnbalancedOrUnconfirmedTarget: boolean;
  readonly journalPosting?: never;
  readonly transferAuthorization?: never;
}

export interface Wal04Output {
  readonly unconfirmedTargetAvailable: true;
  readonly conversionId: UUID;
  readonly traceEvents: readonly string[];
}

export type Wal05CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration' | 'trace'>;

export interface Wal05Input {
  readonly failedRefundDropsObligationOrClosureLosesFunds: boolean;
  readonly journalPosting?: never;
  readonly transferAuthorization?: never;
}

export interface Wal05Output {
  readonly remainingFundsLost: true;
  readonly withdrawalId: UUID;
  readonly traceEvents: readonly string[];
}

export type Wal06CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration' | 'trace'>;

export interface Wal06Input {
  readonly unscreenedPartyOrCrossBookWithoutSettlementPolicy: boolean;
  readonly journalPosting?: never;
  readonly transferAuthorization?: never;
}

export interface Wal06Output {
  readonly unscreenedOrCrossBookTransferred: true;
  readonly transferId: UUID;
  readonly traceEvents: readonly string[];
}
