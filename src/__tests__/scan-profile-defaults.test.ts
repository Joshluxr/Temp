/**
 * Regression: ScanProfile target arrays are optional in the JSON Schema, but
 * every consumer (route scope builder, lane utils) spreads them. A schema-valid
 * profile with only `urls` (or only `hosts`) used to crash POST /api/scans with
 * "Spread syntax requires ...iterable not be null or undefined".
 *
 * Fix: AJV useDefaults stamps missing arrays with [] at the validation boundary,
 * and spread sites are individually null-guarded for direct callers.
 */

import { describe, expect, it } from 'vitest';
import { validateScanProfile } from '../scan/profile.js';
import { targetHosts, targetUrls } from '../scan/lanes/util.js';
import type { LaneContext } from '../scan/types.js';
import type { Arsenal } from '../arsenal/index.js';

function ctxWith(profile: Record<string, unknown>): LaneContext {
  const validation = validateScanProfile(profile);
  if (!validation.ok || !validation.profile) throw new Error(`invalid profile: ${validation.errors.join(', ')}`);
  return {
    jobId: 'test-job',
    profile: validation.profile,
    arsenal: {} as Arsenal,
    vault: {} as LaneContext['vault'],
    abort: {} as LaneContext['abort'],
    deliverablesDir: '/tmp',
    findings: [],
    emit: () => {},
  };
}

describe('scan profile target-array defaults', () => {
  it('accepts a profile with urls only and stamps hosts with []', () => {
    const result = validateScanProfile({
      target: { urls: ['http://127.0.0.1:9911'] },
      lanes: { recon: { enabled: true } },
    });
    expect(result.ok).toBe(true);
    expect(result.profile?.target.urls).toEqual(['http://127.0.0.1:9911']);
    expect(result.profile?.target.hosts).toEqual([]);
  });

  it('accepts a profile with hosts only and stamps urls with []', () => {
    const result = validateScanProfile({
      target: { hosts: ['127.0.0.1'] },
      lanes: { recon: { enabled: true } },
    });
    expect(result.ok).toBe(true);
    expect(result.profile?.target.urls).toEqual([]);
    expect(result.profile?.target.hosts).toEqual(['127.0.0.1']);
  });

  it('accepts a profile with an empty target object', () => {
    const result = validateScanProfile({ target: {}, lanes: {} });
    expect(result.ok).toBe(true);
    expect(result.profile?.target.urls).toEqual([]);
    expect(result.profile?.target.hosts).toEqual([]);
  });

  it('lane target helpers do not throw on urls-only profiles', () => {
    const ctx = ctxWith({
      target: { urls: ['http://127.0.0.1:9911'] },
      lanes: { recon: { enabled: true } },
    });
    expect(() => targetUrls(ctx)).not.toThrow();
    expect(() => targetHosts(ctx)).not.toThrow();
    expect(targetUrls(ctx).length).toBeGreaterThan(0);
  });

  it('lane target helpers do not throw on hosts-only profiles', () => {
    const ctx = ctxWith({
      target: { hosts: ['127.0.0.1'] },
      lanes: { protocol_tests: { enabled: true } },
    });
    expect(() => targetUrls(ctx)).not.toThrow();
    expect(() => targetHosts(ctx)).not.toThrow();
  });
});
