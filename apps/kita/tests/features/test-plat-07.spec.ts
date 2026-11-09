import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Instant, Plat07Input, Problem, Result, UUID, WorkerContext } from '@kita/contracts';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MODULE_TS = path.join(ROOT, 'packages', 'platform', 'validate-environment.ts');

type Fn = (ctx: WorkerContext, input: Plat07Input) => Promise<Result<Record<string, unknown>, Problem>>;

async function load(): Promise<Fn> {
  const mod = (await import(`${MODULE_TS}?plat07=1`)) as { validateEnvironment: Fn };
  return mod.validateEnvironment;
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

function input(
  claimedEnvironment: Plat07Input['claimedEnvironment'],
  flags: { sandbox?: boolean; fixture?: boolean; funds?: boolean },
): Plat07Input {
  return {
    worker: {
      workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
      attemptGeneration: 1,
      correlationId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' as UUID,
    },
    claimedEnvironment,
    sandboxCapabilityPresent: Boolean(flags.sandbox),
    fixtureAdapterPresent: Boolean(flags.fixture),
    addSandboxFundsPresent: Boolean(flags.funds),
  };
}

describe('TEST-PLAT-07 — production fails on sandbox/fixture/addSandboxFunds; never ok:true', () => {
  const contamination: Array<[string, Plat07Input]> = [
    ['sandbox capability', input('production', { sandbox: true })],
    ['fixture adapter', input('production', { fixture: true })],
    ['addSandboxFunds', input('production', { funds: true })],
    ['all three markers', input('production', { sandbox: true, fixture: true, funds: true })],
  ];

  for (const [name, body] of contamination) {
    it(`production + ${name} => CAPABILITY_UNAVAILABLE 409 non-retryable`, async () => {
      const validateEnvironment = await load();
      const receipt = await validateEnvironment(workerContext(), body);
      expect(receipt.ok).toBe(false);
      if (receipt.ok) return;
      expect(receipt.error.code).toBe('CAPABILITY_UNAVAILABLE');
      expect(receipt.error.status).toBe(409);
      expect(receipt.error.retryable).toBe(false);
    });
  }

  it('production with no contamination flags still 503 dependency_unavailable', async () => {
    const validateEnvironment = await load();
    const receipt = await validateEnvironment(workerContext(), input('production', {}));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
    expect(receipt.error.retryable).toBe(true);
  });

  const sandboxCases: Array<[string, Plat07Input]> = [
    ['clean sandbox', input('sandbox', {})],
    ['sandbox + capability', input('sandbox', { sandbox: true })],
    ['sandbox + fixture', input('sandbox', { fixture: true })],
    ['sandbox + addSandboxFunds', input('sandbox', { funds: true })],
  ];

  for (const [name, body] of sandboxCases) {
    it(`${name} => 503 dependency_unavailable (no fake isolation)`, async () => {
      const validateEnvironment = await load();
      const receipt = await validateEnvironment(workerContext(), body);
      expect(receipt.ok).toBe(false);
      if (receipt.ok) return;
      expect(receipt.error.code).toBe('dependency_unavailable');
      expect(receipt.error.status).toBe(503);
    });
  }

  it('module has no terraform, cloud, DB or journal side effects', () => {
    const src = fs.readFileSync(MODULE_TS, 'utf8');
    const offenders = [
      /from\s+['"]pg['"]/,
      /createPool\s*\(/,
      /\bINSERT\s+INTO\b/i,
      /process\.env/,
      /\bfetch\s*\(|axios/,
      /from\s+['"]@aws-sdk/,
    ].filter((re) => re.test(src));
    expect(offenders.map(String)).toEqual([]);
  });
});
