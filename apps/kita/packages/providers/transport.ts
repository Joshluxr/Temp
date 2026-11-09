/**
 * @kita/providers — transport (T-ADAPTER-01).
 *
 * Pure fail-closed submit/inquire. Transport is unimplemented: always Unknown.
 * Never Confirmed, never guessed Rejected, no HTTP, no persistence, no money.
 */

import type { ImmutableProviderRequest, ProviderOutcome, ProviderReference } from './ports.ts';

export const TRANSPORT_UNIMPLEMENTED_REFERENCE = 'T-ADAPTER-01-transport-unimplemented';

export async function submit(_request: ImmutableProviderRequest): Promise<ProviderOutcome> {
  return { kind: 'Unknown', reference: TRANSPORT_UNIMPLEMENTED_REFERENCE };
}

export async function inquire(_reference: ProviderReference): Promise<ProviderOutcome> {
  return { kind: 'Unknown', reference: TRANSPORT_UNIMPLEMENTED_REFERENCE };
}
