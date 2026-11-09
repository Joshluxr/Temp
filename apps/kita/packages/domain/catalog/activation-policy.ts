/**
 * @kita/domain — activation-policy (T-DEPEND-01).
 *
 * Pure evaluateActivation. Never enabled. Missing evidence never defaults to
 * approval. Complete-looking packets still disable: live DEP-00–15 signatures
 * are not on file. No DB, money, or fabricated approvals.
 */

import type {
  ActivationDecision,
  CapabilityScope,
  ClaimEvidence,
} from '../../contracts/src/activation.ts';
import type { Instant } from '@kita/contracts';

export const ACTIVATION_SIGNATURES_NOT_ON_FILE =
  'T-DEPEND-01 live DEP-00–15 owner/counsel/Finance signatures are not on file; US→PH is not enabled';

function isExpired(claim: ClaimEvidence, now: Instant): boolean {
  if (claim.status === 'expired') return true;
  if (!claim.expiresAt) return false;
  return String(claim.expiresAt) <= String(now);
}

export function evaluateActivation(
  scope: CapabilityScope,
  evidence: readonly ClaimEvidence[],
  now: Instant,
): ActivationDecision {
  const reasons: string[] = [];

  if (evidence.length === 0) {
    reasons.push('missing evidence never defaults to approval');
  }

  for (const claim of evidence) {
    if (claim.status === 'missing') {
      reasons.push(`${claim.depId}: missing`);
    } else if (claim.status === 'rejected') {
      reasons.push(`${claim.depId}: rejected`);
    } else if (claim.status === 'wrong_entity' || (claim.entityId && claim.entityId !== scope.entityId)) {
      reasons.push(`${claim.depId}: wrong-entity`);
    } else if (isExpired(claim, now)) {
      reasons.push(`${claim.depId}: expired`);
    }
  }

  reasons.push(ACTIVATION_SIGNATURES_NOT_ON_FILE);

  return { enabled: false, reasons, evaluatedAt: now };
}
