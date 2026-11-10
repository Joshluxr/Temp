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
