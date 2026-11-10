/**
 * @kita/contracts — T-PAY-06 bill-posting types.
 * Additive only. Aggregator acceptance never marks a bill paid.
 */

import type { UUID, WorkerContext } from './context.ts';

export type Pay06CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration' | 'trace'>;

export interface Pay06Input {
  readonly aggregatorAcceptedMarksBillPaid: boolean;
  readonly journalPosting?: never;
  readonly transferAuthorization?: never;
}

export interface Pay06Output {
  readonly billMarkedPaid: true;
  readonly payoutPosted: true;
  readonly billPaymentId: UUID;
  readonly traceEvents: readonly string[];
}

export interface Pay01Input {
  readonly unknownFirstProviderWouldDispatchSecond: boolean;
  readonly journalPosting?: never;
  readonly transferAuthorization?: never;
}

export interface Pay01Output {
  readonly secondPayoutDispatched: true;
  readonly payoutId: UUID;
  readonly traceEvents: readonly string[];
}

export interface Pay04Input {
  readonly expiryAloneFabricatesReturn: boolean;
  readonly journalPosting?: never;
  readonly transferAuthorization?: never;
}

export interface Pay04Output {
  readonly fabricatedReturnPosted: true;
  readonly availableTreatedAsCollected: true;
  readonly pickupId: UUID;
  readonly traceEvents: readonly string[];
}
