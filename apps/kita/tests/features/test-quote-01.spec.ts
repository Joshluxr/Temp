import type { UUID } from '../../packages/contracts/src/context.ts';
import type { Quote01CommandContext, Quote01Input } from '../../packages/contracts/src/quotes.ts';
import { describe, expect, it } from 'vitest';

import { buildQuote } from '../../packages/domain/quotes/build-quote.ts';

function ctx(): Quote01CommandContext {
  return Object.freeze({
    workId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
    attemptGeneration: 1,
  });
}

function body(
  unauthorizedQuoteCreation: boolean,
  limitExceeded: boolean,
  pricingPolicyUnavailable: boolean,
): Quote01Input {
  return Object.freeze({ unauthorizedQuoteCreation, limitExceeded, pricingPolicyUnavailable });
}

const expectedTable: ReadonlyArray<{
  readonly flags: readonly [boolean, boolean, boolean];
  readonly code: string;
  readonly status: number;
  readonly retryable: boolean;
  readonly detail: string;
}> = [
  {
    flags: [true, false, false],
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-QUOTE-01 quote creation is not authorized',
  },
  {
    flags: [true, false, true],
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-QUOTE-01 quote creation is not authorized',
  },
  {
    flags: [true, true, false],
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-QUOTE-01 quote creation is not authorized',
  },
  {
    flags: [true, true, true],
    code: 'unauthorized',
    status: 403,
    retryable: false,
    detail: 'T-QUOTE-01 quote creation is not authorized',
  },
  {
    flags: [false, true, false],
    code: 'LIMIT_EXCEEDED',
    status: 409,
    retryable: false,
    detail: 'T-QUOTE-01 supplied corridor, customer or rail limit breach blocks quote creation',
  },
  {
    flags: [false, true, true],
    code: 'LIMIT_EXCEEDED',
    status: 409,
    retryable: false,
    detail: 'T-QUOTE-01 supplied corridor, customer or rail limit breach blocks quote creation',
  },
  {
    flags: [false, false, true],
    code: 'POLICY_UNAVAILABLE',
    status: 409,
    retryable: false,
    detail: 'T-QUOTE-01 required pricing policy is unavailable; no fee or tax fallback is authorized',
  },
  {
    flags: [false, false, false],
    code: 'dependency_unavailable',
    status: 503,
    retryable: true,
    detail:
      'T-QUOTE-01 buildQuote cannot price or persist a quote or grant financial authority: quote/policy stores, T-CORE-02 and T-LEDGER-02 remain HOLD (fail closed)',
  },
];

describe('TEST-QUOTE-01 — buildQuote never prices or persists a quote', () => {
  it.each(expectedTable)(
    'unauthorized=%s limit=%s policyUnavailable=%s => $code $status',
    async ({ flags, code, status, retryable, detail }) => {
      const [unauthorizedQuoteCreation, limitExceeded, pricingPolicyUnavailable] = flags;
      const input = body(unauthorizedQuoteCreation, limitExceeded, pricingPolicyUnavailable);
      const context = ctx();
      const first = await buildQuote(context, input);
      const second = await buildQuote(context, input);
      expect(input).toEqual(body(unauthorizedQuoteCreation, limitExceeded, pricingPolicyUnavailable));
      expect(context).toEqual(ctx());
      expect(first).toEqual({
        ok: false,
        error: { code, status, retryable, detail },
      });
      expect(second).toEqual(first);
      expect('value' in first).toBe(false);
    },
  );
});
