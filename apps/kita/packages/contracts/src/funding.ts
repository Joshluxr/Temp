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
