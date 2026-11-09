/**
 * @kita/contracts — T-AUTH-01 identity types.
 * Additive only. Contacts are never financial authorization alone.
 */

import type { UUID, WorkerContext } from './context.ts';

export type Auth01CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration' | 'trace'>;

export interface Auth01Input {
  readonly contactVerified: boolean;
  readonly journalPosting?: never;
  readonly transferAuthorization?: never;
}

export interface Auth01Output {
  readonly transferAuthorized: true;
  readonly customerId: UUID;
  readonly traceEvents: readonly string[];
}
