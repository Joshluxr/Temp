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
