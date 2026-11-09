/**
 * @kita/contracts — T-DEPEND-01 activation evidence types.
 * Missing evidence never defaults to approval. This checker cannot enable.
 */

import type { Instant } from './context.ts';

export type ActivationClaimStatus = 'missing' | 'expired' | 'rejected' | 'wrong_entity' | 'present';

export interface CapabilityScope {
  readonly corridor: string;
  readonly product: string;
  readonly environment: 'sandbox' | 'production';
  readonly entityId: string;
}

export interface ClaimEvidence {
  readonly depId: string;
  readonly status: ActivationClaimStatus;
  readonly expiresAt?: Instant;
  readonly entityId?: string;
}

export interface ActivationDecision {
  readonly enabled: false;
  readonly reasons: readonly string[];
  readonly evaluatedAt: Instant;
}

export type ActivationResult = ActivationDecision;
