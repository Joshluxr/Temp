import type { UUID } from '@kita/contracts';
import type { Adm01CommandContext, Adm09Input } from '../../packages/contracts/src/admin.ts';
import { describe, expect, it } from 'vitest';

import { revealPii } from '../../packages/domain/admin/reveal-pii.ts';

const SECRET = 'SSN-000-00-0000';

function ctx(sink?: { blob: string[] }): Adm01CommandContext {
  return {
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
    trace: (message, fields) => {
      sink?.blob.push(JSON.stringify({ message, fields }));
    },
  };
}

function body(flags: Pick<Adm09Input, 'missingStepUp' | 'missingReason' | 'expired'>): Adm09Input {
  return { ...flags, piiSample: SECRET };
}

describe('TEST-ADM-09 — PII reveal step-up/reason/expiry enforced', () => {
  it('missingStepUp => unauthorized 403 without PII leak', async () => {
    const sink = { blob: [] as string[] };
    const receipt = await revealPii(ctx(sink), body({ missingStepUp: true, missingReason: false, expired: false }));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('unauthorized');
    expect(receipt.error.status).toBe(403);
    expect(JSON.stringify({ receipt, sink })).not.toContain(SECRET);
  });

  it('missingReason => unauthorized 403', async () => {
    const receipt = await revealPii(ctx(), body({ missingStepUp: false, missingReason: true, expired: false }));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('unauthorized');
  });

  it('expired => unauthorized 403', async () => {
    const receipt = await revealPii(ctx(), body({ missingStepUp: false, missingReason: false, expired: true }));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('unauthorized');
  });

  it('complete flags still 503 with no export URL or PII', async () => {
    const sink = { blob: [] as string[] };
    const receipt = await revealPii(ctx(sink), body({ missingStepUp: false, missingReason: false, expired: false }));
    expect(receipt.ok).toBe(false);
    if (receipt.ok) return;
    expect(receipt.error.code).toBe('dependency_unavailable');
    expect(receipt.error.status).toBe(503);
    expect(JSON.stringify({ receipt, sink })).not.toContain(SECRET);
    expect(JSON.stringify(receipt)).not.toMatch(/https?:\/\//);
  });
});
