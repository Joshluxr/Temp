/**
 * @kita/domain — check-identity-binding (T-IDENTITY-01).
 *
 * Pure fail-closed checker. Ownership mismatch, replay, expired challenge,
 * reused refresh, and unsafe return URI never bind a session. Never ok:true.
 * Identity stores and T-CORE-02 remain HOLD.
 */

import type {
  Identity01CommandContext,
  Identity01Input,
  Identity01Output,
} from '../../contracts/src/auth.ts';
import type { Problem, Result } from '../../contracts/src/result.ts';
import { err, problem } from '../../contracts/src/result.ts';

export async function checkIdentityBinding(
  _ctx: Identity01CommandContext,
  input: Identity01Input,
): Promise<Result<Identity01Output, Problem>> {
  if (input.identityOwnershipMismatch) {
    return err(
      problem(
        'unauthorized',
        403,
        false,
        'T-IDENTITY-01 supplied identity ownership mismatch blocks binding',
      ),
    );
  }
  if (input.identityEvidenceReplayed) {
    return err(
      problem(
        'stale_or_conflicting_command',
        409,
        false,
        'T-IDENTITY-01 supplied replayed identity evidence blocks binding',
      ),
    );
  }
  if (input.identityChallengeExpired) {
    return err(
      problem(
        'stale_or_conflicting_command',
        409,
        false,
        'T-IDENTITY-01 supplied expired identity challenge blocks binding',
      ),
    );
  }
  if (input.refreshTokenReused) {
    return err(
      problem(
        'stale_or_conflicting_command',
        409,
        false,
        'T-IDENTITY-01 supplied reused refresh token blocks binding',
      ),
    );
  }
  if (input.unsafeReturnUri) {
    return err(
      problem(
        'invalid_request',
        400,
        false,
        'T-IDENTITY-01 supplied unsafe return URI blocks binding',
      ),
    );
  }
  return err(
    problem(
      'dependency_unavailable',
      503,
      true,
      'T-IDENTITY-01 checkIdentityBinding cannot verify identity or bind a session: identity stores and T-CORE-02 remain HOLD (fail closed)',
    ),
  );
}
