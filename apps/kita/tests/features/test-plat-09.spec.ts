import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Instant, Plat09Input, Problem, Result, UUID, WorkerContext } from '@kita/contracts';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MODULE_TS = path.join(ROOT, 'packages', 'platform', 'apply-retention.ts');

type Fn = (ctx: WorkerContext, input: Plat09Input) => Promise<Result<Record<string, unknown>, Problem>>;

async function load(): Promise<Fn> {
  const mod = (await import(`${MODULE_TS}?plat09=1`)) as { applyRetention: Fn };
  return mod.applyRetention;
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

function body(legalHoldActive: boolean, requestKind: Plat09Input['requestKind'] = 'delete'): Plat09Input {
  return {
    worker: {
      workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
      attemptGeneration: 1,
      correlationId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' as UUID,
    },
    subjectId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' as UUID,
    legalHoldActive,
    requestKind,
  };
}

describe('TEST-PLAT-09 — applyRetention never deletes or exports', () => {
  it('legalHoldActive true => POLICY_UNAVAILABLE 409 non-retryable', async () => {
    const applyRetention = await load();
    const receipt = await applyRetention(workerContext(), body(true, 'delete'));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('POLICY_UNAVAILABLE');
    expect(receipt.error.status).toBe(409);
    expect(receipt.error.retryable).toBe(false);
  });

  it('legalHoldActive false => 503 dependency_unavailable (no deletion)', async () => {
    const applyRetention = await load();
    const receipt = await applyRetention(workerContext(), body(false, 'delete'));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
    expect(receipt.error.retryable).toBe(true);
  });

  it('export without hold still fails closed', async () => {
    const applyRetention = await load();
    const receipt = await applyRetention(workerContext(), body(false, 'export'));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
  });

  it('module has no DB, KMS, money or executeCommand surfaces', () => {
    const src = fs.readFileSync(MODULE_TS, 'utf8');
    const offenders = [
      /from\s+['"]pg['"]/,
      /createPool\s*\(/,
      /\bINSERT\s+INTO\b/i,
      /\bDELETE\s+FROM\b/i,
      /process\.env/,
      /\bfetch\s*\(|axios/,
      /from\s+['"][^'"]*executeCommand/,
    ].filter((re) => re.test(src));
    expect(offenders.map(String)).toEqual([]);
  });
});
