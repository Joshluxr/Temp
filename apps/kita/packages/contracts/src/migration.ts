/**
 * @kita/contracts — T-MIG-01 supplied-blocker types.
 * Additive only. No archive scan, hash comparison, or data import.
 */

import type { WorkerContext } from './context.ts';

/**
 * Migration evidence (T-MIG-01). Archive mutation, hash mismatch, incomplete
 * dispositions, prohibited runtime references, and unauthorized import never
 * complete migration. Full T-MIG-01 remains HOLD.
 */
export interface Mig01Input {
  readonly archiveMutationRequested: boolean;
  readonly sourceHashMismatch: boolean;
  readonly dispositionCoverageIncomplete: boolean;
  readonly prohibitedRuntimeReferencePresent: boolean;
  readonly dataImportNotAuthorized: boolean;
}

export type Mig01Output = never;

export type Mig01CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration'>;
