/**
 * @kita/contracts — T-CONTRACT-01 supplied-blocker freeze types.
 * Additive only. No hashing, freezeContracts, or successful freeze.
 */

import type { WorkerContext } from './context.ts';

/**
 * Contract freeze (T-CONTRACT-01). Missing review, ownership conflict,
 * untyped money, unsafe outcome mapping, unresolved scope, and missing
 * compatibility evidence never freeze contracts. Full T-CONTRACT-01 remains HOLD.
 */
export interface Contract01Input {
  readonly requiredReviewMissing: boolean;
  readonly ownershipConflictPresent: boolean;
  readonly untypedMoneyPresent: boolean;
  readonly unsafeOutcomeMappingPresent: boolean;
  readonly unresolvedScopeClaimPresent: boolean;
  readonly compatibilityEvidenceMissing: boolean;
}

export type Contract01Output = never;

export type Contract01CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration'>;
