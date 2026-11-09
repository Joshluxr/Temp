import type { Instant } from '@kita/contracts';
import type { CapabilityScope, ClaimEvidence } from '../../packages/contracts/src/activation.ts';
import { describe, expect, it } from 'vitest';

import {
  ACTIVATION_SIGNATURES_NOT_ON_FILE,
  evaluateActivation,
} from '../../packages/domain/catalog/activation-policy.ts';

const now = '2026-11-09T22:00:00.000Z' as Instant;

const scope: CapabilityScope = {
  corridor: 'US_PH',
  product: 'remittance',
  environment: 'production',
  entityId: 'kita-us-entity',
};

function claim(depId: string, status: ClaimEvidence['status'], extra: Partial<ClaimEvidence> = {}): ClaimEvidence {
  return { depId, status, ...extra };
}

describe('TEST-DEPEND-01 — missing evidence never defaults to approval', () => {
  it('empty evidence is disabled', () => {
    const decision = evaluateActivation(scope, [], now);
    expect(decision.enabled).toBe(false);
    expect(decision.reasons.some((r) => /missing evidence/i.test(r))).toBe(true);
    expect(decision.reasons).toContain(ACTIVATION_SIGNATURES_NOT_ON_FILE);
  });

  it('missing claim is disabled', () => {
    const decision = evaluateActivation(scope, [claim('DEP-03', 'missing')], now);
    expect(decision.enabled).toBe(false);
    expect(decision.reasons.some((r) => /DEP-03: missing/.test(r))).toBe(true);
  });

  it('expired status is disabled', () => {
    const decision = evaluateActivation(scope, [claim('DEP-04', 'expired')], now);
    expect(decision.enabled).toBe(false);
    expect(decision.reasons.some((r) => /DEP-04: expired/.test(r))).toBe(true);
  });

  it('expiresAt in the past is disabled', () => {
    const decision = evaluateActivation(
      scope,
      [claim('DEP-05', 'present', { expiresAt: '2026-01-01T00:00:00.000Z' as Instant })],
      now,
    );
    expect(decision.enabled).toBe(false);
    expect(decision.reasons.some((r) => /DEP-05: expired/.test(r))).toBe(true);
  });

  it('rejected claim is disabled', () => {
    const decision = evaluateActivation(scope, [claim('DEP-09', 'rejected')], now);
    expect(decision.enabled).toBe(false);
    expect(decision.reasons.some((r) => /DEP-09: rejected/.test(r))).toBe(true);
  });

  it('wrong-entity claim is disabled', () => {
    const decision = evaluateActivation(
      scope,
      [claim('DEP-12', 'wrong_entity'), claim('DEP-14', 'present', { entityId: 'other-entity' })],
      now,
    );
    expect(decision.enabled).toBe(false);
    expect(decision.reasons.some((r) => /wrong-entity/.test(r))).toBe(true);
  });

  it('complete-looking present claims still disable US→PH (no fabricated approvals)', () => {
    const evidence: ClaimEvidence[] = ['DEP-00', 'DEP-03', 'DEP-04', 'DEP-05', 'DEP-09', 'DEP-12', 'DEP-14', 'DEP-15'].map(
      (depId) => claim(depId, 'present', { entityId: scope.entityId, expiresAt: '2027-01-01T00:00:00.000Z' as Instant }),
    );
    const decision = evaluateActivation(scope, evidence, now);
    expect(decision.enabled).toBe(false);
    expect(decision.reasons).toContain(ACTIVATION_SIGNATURES_NOT_ON_FILE);
  });
});
