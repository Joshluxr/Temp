/**
 * @kita/contracts — T-TX-06 refund types.
 * Additive only. Concurrent partial refunds cannot exceed entitlement.
 */

import type { UUID, WorkerContext } from './context.ts';

export type Tx06CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration' | 'trace'>;

export interface Tx06Input {
  readonly concurrentPartialRefundsWouldExceedEntitlement: boolean;
  readonly journalPosting?: never;
  readonly transferAuthorization?: never;
}

export interface Tx06Output {
  readonly entitlementExceeded: true;
  readonly refundId: UUID;
  readonly traceEvents: readonly string[];
}
