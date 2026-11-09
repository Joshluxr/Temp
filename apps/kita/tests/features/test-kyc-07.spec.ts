import type { Instant, UUID, WorkerContext } from '@kita/contracts';
import type { Kyc07Input } from '../../packages/contracts/src/compliance.ts';
import { describe, expect, it } from 'vitest';

import { recordFiling } from '../../packages/domain/compliance/record-filing.ts';

const SECRET_BODY = 'SAR-NARRATIVE-MUST-NOT-LEAK';
const SECRET_RATIONALE = 'CONFIDENTIAL-RATIONALE-MUST-NOT-LEAK';

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

function body(actorRole: Kyc07Input['actorRole']): Kyc07Input {
  return {
    worker: {
      workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
      attemptGeneration: 1,
      correlationId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' as UUID,
    },
    caseId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' as UUID,
    actorRole,
    filingBody: SECRET_BODY,
    confidentialRationale: SECRET_RATIONALE,
  };
}

describe('TEST-KYC-07 — support cannot read AML filing or confidential rationale', () => {
  it('support => unauthorized 403 without filing text', async () => {
    const sink = { messages: [] as string[], fields: [] as Record<string, unknown>[] };
    const receipt = await recordFiling(workerContext(sink), body('support'));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('unauthorized');
    expect(receipt.error.status).toBe(403);
    expect(receipt.error.retryable).toBe(false);
    const blob = JSON.stringify({ receipt, sink });
    expect(blob).not.toContain(SECRET_BODY);
    expect(blob).not.toContain(SECRET_RATIONALE);
  });

  it('compliance => 503 without filing contents', async () => {
    const sink = { messages: [] as string[], fields: [] as Record<string, unknown>[] };
    const receipt = await recordFiling(workerContext(sink), body('compliance'));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
    const blob = JSON.stringify({ receipt, sink });
    expect(blob).not.toContain(SECRET_BODY);
    expect(blob).not.toContain(SECRET_RATIONALE);
  });
});
