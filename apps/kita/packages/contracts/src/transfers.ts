/**
 * @kita/contracts — T-TX-08 support-message types.
 * Additive only. Wrong account cannot read or attach case evidence.
 */

import type { UUID, WorkerContext } from './context.ts';

export type Tx08CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration' | 'trace'>;

export interface Tx08Input {
  readonly wrongAccountOrCrossCaseAttachment: boolean;
  readonly journalPosting?: never;
  readonly transferAuthorization?: never;
}

export interface Tx08Output {
  readonly crossCaseEvidenceAttached: true;
  readonly messageId: UUID;
  readonly traceEvents: readonly string[];
}

export interface Tx09Input {
  readonly confidentialRiskInPublicProjection: boolean;
  readonly journalPosting?: never;
  readonly transferAuthorization?: never;
}

export interface Tx09Output {
  readonly confidentialRiskProjected: true;
  readonly rfiId: UUID;
  readonly traceEvents: readonly string[];
}

export interface Tx03Input {
  readonly cursorExposesOtherCustomer: boolean;
  readonly journalPosting?: never;
  readonly transferAuthorization?: never;
}

export interface Tx03Output {
  readonly otherCustomerRecordsExposed: true;
  readonly transferIds: readonly UUID[];
  readonly traceEvents: readonly string[];
}

export interface Tx04Input {
  readonly rewriteIssuedReceiptAfterPricingUpdate: boolean;
  readonly journalPosting?: never;
  readonly transferAuthorization?: never;
}

export interface Tx04Output {
  readonly issuedReceiptRewritten: true;
  readonly receiptId: UUID;
  readonly traceEvents: readonly string[];
}

export interface Tx07Input {
  readonly supportHandoffResetsStatutoryClock: boolean;
  readonly journalPosting?: never;
  readonly transferAuthorization?: never;
}

export interface Tx07Output {
  readonly statutoryClockReset: true;
  readonly refundGranted: true;
  readonly claimId: UUID;
  readonly traceEvents: readonly string[];
}

export interface Tx02Input {
  readonly lateReturnErasesPaidHistory: boolean;
  readonly journalPosting?: never;
  readonly transferAuthorization?: never;
}

export interface Tx02Output {
  readonly moneyAuthorizedByProjection: true;
  readonly paidHistoryErased: true;
  readonly transferId: UUID;
  readonly traceEvents: readonly string[];
}
