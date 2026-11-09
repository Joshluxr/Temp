/**
 * @kita/providers — evidence (T-ADAPTER-01).
 *
 * verifyWebhook: unsigned or missing signature is never Verified.
 * No HTTP, no persistence, no money.
 */

import type { WebhookVerification } from './ports.ts';

function headerGet(headers: Headers | Record<string, string>, name: string): string | null {
  if (typeof (headers as Headers).get === 'function') {
    return (headers as Headers).get(name);
  }
  const rec = headers as Record<string, string>;
  return rec[name] ?? rec[name.toLowerCase()] ?? null;
}

export function verifyWebhook(raw: Uint8Array, headers: Headers | Record<string, string>): WebhookVerification {
  const signature = headerGet(headers, 'x-signature') ?? headerGet(headers, 'X-Signature');
  if (!signature || signature.length === 0 || raw.length === 0) {
    return { kind: 'Quarantined', reason: 'signature' };
  }
  // Live signature verification is not implemented; never treat as Verified.
  return { kind: 'Quarantined', reason: 'signature' };
}
