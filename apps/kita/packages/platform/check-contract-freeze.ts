/**
 * @kita/platform — check-contract-freeze (T-CONTRACT-01).
 *
 * Pure fail-closed checker. Missing review, ownership conflict, untyped
 * money, unsafe outcome mapping, unresolved scope, and missing compatibility
 * evidence never freeze contracts. Never ok:true. Full T-CONTRACT-01 remains HOLD.
 */

import type {
  Contract01CommandContext,
  Contract01Input,
  Contract01Output,
} from '../contracts/src/contract-freeze.ts';
import type { Problem, Result } from '../contracts/src/result.ts';
import { err, problem } from '../contracts/src/result.ts';

export async function checkContractFreeze(
  _ctx: Contract01CommandContext,
  input: Contract01Input,
): Promise<Result<Contract01Output, Problem>> {
  if (input.requiredReviewMissing) {
    return err(
      problem(
        'unauthorized',
        403,
        false,
        'T-CONTRACT-01 supplied missing required review blocks contract freeze',
      ),
    );
  }
  if (input.ownershipConflictPresent) {
    return err(
      problem(
        'stale_or_conflicting_command',
        409,
        false,
        'T-CONTRACT-01 supplied conflicting ownership blocks contract freeze',
      ),
    );
  }
  if (input.untypedMoneyPresent) {
    return err(
      problem(
        'invalid_request',
        400,
        false,
        'T-CONTRACT-01 supplied untyped money blocks contract freeze',
      ),
    );
  }
  if (input.unsafeOutcomeMappingPresent) {
    return err(
      problem(
        'invalid_request',
        400,
        false,
        'T-CONTRACT-01 supplied unsafe outcome mapping blocks contract freeze',
      ),
    );
  }
  if (input.unresolvedScopeClaimPresent) {
    return err(
      problem(
        'invalid_request',
        400,
        false,
        'T-CONTRACT-01 supplied unresolved scope claim blocks contract freeze',
      ),
    );
  }
  if (input.compatibilityEvidenceMissing) {
    return err(
      problem(
        'invalid_request',
        400,
        false,
        'T-CONTRACT-01 supplied missing compatibility evidence blocks contract freeze',
      ),
    );
  }
  return err(
    problem(
      'dependency_unavailable',
      503,
      true,
      'T-CONTRACT-01 checkContractFreeze cannot verify reviewed definitions, ownership, money typing, outcome mapping, scope, signed hashes or compatibility: full T-CONTRACT-01 remains HOLD (fail closed)',
    ),
  );
}
