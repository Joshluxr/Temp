/**
 * @kita/contracts — T-GROW-07 notification types.
 * Additive only. Duplicate event never reports success or vendor send.
 */

import type { UUID, WorkerContext } from './context.ts';

export type Grow07CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration' | 'trace'>;

export interface Grow07Input {
  readonly duplicateEventPerChannel: boolean;
  readonly journalPosting?: never;
  readonly transferAuthorization?: never;
}

export interface Grow07Output {
  readonly vendorMessageSent: true;
  readonly duplicateSuccess: true;
  readonly notificationId: UUID;
  readonly traceEvents: readonly string[];
}
