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
