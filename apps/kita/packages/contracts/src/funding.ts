/**
 * @kita/contracts — T-FUND-01 hosted-instrument types.
 * Additive only. Raw PAN/CVV never persist or log.
 */

import type { UUID, WorkerContext } from './context.ts';

export type Fund01CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration' | 'trace'>;

export interface Fund01Input {
  readonly rawPanOrCvvPresent: boolean;
  readonly journalPosting?: never;
  readonly transferAuthorization?: never;
}

export interface Fund01Output {
  readonly fundsCollected: true;
  readonly panPersisted: true;
  readonly sessionId: UUID;
  readonly traceEvents: readonly string[];
}

export interface Fund05Input {
  readonly timeoutAfterDebitWouldRecharge: boolean;
  readonly journalPosting?: never;
  readonly transferAuthorization?: never;
}

export interface Fund05Output {
  readonly secondChargeCreated: true;
  readonly operationId: UUID;
  readonly traceEvents: readonly string[];
}

export interface Fund07Input {
  readonly unownedCashRecognizedAsRevenue: boolean;
  readonly journalPosting?: never;
  readonly transferAuthorization?: never;
}

export interface Fund07Output {
  readonly unownedCashPostedAsRevenue: true;
  readonly movementId: UUID;
  readonly traceEvents: readonly string[];
}

export interface Fund06Input {
  readonly erasePaidPhpOrSeizeUnrelatedWallet: boolean;
  readonly journalPosting?: never;
  readonly transferAuthorization?: never;
}

export interface Fund06Output {
  readonly paidPhpErased: true;
  readonly unrelatedWalletSeized: true;
  readonly disputeId: UUID;
  readonly traceEvents: readonly string[];
}

export interface Fund04Input {
  readonly unapprovedMethod: boolean;
  readonly journalPosting?: never;
  readonly transferAuthorization?: never;
}

export interface Fund04Output {
  readonly unapprovedMethodEnabled: true;
  readonly fundsCollected: true;
  readonly capabilityId: UUID;
  readonly traceEvents: readonly string[];
}

export type Fund02CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration' | 'trace'>;

export interface Fund02Input {
  readonly initiationAloneWouldAuthorizePayout: boolean;
  readonly journalPosting?: never;
  readonly transferAuthorization?: never;
}

export interface Fund02Output {
  readonly payoutAuthorizedFromInitiation: true;
  readonly settlementId: UUID;
  readonly traceEvents: readonly string[];
}
