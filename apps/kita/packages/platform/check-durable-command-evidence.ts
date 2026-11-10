/**
 * @kita/platform — check-durable-command-evidence (T-CORE-02).
 *
 * Pure fail-closed checker. Missing review, identity/payload mismatch,
 * unproven durable authority, unproven hold/limit safety, and missing
 * execution evidence never accept durable commands. Never ok:true.
 * Full T-CORE-02 remains HOLD. No executeCommand.
 */

import type {
  Core02CommandContext,
  Core02Input,
  Core02Output,
} from '../contracts/src/durable-command-evidence.ts';
import type { Problem, Result } from '../contracts/src/result.ts';
import { err, problem } from '../contracts/src/result.ts';

export async function checkDurableCommandEvidence(
  _ctx: Core02CommandContext,
  input: Core02Input,
): Promise<Result<Core02Output, Problem>> {
  if (input.requiredReviewMissing === true) {
    return err(
      problem(
        'unauthorized',
        403,
        false,
        'T-CORE-02 supplied missing required architect or independent review blocks durable command evidence',
      ),
    );
  }
  if (input.commandIdentityOrPayloadMismatch === true) {
    return err(
      problem(
        'stale_or_conflicting_command',
        409,
        false,
        'T-CORE-02 supplied command identity or immutable payload mismatch blocks durable command evidence',
      ),
    );
  }
  if (input.durableAuthoritySafetyUnproven === true) {
    return err(
      problem(
        'invalid_request',
        400,
        false,
        'T-CORE-02 supplied unproven durable command or fenced authority safety blocks durable command evidence',
      ),
    );
  }
  if (input.subjectHoldOrLimitSafetyUnproven === true) {
    return err(
      problem(
        'invalid_request',
        400,
        false,
        'T-CORE-02 supplied unproven subject hold or limit safety blocks durable command evidence',
      ),
    );
  }
  if (input.requiredEvidenceMissing === true) {
    return err(
      problem(
        'invalid_request',
        400,
        false,
        'T-CORE-02 supplied missing required durable command execution evidence blocks durable command evidence',
      ),
    );
  }
  return err(
    problem(
      'dependency_unavailable',
      503,
      true,
      'T-CORE-02 checkDurableCommandEvidence cannot verify durable commands, idempotency or response recovery, scoped ownership, fenced authority, subject holds, limit buckets, atomic command/state/event/outbox/audit or current independent review and execution evidence: full T-CORE-02 remains HOLD (fail closed)',
    ),
  );
}
