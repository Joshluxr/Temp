/**
 * @kita/contracts — T-REC-01 recipient types.
 * Additive only. CommandContext is minimal here (not a money runner).
 */

import type { UUID } from './context.ts';
import type { WorkerIdentity } from './platform.ts';

/** Minimal command identity for Rec01; no ledger runner, no client-selected role. */
export interface Rec01CommandContext {
  readonly actorId: UUID;
  readonly worker: WorkerIdentity;
  readonly trace: (message: string, fields?: Readonly<Record<string, string | number | boolean>>) => void;
}

export interface Rec01Input {
  readonly customerId: UUID;
  readonly serverSideOwned: boolean;
  readonly clientClaimedValidated: boolean;
  readonly accountNumberMasked?: string;
  readonly accountNumberFull?: string;
  readonly journalPosting?: never;
}

export interface Rec01Output {
  readonly recipientId: UUID;
  readonly persisted: true;
  readonly mask: string;
  readonly traceEvents: readonly string[];
}

/**
 * Wallet recipient (T-REC-02). Wrong network or expired validation blocks payout.
 */
export interface Rec02Input {
  readonly recipientId: UUID;
  readonly network: 'gcash' | 'maya' | string;
  readonly wrongNetwork: boolean;
  readonly validationExpired: boolean;
  readonly walletIdentifier?: string;
  readonly journalPosting?: never;
  readonly payoutAuthorization?: never;
}

export interface Rec02Output {
  readonly payoutAuthorized: true;
  readonly versionId: UUID;
  readonly traceEvents: readonly string[];
}

/**
 * Archive / immutable version (T-REC-03). Old transfer snapshots must survive edits.
 */
export interface Rec03Input {
  readonly recipientId: UUID;
  readonly expectedVersion: number;
  readonly expectedVersionMismatch: boolean;
  readonly journalPosting?: never;
  readonly mutateHistoricalSnapshot?: never;
}

export interface Rec03Output {
  readonly archived: true;
  readonly newVersion: number;
  readonly traceEvents: readonly string[];
}

/**
 * Repeat send (T-REC-04). Must obtain a new quote; never replay old payment.
 */
export interface Rec04Input {
  readonly historicalTransferId: UUID;
  readonly recipientId: UUID;
  readonly reuseOldPayment: boolean;
  readonly journalPosting?: never;
  readonly replayCommandId?: never;
  readonly replayQuoteId?: never;
  readonly replayProviderRef?: never;
}

export interface Rec04Output {
  readonly payableDraftCreated: true;
  readonly reusedOldPayment: true;
  readonly traceEvents: readonly string[];
}
