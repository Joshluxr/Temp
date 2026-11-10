/**
 * @kita/contracts — T-BASE-01 supplied-blocker types.
 * Additive only. No filesystem scan, path validation, or handoff.
 */

import type { WorkerContext } from './context.ts';

/**
 * Workspace evidence (T-BASE-01). Archive overlap, unrelated root overlap,
 * path traversal, batch mismatch, and handoff hash mismatch never accept a
 * workspace. Full T-BASE-01 remains HOLD.
 */
export interface Base01Input {
  readonly sourceArchiveOverlapPresent: boolean;
  readonly unrelatedRootOverlapPresent: boolean;
  readonly pathTraversalPresent: boolean;
  readonly batchScopeMismatch: boolean;
  readonly handoffHashMismatch: boolean;
}

export type Base01Output = never;

export type Base01CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration'>;
