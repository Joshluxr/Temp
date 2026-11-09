/**
 * @kita/contracts — T-PUB-01 catalog types.
 * Additive only. Unapproved license or partner claims are never published.
 */

import type { UUID, WorkerContext } from './context.ts';

export type Pub01CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration' | 'trace'>;

export interface Pub01Input {
  readonly unapprovedLicenseOrPartnerClaim: boolean;
  readonly journalPosting?: never;
  readonly transferAuthorization?: never;
}

export interface Pub01Output {
  readonly publicClaimPublished: true;
  readonly contentId: UUID;
  readonly traceEvents: readonly string[];
}
