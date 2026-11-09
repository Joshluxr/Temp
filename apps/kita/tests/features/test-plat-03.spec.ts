import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Instant, Plat03Input, Problem, Result, UUID, WorkerContext } from '@kita/contracts';
import { describe, expect, it } from 'vitest';

/**
 * TEST-PLAT-03 (static evidence spec — NO live database, queue or worker runtime).
 * Acceptance intent per docs/kita-plan/13-backlog.md T-PLAT-03: "Crash at every
 * commit/send/ack boundary preserves one economic effect".
 *
 * Scope honesty (this batch implements ONLY the unavailable half):
 *  - T-CORE-02 is NOT in scope and NOT implemented, so applyEvent must be a pure
 *    503 `dependency_unavailable` refusal with zero side effects. The tests below
 *    prove exactly that, by executing the REAL module off disk.
 *  - The durable outbox/inbox/consumer_inbox machinery itself cannot be proven
 *    until T-CORE-02 lands; those assertions are stated as contracts on the
 *    frozen DDL + backlog text, marked "pending T-CORE-02" in their titles. They
 *    do not fabricate a pass.
 *  - No money paths, no journal writes, no sandbox funding anywhere in this suite.
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const APPLY_EVENT_TS = path.join(ROOT, 'packages', 'platform', 'apply-event.ts');
const CONTRACTS_PLATFORM_TS = path.join(ROOT, 'packages', 'contracts', 'src', 'platform.ts');
const CORE_SQL = path.join(ROOT, 'sql', '001_core.sql');
const BACKLOG_MD = path.join(ROOT, '..', '..', 'docs', 'kita-plan', '13-backlog.md');

/* ------------------------------------------------------------------ *
 * Load the REAL module (same technique as test-plat-01.spec.ts: the slice
 * install cannot resolve `@kita/contracts`, so we rewrite workspace
 * specifiers to real on-disk paths and import the actual bytes. Nothing is
 * stubbed or substituted.)
 * ------------------------------------------------------------------ */

const CONTRACTS_INDEX = path.join(ROOT, 'packages', 'contracts', 'src', 'index.ts');

type ApplyEventFn = (ctx: WorkerContext, input: Plat03Input) => Promise<Result<Plat03OutputLike, Problem>>;
type Plat03OutputLike = Record<string, unknown>;

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
    return (await import(`${absPath}?plat03=${seen.size}`)) as Record<string, unknown>;
  } catch (cause) {
    throw new Error(`cannot load real module ${absPath}: ${String(cause)}`, { cause });
  }
}

async function loadApplyEvent(): Promise<{ applyEvent: ApplyEventFn; APPLY_EVENT_UNAVAILABLE_DETAIL: string }> {
  const mod = await loadRealModule(APPLY_EVENT_TS, new Set());
  return mod as unknown as { applyEvent: ApplyEventFn; APPLY_EVENT_UNAVAILABLE_DETAIL: string };
}

/* ------------------------------------------------------------------ *
 * Fixtures — shaped like Plat03Input but built from plain literals, so this
 * suite exercises applyEvent without importing the contract types twice.
 * ------------------------------------------------------------------ */

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
    // Fail-closed capability probe: the durable substrate is declared absent.
    capability: async () => ({ ok: true as const, value: false }),
  };
}

function plat03InboxOnly(): Plat03Input {
  return {
    worker: {
      workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
      attemptGeneration: 1,
      correlationId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' as UUID,
    },
    inbox: {
      providerAccountId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' as UUID,
      deliveryId: 'dlv_01HTESTDELIVERYID',
      payloadHash: 'e'.repeat(64),
      rawObjectRef: 'object:kita-ingress/2026/11/09/dlv-01.enc',
      receivedAt: '2026-11-09T00:00:00.000Z',
      state: 'received',
    },
    consumer: { consumer: 'transfer-reducer', eventId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' as UUID },
  } as Plat03Input;
}

function plat03OutboxOnly(): Plat03Input {
  return {
    worker: {
      workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
      attemptGeneration: 2,
      correlationId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' as UUID,
    },
    outbox: {
      eventId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' as UUID,
      aggregateId: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee' as UUID,
      aggregateVersion: '8',
      eventType: 'quote.accepted',
      schemaVersion: 1,
      payloadDigest: 'f'.repeat(64),
      createdAt: '2026-11-09T00:00:00.000Z',
      availableAt: '2026-11-09T00:00:00.000Z',
      attempts: 0,
    },
    consumer: { consumer: 'notification-dispatcher', eventId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' as UUID },
  } as Plat03Input;
}

function plat03BothHalves(): Plat03Input {
  const inbox = plat03InboxOnly();
  const outbox = plat03OutboxOnly();
  return { ...inbox, outbox: outbox.outbox } as Plat03Input;
}

/* ------------------------------------------------------------------ *
 * (a) applyEvent always answers 503 dependency_unavailable
 * ------------------------------------------------------------------ */

describe('TEST-PLAT-03(a) — applyEvent fails closed while T-CORE-02 is absent', () => {
  const cases: readonly (readonly [string, () => Plat03Input])[] = [
    ['inbox-only (consume request)', plat03InboxOnly],
    ['outbox-only (publication request)', plat03OutboxOnly],
    ['both halves (full commit/ack cycle)', plat03BothHalves],
  ];

  for (const [name, build] of cases) {
    it(`${name} => retryable 503 dependency_unavailable`, async () => {
      const { applyEvent } = await loadApplyEvent();
      const receipt = await applyEvent(workerContext(), build());
      expect(receipt.ok, `applyEvent must refuse: ${name}`).toBe(false);
      if (receipt.ok) return;
      expect(receipt.error.code).toBe('dependency_unavailable');
      expect(receipt.error.status).toBe(503);
      expect(receipt.error.retryable).toBe(true);
      // Detail names the missing dependency; it never echoes envelope content.
      expect(receipt.error.detail).toMatch(/T-CORE-02/);
      expect(receipt.error.detail.length).toBeLessThanOrEqual(500);
    });
  }

  it('an empty envelope input still refuses rather than reporting an applied no-op', async () => {
    const { applyEvent } = await loadApplyEvent();
    const bare = { ...plat03InboxOnly(), inbox: undefined, outbox: undefined } as Plat03Input;
    const receipt = await applyEvent(workerContext(), bare);
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
  });

  it('the refusal is stable across repeated calls and attempt generations (no flaky success)', async () => {
    const { applyEvent } = await loadApplyEvent();
    const ctx = workerContext();
    const first = await applyEvent(ctx, plat03BothHalves());
    const second = await applyEvent(ctx, plat03BothHalves());
    expect(first.ok).toBe(false);
    expect(second.ok).toBe(false);
    if (first.ok || second.ok) return;
    expect(second.error).toEqual(first.error);
    const bumped = await applyEvent({ ...ctx, attemptGeneration: 9 }, plat03BothHalves());
    expect(bumped.ok).toBe(false);
  });

  it('exports the single refusal reason used by runbooks and CI greps', async () => {
    const { APPLY_EVENT_UNAVAILABLE_DETAIL } = await loadApplyEvent();
    expect(APPLY_EVENT_UNAVAILABLE_DETAIL).toMatch(/not implemented/i);
    expect(APPLY_EVENT_UNAVAILABLE_DETAIL).toMatch(/T-CORE-02/);
  });
});

/* ------------------------------------------------------------------ *
 * (b) zero side effects — nothing is written, published, acked or posted
 * ------------------------------------------------------------------ */

describe('TEST-PLAT-03(b) — explicit no-op assertions (no DB, no queue, no journals)', () => {
  /** Everything applyEvent could touch outside its own return value. */
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

  it('executing applyEvent changes no file in the slice tree', async () => {
    const { applyEvent } = await loadApplyEvent();
    const before = snapshotTree();
    await applyEvent(workerContext(), plat03BothHalves());
    await applyEvent(workerContext(), plat03InboxOnly());
    await applyEvent(workerContext(), plat03OutboxOnly());
    expect(snapshotTree()).toBe(before);
  });

  it('the module imports no database driver, queue client, HTTP client or journal surface', async () => {
    const src = fs.readFileSync(APPLY_EVENT_TS, 'utf8');
    const offenders: string[] = [];
    for (const re of [
      /from\s+['"]pg['"]/,
      /from\s+['"]mysql2/,
      /new\s+Pool\s*\(/,
      /createPool\s*\(/,
      /\.query\s*\(/,
      /\bINSERT\s+INTO\b/i,
      /\bUPDATE\s+\w+\s+SET\b/i,
      /\bDELETE\s+FROM\b/i,
      /\bBEGIN\s+(TRANSACTION|WORK)\b/i,
      /aws-sdk|@aws-sdk|sqs|sns|kafka|rabbit|amqp|nats|redis|ioredis|bullmq|kafkajs|mjackson/i,
      /\bfetch\s*\(|axios|got\(|http\.request|https\.request/,
      /journal|ledger|balance|debit|credit|postJournal/i,
      /process\.env/,
    ]) {
      if (re.test(src)) offenders.push(String(re));
    }
    expect(offenders, `apply-event.ts reaches a forbidden surface via ${offenders.join(', ')}`).toEqual([]);
  });

  it('its only dependencies are the contracts type surface and the problem constructors', () => {
    const src = fs.readFileSync(APPLY_EVENT_TS, 'utf8');
    const specs = [...src.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]!);
    expect([...new Set(specs)].sort()).toEqual(['@kita/contracts']);
  });

  it('trace output is bounded and carries no envelope payload, hash or raw reference', async () => {
    const { applyEvent } = await loadApplyEvent();
    const sink = { messages: [] as string[], fields: [] as Record<string, unknown>[] };
    const input = plat03BothHalves();
    const receipt = await applyEvent(workerContext(sink), input);
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(sink.messages).toContain('apply_event_dependency_unavailable');
    const serialized = JSON.stringify(sink.fields) + receipt.error.detail;
    expect(serialized).not.toContain(input.inbox!.payloadHash);
    expect(serialized).not.toContain(input.inbox!.rawObjectRef);
    expect(serialized).not.toContain(input.inbox!.deliveryId);
    expect(serialized).not.toMatch(/sk_live|BEGIN.*PRIVATE KEY|password/i);
  });

  it('the failure Problem has no operationId/fieldErrors invented for work that never ran', async () => {
    const { applyEvent } = await loadApplyEvent();
    const receipt = await applyEvent(workerContext(), plat03InboxOnly());
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.operationId).toBeUndefined();
    expect(receipt.error.fieldErrors).toBeUndefined();
  });

  it('no success-shaped Plat03Output can be produced by this module today', () => {
    const src = fs.readFileSync(APPLY_EVENT_TS, 'utf8');
    expect(src).not.toMatch(/\bok\s*\(/); // imports err/problem only — never the success constructor
    expect(src).not.toMatch(/appliedTransactionallyBeforeAck|republishedStableId/);
  });
});

/* ------------------------------------------------------------------ *
 * (c) contracts describe the durable boundary without implementing it
 * ------------------------------------------------------------------ */

describe('TEST-PLAT-03(c) — Plat03 contract surface', () => {
  const src = fs.readFileSync(CONTRACTS_PLATFORM_TS, 'utf8');

  it('declares Plat03Input/Output plus the three durable identities named by the backlog', () => {
    for (const symbol of [
      'Plat03Input',
      'Plat03Output',
      'InboxEnvelopeRaw',
      'OutboxEventEnvelope',
      'ConsumerInboxIdentity',
      'ConsumeApplyProof',
      'RecoverablePublicationProof',
    ]) {
      expect(src, `missing contract ${symbol}`).toMatch(new RegExp(`export (interface|type) ${symbol}\\b`));
    }
  });

  it('inbox states match the core DDL CHECK constraint', () => {
    expect(src).toMatch(/InboxDeliveryState = 'received' \| 'processing' \| 'applied' \| 'quarantined'/);
    const sql = fs.readFileSync(CORE_SQL, 'utf8');
    for (const s of ['received', 'processing', 'applied', 'quarantined']) {
      expect(sql, `DDL inbox.state lacks '${s}'`).toContain(`'${s}'`);
    }
  });

  it('money effects are structurally unrepresentable on the input', () => {
    expect(src).toMatch(/readonly journalPosting\?: never;/);
    expect(src).not.toMatch(/addSandboxFunds|simulatePartnerCompletion|adminComplete|markPaidOut|setBalance/);
  });

  it('IDEMPOTENCY_MISMATCH detail exists and reuses the shared M2 code, not a private one', () => {
    expect(src).toMatch(/Plat03IdempotencyMismatchDetail/);
    expect(src).toMatch(/code: 'IDEMPOTENCY_MISMATCH'/);
    const resultSrc = fs.readFileSync(path.join(ROOT, 'packages', 'contracts', 'src', 'result.ts'), 'utf8');
    expect(resultSrc).toMatch(/'IDEMPOTENCY_MISMATCH'/);
    expect(resultSrc).toMatch(/'dependency_unavailable'/);
  });

  it('contract file stays types-only (no publisher, reducer or SQL executed here)', () => {
    expect(src).not.toMatch(/\b(?:async )?function\b|=>\s*\{[\s\S]*\breturn\b/);
    expect(src).not.toMatch(/INSERT INTO|CREATE TABLE|\.query\(/);
  });
});

/* ------------------------------------------------------------------ *
 * (d) pending T-CORE-02 — the crash-boundary matrix asserted as documents
 * ------------------------------------------------------------------ */

describe('TEST-PLAT-03(d) — crash-at-commit/send/ack boundary (pending T-CORE-02)', () => {
  const sql = fs.readFileSync(CORE_SQL, 'utf8');

  it('core DDL provides the three tables the boundary proof requires', () => {
    expect(sql).toMatch(/CREATE TABLE outbox\(/);
    expect(sql).toMatch(/CREATE TABLE inbox\(/);
    expect(sql).toMatch(/CREATE TABLE consumer_inbox\(/);
  });

  it('dedup keys exist on BOTH business identity and delivery identity', () => {
    expect(sql).toMatch(/consumer_inbox\(consumer text NOT NULL, event_id uuid NOT NULL,[\s\S]*?PRIMARY KEY\(consumer,event_id\)\)/);
    expect(sql).toMatch(/UNIQUE\(provider_account_id,delivery_id\)/);
    expect(sql).toMatch(/UNIQUE\(aggregate_id,aggregate_version,event_type\)/);
  });

  it('outbox columns support lease, retry and stable-ID republish (§G7)', () => {
    for (const col of ['available_at', 'published_at', 'lease_until', 'attempts']) {
      expect(sql, `outbox lacks ${col}`).toContain(col);
    }
    expect(sql).toMatch(/CREATE INDEX outbox_pending ON outbox\(available_at\) WHERE published_at IS NULL/);
  });

  it('backlog fixes the boundary semantics the eventual implementation must satisfy', () => {
    const backlog = fs.readFileSync(BACKLOG_MD, 'utf8');
    const entry = backlog.slice(backlog.indexOf('### T-PLAT-03'));
    expect(entry.slice(0, 4000)).toMatch(/transactionally apply before ack/);
    expect(entry.slice(0, 4000)).toMatch(/stable IDs survive DLQ\/restart/i);
    expect(entry.slice(0, 4000)).toMatch(/IDEMPOTENCY_MISMATCH/);
    expect(entry.slice(0, 4000)).toMatch(/T-CORE-02/);
  });

  it('apply-event.ts records the same boundary obligations instead of silently dropping them', () => {
    const src = fs.readFileSync(APPLY_EVENT_TS, 'utf8');
    for (const phrase of ['FOR UPDATE SKIP LOCKED', 'send acknowledgment', 'SAME stable eventId', 'ONE transaction BEFORE', 'DLQ replay']) {
      expect(src, `implementation note missing: ${phrase}`).toContain(phrase);
    }
  });

  it('no other production-reachable module claims to have implemented the durable worker already', () => {
    const hits: string[] = [];
    const SKIP = new Set(['node_modules', '.git', '.next', '.expo', 'dist', 'build', 'out']);
    const walk = (dir: string): void => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (SKIP.has(e.name)) continue;
        const full = path.join(dir, e.name);
        if (e.isDirectory()) walk(full);
        else if (/\.(?:ts|tsx|mjs)$/.test(e.name) && !full.includes('__tests__') && !full.startsWith(path.join(ROOT, 'tests'))) {
          const text = fs.readFileSync(full, 'utf8');
          if (/applyEvent\s*\(/.test(text) && !full.endsWith('apply-event.ts')) hits.push(path.relative(ROOT, full));
        }
      }
    };
    walk(ROOT);
    expect(hits, 'applyEvent may only be defined/called by its own inert module until T-CORE-02').toEqual([]);
  });
});
