/**
 * @kita/platform — check-launch-evidence (T-GA-01).
 *
 * Pure fail-closed checker. Missing review, identity/scope mismatch,
 * unproven pilot exit/reconciliation, unproven staged exposure/ops safety,
 * and missing execution evidence never accept launch. Never ok:true.
 * Full T-GA-01 remains HOLD. No launch or G1-G6.
 */

import type {
  Ga01CommandContext,
  Ga01Input,
  Ga01Output,
} from '../contracts/src/launch-evidence.ts';
import type { Problem, Result } from '../contracts/src/result.ts';
import { err, problem } from '../contracts/src/result.ts';

export async function checkLaunchEvidence(
  _ctx: Ga01CommandContext,
  input: Ga01Input,
): Promise<Result<Ga01Output, Problem>> {
  if (input.requiredReviewMissing === true) {
    return err(
      problem(
        'unauthorized',
        403,
        false,
        'T-GA-01 supplied missing required business owner, architect, Finance, Compliance, Security or independent review blocks launch evidence',
      ),
    );
  }
  if (input.launchIdentityOrScopeMismatch === true) {
    return err(
      problem(
        'stale_or_conflicting_command',
        409,
        false,
        'T-GA-01 supplied launch identity, exact candidate or authorized scope mismatch blocks launch evidence',
      ),
    );
  }
  if (input.pilotExitOrReconciliationUnproven === true) {
    return err(
      problem(
        'invalid_request',
        400,
        false,
        'T-GA-01 supplied unproven reconciled pilot exit, unknown payout, remedy or reserve safety blocks launch evidence',
      ),
    );
  }
  if (input.stagedExposureOrOperationalSafetyUnproven === true) {
    return err(
      problem(
        'invalid_request',
        400,
        false,
        'T-GA-01 supplied unproven staged exposure caps, stop safety or operational readiness blocks launch evidence',
      ),
    );
  }
  if (input.requiredEvidenceMissing === true) {
    return err(
      problem(
        'invalid_request',
        400,
        false,
        'T-GA-01 supplied missing required current exact-artifact launch evidence blocks launch evidence',
      ),
    );
  }
  return err(
    problem(
      'dependency_unavailable',
      503,
      true,
      'T-GA-01 checkLaunchEvidence cannot verify signed launch scope or exact candidate, current G1-G5 evidence or reconciled pilot exit, staged caps or stop safety, staffing/liquidity/concentration/SLO/incident/renewal controls, capacity/security/recovery or independent approvals and execution evidence: full T-GA-01 and T-LIVE-01 remain HOLD; no launch, production, live traffic, bank/provider calls or money authorized (fail closed)',
    ),
  );
}
