import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Instant, Plat10EvidenceManifest, Plat10Input, Problem, Result, UUID, WorkerContext } from '@kita/contracts';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MODULE_TS = path.join(ROOT, 'packages', 'platform', 'evaluate-release-gates.ts');

type Fn = (ctx: WorkerContext, input: Plat10Input) => Promise<Result<Record<string, unknown>, Problem>>;

async function load(): Promise<Fn> {
  const mod = (await import(`${MODULE_TS}?plat10=1`)) as { evaluateReleaseGates: Fn };
  return mod.evaluateReleaseGates;
}

function workerContext(): WorkerContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    correlationId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' as UUID,
    startedAt: '2026-11-09T00:00:00.000Z' as Instant,
    trace: () => undefined,
    capability: async () => ({ ok: true as const, value: false }),
  };
}

function present(): Plat10EvidenceManifest {
  return { security: 'present', load: 'present', accessibility: 'present', financial: 'present' };
}

function body(evidence: Plat10EvidenceManifest): Plat10Input {
  return {
    worker: {
      workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
      attemptGeneration: 1,
      correlationId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' as UUID,
    },
    artifactDigest: 'e'.repeat(64),
    evidence,
  };
}

describe('TEST-PLAT-10 — evaluateReleaseGates never attests launch safety', () => {
  const missingAxes = ['security', 'load', 'accessibility', 'financial'] as const;

  for (const axis of missingAxes) {
    it(`missing ${axis} evidence => invalid_request 400`, async () => {
      const evaluateReleaseGates = await load();
      const evidence = { ...present(), [axis]: 'missing' } as Plat10EvidenceManifest;
      const receipt = await evaluateReleaseGates(workerContext(), body(evidence));
      expect(receipt.ok).toBe(false);
      if (receipt.ok) return;
      expect(receipt.error.code).toBe('invalid_request');
      expect(receipt.error.status).toBe(400);
      expect(receipt.error.retryable).toBe(false);
    });
  }

  for (const axis of missingAxes) {
    it(`failing ${axis} evidence => SECURITY_FAILURE 409`, async () => {
      const evaluateReleaseGates = await load();
      const evidence = { ...present(), [axis]: 'failing' } as Plat10EvidenceManifest;
      const receipt = await evaluateReleaseGates(workerContext(), body(evidence));
      expect(receipt.ok).toBe(false);
      if (receipt.ok) return;
      expect(receipt.error.code).toBe('SECURITY_FAILURE');
      expect(receipt.error.status).toBe(409);
      expect(receipt.error.retryable).toBe(false);
    });
  }

  it('all-present evidence still 503 dependency_unavailable (DEP-15 not live)', async () => {
    const evaluateReleaseGates = await load();
    const receipt = await evaluateReleaseGates(workerContext(), body(present()));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
    expect(receipt.error.retryable).toBe(true);
    expect(receipt.error.detail).toMatch(/DEP-15/);
  });

  it('module has no DB, money or live-gate runner imports', () => {
    const src = fs.readFileSync(MODULE_TS, 'utf8');
    const offenders = [
      /from\s+['"]pg['"]/,
      /createPool\s*\(/,
      /\bINSERT\s+INTO\b/i,
      /process\.env/,
      /\bfetch\s*\(|axios/,
    ].filter((re) => re.test(src));
    expect(offenders.map(String)).toEqual([]);
  });
});
