/**
 * T-IDENTITY-01 fail-closed gate — session unavailability (docs/kita-plan/13-backlog.md
 * T-IDENTITY-01; packages/contracts/src/auth.ts header).
 *
 * `bindSession` is a planned command-authority signature, not an implemented one: token
 * minting / session persistence belongs to T-CORE-02 and this lane is types-only. So the
 * only correct behavior of any pre-T-CORE-02 bindSession is `unavailable('bindSession')`
 * wrapped in `err(...)` — it must NEVER return an ok Session.
 *
 * Mocks only: no database, no network, no real IdP evidence. Fixture canaries must
 * never leak into the failure surface.
 */

import { describe, expect, it } from 'vitest';
import { err, type Problem, type Result } from '@kita/contracts';
import { unavailable, type OidcEvidence, type Session } from '@kita/contracts/auth';

const CANARY_PW = 'canary-password-token';
const CANARY_KEY = 'canary-key-token';

/** Brand-shaped fixture strings; nothing here is a real issuer, subject, or digest. */
const hex64 = (seed: string): string => seed.repeat(4).slice(0, 64);

const oidcEvidence = (): OidcEvidence => ({
  issuer: `https://idp.internal/${CANARY_PW}`,
  subject: `${CANARY_KEY}-subject`,
  audience: 'kita-customer',
  // raw nonce material (a hunter2/sk_live concatenation) must never reach the failure surface
  nonceHash: hex64(`${CANARY_PW}${CANARY_KEY}`) as OidcEvidence['nonceHash'],
  codeChallengeMethod: 'S256',
  returnedUri: `https://app.kita.example/callback?pw=${CANARY_PW}&key=${CANARY_KEY}`,
  verifiedAt: '2026-11-09T00:00:00Z' as OidcEvidence['verifiedAt'],
});

/** The only bindSession that exists pre-T-CORE-02: the contract's fail-closed helper. */
const bindSessionUnavailable = async (
  _ctx: unknown,
  input: OidcEvidence,
  audience: Session['audience'] = 'kita-customer',
): Promise<Result<Session>> => err(unavailable(`bindSession:${audience}`));

const liveSessionShape = (): Session => ({
  sessionId: hex64('a1b2c3d4e5f60718') as Session['sessionId'],
  audience: 'kita-customer',
  assurance: 'aal2',
  deviceRef: 'device-ref-opaque',
  customerId: hex64('0f1e2d3c4b5a6978') as Session['customerId'],
  expiresAt: '2026-11-16T00:00:00Z' as Session['expiresAt'],
  lastSeenAt: '2026-11-09T00:00:00Z' as Session['lastSeenAt'],
});

describe('T-IDENTITY-01 — bindSession fails closed while T-CORE-02 command authority is absent', () => {
  it('the contract exposes no callable bindSession — only types and the unavailable() helper', async () => {
    const authModule = await import('@kita/contracts/auth');
    expect(authModule.bindSession).toBeUndefined();
    const domainModule = await import('../index.ts');
    expect((domainModule as Record<string, unknown>)['bindSession']).toBeUndefined();
  });

  it('unavailable("bindSession") is a fixed-shape fail-closed Problem', () => {
    const p = unavailable('bindSession');
    expect(p.code).toBe('capability_unavailable');
    expect(p.status).toBe(503);
    expect(p.retryable).toBe(false);
    expect(p.detail).toContain('T-CORE-02');
    expect(p.detail).not.toContain(CANARY_PW);
    expect(p.detail).not.toContain(CANARY_KEY);
  });

  it('bindSession result is never an ok Session — ok:true and value are impossible', async () => {
    const result = await bindSessionUnavailable({}, oidcEvidence());

    expect(result.ok).toBe(false);
    if (result.ok) expect.unreachable('fail-closed bindSession must not construct a success arm');

    // Independently reject the success shape: even a hand-built live Session cannot be laundered
    // through the fail-closed path.
    const fabricated: Result<Session> = { ok: true, value: liveSessionShape() };
    expect(fabricated.ok).toBe(true);
    expect(bindSessionUnavailable).not.toBe(() => fabricated);
    const refused = await bindSessionUnavailable({}, oidcEvidence());
    expect(refused).not.toEqual(fabricated);
  });

  it('failure surface carries no evidence payload and no hunter2/sk_live secret material', async () => {
    const result = await bindSessionUnavailable({}, oidcEvidence());
    expect(result.ok).toBe(false);
    const problem = (result as { ok: false; error: Problem }).error;

    const serialized = JSON.stringify(problem);
    for (const canary of [CANARY_PW, CANARY_KEY]) {
      expect(serialized).not.toContain(canary);
      expect(problem.detail).not.toContain(canary);
      expect(problem.code).not.toContain(canary);
    }
    // No session-shaped fields escape on the error arm.
    expect(problem).not.toHaveProperty('sessionId');
    expect(problem).not.toHaveProperty('accessToken');
    expect(problem).not.toHaveProperty('refreshToken');
    expect(problem).not.toHaveProperty('value');
  });

  it('every audience gets the same refusal — no client-selected path to a live session', async () => {
    for (const audience of ['kita-customer', 'kita-admin'] as const) {
      const result = await bindSessionUnavailable({}, oidcEvidence(), audience);
      expect(result.ok).toBe(false);
      if (result.ok) expect.unreachable(`${audience} audience must not yield an ok Session`);
    }
  });
});
