import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Instant, Plat06Input, Problem, Result, UUID, WorkerContext } from '@kita/contracts';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MODULE_TS = path.join(ROOT, 'packages', 'platform', 'observe-financial-health.ts');
const CONTRACTS_INDEX = path.join(ROOT, 'packages', 'contracts', 'src', 'index.ts');

type Fn = (ctx: WorkerContext, input: Plat06Input) => Promise<Result<Record<string, unknown>, Problem>>;

function linkWorkspaceSpecifiers(source: string, ownDir: string): string {
  return source
    .replace(/(['"])@kita\/contracts\1/g, `'${CONTRACTS_INDEX}'`)
    .replace(/(['"])(\.\.?\/[^'"]*\.ts)\1/g, (_m, q: string, rel: string) => `'${path.resolve(ownDir, rel)}'`);
}

async function loadRealModule(absPath: string): Promise<Record<string, unknown>> {
  const dir = path.dirname(absPath);
  linkWorkspaceSpecifiers(fs.readFileSync(absPath, 'utf8'), dir);
  return (await import(`${absPath}?plat06=1`)) as Record<string, unknown>;
}

function workerContext(sink?: { messages: string[]; fields: Record<string, unknown>[] }): WorkerContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    correlationId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' as UUID,
    startedAt: '2026-11-09T00:00:00.000Z' as Instant,
    trace: (message, fields) => {
      sink?.messages.push(message);
      sink?.fields.push({ ...(fields ?? {}) });
    },
    capability: async () => ({ ok: true as const, value: false }),
  };
}

function plat06Input(): Plat06Input {
  return {
    worker: {
      workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
      attemptGeneration: 1,
      correlationId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' as UUID,
    },
    windowStart: '2026-11-09T00:00:00.000Z',
    windowEnd: '2026-11-09T00:15:00.000Z',
    redactedTraceEventCount: 12,
  };
}

describe('TEST-PLAT-06 — observeFinancialHealth fails closed', () => {
  it('returns retryable 503 dependency_unavailable', async () => {
    const mod = await loadRealModule(MODULE_TS);
    const receipt = await (mod.observeFinancialHealth as Fn)(workerContext(), plat06Input());
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
    expect(receipt.error.retryable).toBe(true);
    expect(receipt.error.detail).toMatch(/T-CORE-02/);
  });

  it('does not import DB, HTTP, or journal surfaces', () => {
    const src = fs.readFileSync(MODULE_TS, 'utf8');
    const offenders = [
      /from\s+['"]pg['"]/,
      /createPool\s*\(/,
      /\.query\s*\(/,
      /\bINSERT\s+INTO\b/i,
      /process\.env/,
      /\bfetch\s*\(|axios/,
    ].filter((re) => re.test(src));
    expect(offenders.map(String)).toEqual([]);
    const specs = [...src.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]!);
    expect([...new Set(specs)].sort()).toEqual(['@kita/contracts']);
  });

  it('trace carries no PII-shaped fields or window payload counts as identity', async () => {
    const sink = { messages: [] as string[], fields: [] as Record<string, unknown>[] };
    const mod = await loadRealModule(MODULE_TS);
    await (mod.observeFinancialHealth as Fn)(workerContext(sink), plat06Input());
    const blob = JSON.stringify(sink);
    expect(blob).not.toMatch(/email|ssn|account_number|phone/i);
    expect(blob).not.toContain('redactedTraceEventCount');
  });

  it('exports a single refusal reason naming T-CORE-02', async () => {
    const mod = await loadRealModule(MODULE_TS);
    expect(String(mod.OBSERVE_FINANCIAL_HEALTH_UNAVAILABLE_DETAIL)).toMatch(/T-CORE-02/);
  });
});
