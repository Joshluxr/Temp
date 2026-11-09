import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Instant, Plat05Input, Problem, Result, UUID, WorkerContext } from '@kita/contracts';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SCHEDULE_TIMER_TS = path.join(ROOT, 'packages', 'platform', 'schedule-timer.ts');
const REPLAY_DLQ_TS = path.join(ROOT, 'packages', 'platform', 'replay-dlq.ts');
const CONTRACTS_INDEX = path.join(ROOT, 'packages', 'contracts', 'src', 'index.ts');

type Fn = (ctx: WorkerContext, input: Plat05Input) => Promise<Result<Record<string, unknown>, Problem>>;

function linkWorkspaceSpecifiers(source: string, ownDir: string): string {
  return source
    .replace(/(['"])@kita\/contracts\1/g, `'${CONTRACTS_INDEX}'`)
    .replace(/(['"])(\.\.?\/[^'"]*\.ts)\1/g, (_m, q: string, rel: string) => `'${path.resolve(ownDir, rel)}'`);
}

async function loadRealModule(absPath: string, seen: Set<string>): Promise<Record<string, unknown>> {
  if (seen.has(absPath)) return {};
  seen.add(absPath);
  const dir = path.dirname(absPath);
  linkWorkspaceSpecifiers(fs.readFileSync(absPath, 'utf8'), dir);
  try {
    return (await import(`${absPath}?plat05=${seen.size}`)) as Record<string, unknown>;
  } catch (cause) {
    throw new Error(`cannot load real module ${absPath}: ${String(cause)}`, { cause });
  }
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

function plat05Timer(): Plat05Input {
  return {
    worker: {
      workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
      attemptGeneration: 1,
      correlationId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' as UUID,
    },
    timer: {
      timerId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' as UUID,
      generation: 1,
      dueAt: '2026-11-09T01:00:00.000Z',
      workKey: 'quote.expiry:eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    },
  };
}

function plat05Dlq(): Plat05Input {
  return {
    worker: {
      workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
      attemptGeneration: 1,
      correlationId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' as UUID,
    },
    dlq: {
      deadLetterId: 'ffffffff-ffff-4fff-8fff-ffffffffffff' as UUID,
      originalWorkId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
      originalPayloadDigest: 'd'.repeat(64),
    },
  };
}

const FORBIDDEN = [
  /from\s+['"]pg['"]/,
  /new\s+Pool\s*\(/,
  /createPool\s*\(/,
  /\.query\s*\(/,
  /\bINSERT\s+INTO\b/i,
  /\bUPDATE\s+\w+\s+SET\b/i,
  /process\.env/,
  /\bfetch\s*\(|axios/,
];

describe('TEST-PLAT-05 — scheduleTimer and replayDlq fail closed', () => {
  it('scheduleTimer returns retryable 503 dependency_unavailable', async () => {
    const mod = await loadRealModule(SCHEDULE_TIMER_TS, new Set());
    const receipt = await (mod.scheduleTimer as Fn)(workerContext(), plat05Timer());
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
    expect(receipt.error.retryable).toBe(true);
    expect(receipt.error.detail).toMatch(/T-CORE-02/);
  });

  it('replayDlq returns retryable 503 dependency_unavailable', async () => {
    const mod = await loadRealModule(REPLAY_DLQ_TS, new Set());
    const receipt = await (mod.replayDlq as Fn)(workerContext(), plat05Dlq());
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
    expect(receipt.error.detail).toMatch(/T-CORE-02/);
  });

  it('neither module reaches DB, queue or journal surfaces', () => {
    for (const file of [SCHEDULE_TIMER_TS, REPLAY_DLQ_TS]) {
      const src = fs.readFileSync(file, 'utf8');
      const offenders = FORBIDDEN.filter((re) => re.test(src)).map(String);
      expect(offenders, `${path.basename(file)} forbidden surfaces`).toEqual([]);
      const specs = [...src.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]!);
      expect([...new Set(specs)].sort()).toEqual(['@kita/contracts']);
    }
  });

  it('trace does not echo timer workKey or DLQ payload digest', async () => {
    const sink = { messages: [] as string[], fields: [] as Record<string, unknown>[] };
    const timerMod = await loadRealModule(SCHEDULE_TIMER_TS, new Set());
    await (timerMod.scheduleTimer as Fn)(workerContext(sink), plat05Timer());
    const dlqMod = await loadRealModule(REPLAY_DLQ_TS, new Set());
    await (dlqMod.replayDlq as Fn)(workerContext(sink), plat05Dlq());
    const blob = JSON.stringify(sink);
    expect(blob).not.toContain(plat05Timer().timer!.workKey);
    expect(blob).not.toContain(plat05Dlq().dlq!.originalPayloadDigest);
  });
});
