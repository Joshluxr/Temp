import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Instant, Plat04Input, Problem, Result, UUID, WorkerContext } from '@kita/contracts';
import { describe, expect, it } from 'vitest';

/**
 * TEST-PLAT-04 (static evidence spec — NO live inbox, signature crypto, or DB).
 * Limited batch: receiveWebhook always 503 dependency_unavailable; no inbox
 * writes; no journals. Full same-ID quarantine + invalid-signature refuse
 * remain pending T-CORE-02.
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const RECEIVE_WEBHOOK_TS = path.join(ROOT, 'packages', 'platform', 'receive-webhook.ts');
const CONTRACTS_INDEX = path.join(ROOT, 'packages', 'contracts', 'src', 'index.ts');

type ReceiveWebhookFn = (ctx: WorkerContext, input: Plat04Input) => Promise<Result<Record<string, unknown>, Problem>>;

function linkWorkspaceSpecifiers(source: string, ownDir: string): string {
  return source
    .replace(/(['"])@kita\/contracts\1/g, `'${CONTRACTS_INDEX}'`)
    .replace(/(['"])@kita\/contracts\/(generated|platform)\1/g, `'${path.join(ROOT, 'packages', 'contracts', 'src', '$2.ts')}'`)
    .replace(/(['"])(\.\.?\/[^'"]*\.ts)\1/g, (_m, q: string, rel: string) => `'${path.resolve(ownDir, rel)}'`);
}

async function loadRealModule(absPath: string, seen: Set<string>): Promise<Record<string, unknown>> {
  if (seen.has(absPath)) return {};
  seen.add(absPath);
  const dir = path.dirname(absPath);
  const linked = linkWorkspaceSpecifiers(fs.readFileSync(absPath, 'utf8'), dir);
  for (const spec of [...linked.matchAll(/from\s+['"](\/[^'"]+)['"]/g)].map((m) => m[1]!)) {
    if (spec.endsWith('.ts') && fs.existsSync(spec)) await loadRealModule(spec, seen);
  }
  try {
    return (await import(`${absPath}?plat04=${seen.size}`)) as Record<string, unknown>;
  } catch (cause) {
    throw new Error(`cannot load real module ${absPath}: ${String(cause)}`, { cause });
  }
}

async function loadReceiveWebhook(): Promise<{
  receiveWebhook: ReceiveWebhookFn;
  RECEIVE_WEBHOOK_UNAVAILABLE_DETAIL: string;
}> {
  const mod = await loadRealModule(RECEIVE_WEBHOOK_TS, new Set());
  return mod as unknown as {
    receiveWebhook: ReceiveWebhookFn;
    RECEIVE_WEBHOOK_UNAVAILABLE_DETAIL: string;
  };
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

function plat04Input(overrides: Partial<Plat04Input> = {}): Plat04Input {
  return {
    worker: {
      workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
      attemptGeneration: 1,
      correlationId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' as UUID,
    },
    provider: 'wise',
    accountId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' as UUID,
    deliveryId: 'dlv_01HTESTWEBHOOK',
    payloadDigest: 'a'.repeat(64),
    signatureLocator: 'kms:sig/locator-not-a-secret',
    receivedAt: '2026-11-09T00:00:00.000Z',
    ...overrides,
  } as Plat04Input;
}

describe('TEST-PLAT-04(a) — receiveWebhook fails closed while T-CORE-02 is absent', () => {
  it('returns retryable 503 dependency_unavailable', async () => {
    const { receiveWebhook } = await loadReceiveWebhook();
    const receipt = await receiveWebhook(workerContext(), plat04Input());
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
    expect(receipt.error.retryable).toBe(true);
    expect(receipt.error.detail).toMatch(/T-CORE-02/);
    expect(receipt.error.detail.length).toBeLessThanOrEqual(500);
  });

  it('refuses a same deliveryId with a different payload digest (no inbox write)', async () => {
    const { receiveWebhook } = await loadReceiveWebhook();
    const first = await receiveWebhook(workerContext(), plat04Input({ payloadDigest: 'b'.repeat(64) }));
    const second = await receiveWebhook(workerContext(), plat04Input({ payloadDigest: 'c'.repeat(64) }));
    expect(first.ok).toBe(false);
    expect(second.ok).toBe(false);
  });

  it('refuses a call that would represent an invalid signature (never posts)', async () => {
    const { receiveWebhook } = await loadReceiveWebhook();
    const receipt = await receiveWebhook(
      workerContext(),
      plat04Input({ signatureLocator: 'invalid:unsigned' }),
    );
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
  });

  it('exports the single refusal reason', async () => {
    const { RECEIVE_WEBHOOK_UNAVAILABLE_DETAIL } = await loadReceiveWebhook();
    expect(RECEIVE_WEBHOOK_UNAVAILABLE_DETAIL).toMatch(/not implemented/i);
    expect(RECEIVE_WEBHOOK_UNAVAILABLE_DETAIL).toMatch(/T-CORE-02/);
  });
});

describe('TEST-PLAT-04(b) — no inbox writes, no journals', () => {
  function snapshotTree(): string {
    const crypto = require('node:crypto') as typeof import('node:crypto');
    const digest = crypto.createHash('sha256');
    const SKIP = new Set(['node_modules', '.git', '.next', '.expo', 'dist', 'build', 'out']);
    const walk = (dir: string): void => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
        if (SKIP.has(entry.name)) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else {
          const st = fs.statSync(full);
          digest.update(`${path.relative(ROOT, full)}|${st.size}|${st.mtimeMs.toFixed(3)}\n`);
        }
      }
    };
    walk(ROOT);
    return digest.digest('hex');
  }

  it('executing receiveWebhook changes no file in the slice tree', async () => {
    const { receiveWebhook } = await loadReceiveWebhook();
    const before = snapshotTree();
    await receiveWebhook(workerContext(), plat04Input());
    expect(snapshotTree()).toBe(before);
  });

  it('the module imports no database, inbox writer, HTTP client or journal surface', () => {
    const src = fs.readFileSync(RECEIVE_WEBHOOK_TS, 'utf8');
    const offenders: string[] = [];
    for (const re of [
      /from\s+['"]pg['"]/,
      /new\s+Pool\s*\(/,
      /createPool\s*\(/,
      /\.query\s*\(/,
      /\bINSERT\s+INTO\b/i,
      /\bUPDATE\s+\w+\s+SET\b/i,
      /process\.env/,
      /\bfetch\s*\(|axios/,
    ]) {
      if (re.test(src)) offenders.push(String(re));
    }
    expect(offenders, `receive-webhook.ts reaches a forbidden surface via ${offenders.join(', ')}`).toEqual([]);
  });

  it('its only dependency is @kita/contracts', () => {
    const src = fs.readFileSync(RECEIVE_WEBHOOK_TS, 'utf8');
    const specs = [...src.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]!);
    expect([...new Set(specs)].sort()).toEqual(['@kita/contracts']);
  });

  it('trace carries no payload digest or signature material', async () => {
    const { receiveWebhook } = await loadReceiveWebhook();
    const sink = { messages: [] as string[], fields: [] as Record<string, unknown>[] };
    const input = plat04Input();
    await receiveWebhook(workerContext(sink), input);
    const blob = JSON.stringify(sink);
    expect(blob).not.toContain(input.payloadDigest);
    expect(blob).not.toContain(input.signatureLocator);
    expect(blob).not.toContain(input.deliveryId);
  });
});
