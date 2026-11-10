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

/**
 * Custody settlement (T-EXT-02). Unauthorized movement, policy mismatch,
 * depeg/reorg, and uncertain settlement never produce available PHP cash.
 * T-CORE-02, T-LEDGER-02, and DEP-11 remain HOLD.
 */
export interface Ext02Input {
  readonly unauthorizedCustodyMovement: boolean;
  readonly assetOrNetworkPolicyMismatch: boolean;
  readonly depegOrReorgDetected: boolean;
  readonly settlementUncertain: boolean;
}

export type Ext02Output = never;

export type Ext02CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration'>;
