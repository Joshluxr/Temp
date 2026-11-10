/**
 * @kita/providers — check-adapter-evidence (T-ADAPTER-01).
 *
 * Pure fail-closed checker. Account/environment mismatch, invalid signature,
 * replay, and payload mismatch never authorize transport. Never ok:true.
 * Provider contracts and T-CORE-02 remain HOLD.
 */

import type {
  Adapter01CommandContext,
  Adapter01Input,
  Adapter01Output,
} from '../contracts/src/adapters.ts';
import type { Problem, Result } from '../contracts/src/result.ts';
import { err, problem } from '../contracts/src/result.ts';

export async function checkAdapterEvidence(
  _ctx: Adapter01CommandContext,
  input: Adapter01Input,
): Promise<Result<Adapter01Output, Problem>> {
  if (input.providerAccountMismatch) {
    return err(
      problem(
        'unauthorized',
        403,
        false,
        'T-ADAPTER-01 supplied provider account mismatch blocks adapter evidence',
      ),
    );
  }
  if (input.providerEnvironmentMismatch) {
    return err(
      problem(
        'unauthorized',
        403,
        false,
        'T-ADAPTER-01 supplied provider environment mismatch blocks adapter evidence',
      ),
    );
  }
  if (input.signatureMissingOrInvalid) {
    return err(
      problem(
        'unauthorized',
        403,
        false,
        'T-ADAPTER-01 supplied missing or invalid signature blocks adapter evidence',
      ),
    );
  }
  if (input.evidenceReplayed) {
    return err(
      problem(
        'stale_or_conflicting_command',
        409,
        false,
        'T-ADAPTER-01 supplied replayed evidence blocks adapter evidence',
      ),
    );
  }
  if (input.evidencePayloadMismatch) {
    return err(
      problem(
        'stale_or_conflicting_command',
        409,
        false,
        'T-ADAPTER-01 supplied evidence payload mismatch blocks adapter evidence',
      ),
    );
  }
  return err(
    problem(
      'dependency_unavailable',
      503,
      true,
      'T-ADAPTER-01 checkAdapterEvidence cannot verify provider evidence or authorize transport: provider contracts and T-CORE-02 remain HOLD (fail closed)',
    ),
  );
}
