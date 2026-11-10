/**
 * @kita/platform — check-ledger-evidence (T-FIN-01).
 *
 * Pure fail-closed checker. Missing review, identity/payload mismatch,
 * unproven journal integrity, unproven posting/period safety, and missing
 * execution evidence never accept a ledger. Never ok:true.
 * Full T-FIN-01 remains HOLD. No postBusinessEvent.
 */

import type {
  Fin01CommandContext,
  Fin01Input,
  Fin01Output,
} from '../contracts/src/ledger-evidence.ts';
import type { Problem, Result } from '../contracts/src/result.ts';
import { err, problem } from '../contracts/src/result.ts';

export async function checkLedgerEvidence(
  _ctx: Fin01CommandContext,
  input: Fin01Input,
): Promise<Result<Fin01Output, Problem>> {
  if (input.requiredReviewMissing === true) {
    return err(
      problem(
        'unauthorized',
        403,
        false,
        'T-FIN-01 supplied missing required architect, Controller or independent review blocks ledger evidence',
      ),
    );
  }
  if (input.ledgerIdentityOrPayloadMismatch === true) {
    return err(
      problem(
        'stale_or_conflicting_command',
        409,
        false,
        'T-FIN-01 supplied ledger identity or immutable payload mismatch blocks ledger evidence',
      ),
    );
  }
  if (input.journalIntegritySafetyUnproven === true) {
    return err(
      problem(
        'invalid_request',
        400,
        false,
        'T-FIN-01 supplied unproven nonempty, balanced, single-currency or immutable journal safety blocks ledger evidence',
      ),
    );
  }
  if (input.postingPolicyOrPeriodSafetyUnproven === true) {
    return err(
      problem(
        'invalid_request',
        400,
        false,
        'T-FIN-01 supplied unproven posting policy, period or atomic authority safety blocks ledger evidence',
      ),
    );
  }
  if (input.requiredEvidenceMissing === true) {
    return err(
      problem(
        'invalid_request',
        400,
        false,
        'T-FIN-01 supplied missing required ledger execution evidence blocks ledger evidence',
      ),
    );
  }
  return err(
    problem(
      'dependency_unavailable',
      503,
      true,
      'T-FIN-01 checkLedgerEvidence cannot verify nonempty balanced single-currency immutable journals, scoped evidence and event-key replay, approved posting policies or periods, nonnegative balances or allocation limits, atomic posting or current independent Controller review and execution evidence: full T-FIN-01, T-CORE-02 and T-LEDGER-02 remain HOLD (fail closed)',
    ),
  );
}
