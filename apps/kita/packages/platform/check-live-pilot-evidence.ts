/**
 * @kita/platform — check-live-pilot-evidence (T-LIVE-01).
 *
 * Pure fail-closed checker. Missing review, identity/scope mismatch,
 * unproven caps/stop safety, unproven reconciliation/remedy, and missing
 * execution evidence never accept a live pilot. Never ok:true.
 * Full T-LIVE-01 remains HOLD. No live traffic.
 */

import type {
  Live01CommandContext,
  Live01Input,
  Live01Output,
} from '../contracts/src/live-pilot-evidence.ts';
import type { Problem, Result } from '../contracts/src/result.ts';
import { err, problem } from '../contracts/src/result.ts';

export async function checkLivePilotEvidence(
  _ctx: Live01CommandContext,
  input: Live01Input,
): Promise<Result<Live01Output, Problem>> {
  if (input.requiredReviewMissing === true) {
    return err(
      problem(
        'unauthorized',
        403,
        false,
        'T-LIVE-01 supplied missing required business owner, Controller, Ops, architect or independent review blocks live pilot evidence',
      ),
    );
  }
  if (input.pilotIdentityOrScopeMismatch === true) {
    return err(
      problem(
        'stale_or_conflicting_command',
        409,
        false,
        'T-LIVE-01 supplied pilot identity, exact candidate or authorized scope mismatch blocks live pilot evidence',
      ),
    );
  }
  if (input.pilotCapsOrStopSafetyUnproven === true) {
    return err(
      problem(
        'invalid_request',
        400,
        false,
        'T-LIVE-01 supplied unproven cohort, dates, exposure caps or stop safety blocks live pilot evidence',
      ),
    );
  }
  if (input.reconciliationOrRemedySafetyUnproven === true) {
    return err(
      problem(
        'invalid_request',
        400,
        false,
        'T-LIVE-01 supplied unproven movement reconciliation, unknown payout, remedy or reserve safety blocks live pilot evidence',
      ),
    );
  }
  if (input.requiredEvidenceMissing === true) {
    return err(
      problem(
        'invalid_request',
        400,
        false,
        'T-LIVE-01 supplied missing required live pilot execution evidence blocks live pilot evidence',
      ),
    );
  }
  return err(
    problem(
      'dependency_unavailable',
      503,
      true,
      'T-LIVE-01 checkLivePilotEvidence cannot verify signed pilot scope or exact candidate, cohort/dates/caps or stop safety, bank/provider/ledger reconciliation, unknown payouts or remedy deadlines, daily close or late-return reserves, current approvals or independent execution evidence: full T-LIVE-01 and T-GA-01 remain HOLD; no live traffic, bank/provider calls or money authorized (fail closed)',
    ),
  );
}
