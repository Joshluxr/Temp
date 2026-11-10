/**
 * @kita/contracts — T-ADAPTER-01 supplied-blocker types.
 * Additive only. No transport, evidence verification, or financial command.
 */

import type { WorkerContext } from './context.ts';

/**
 * Adapter evidence (T-ADAPTER-01). Account/environment mismatch, invalid
 * signature, replay, and payload mismatch never authorize transport.
 * T-CORE-02 remains HOLD.
 */
export interface Adapter01Input {
  readonly providerAccountMismatch: boolean;
  readonly providerEnvironmentMismatch: boolean;
  readonly signatureMissingOrInvalid: boolean;
  readonly evidenceReplayed: boolean;
  readonly evidencePayloadMismatch: boolean;
}

export type Adapter01Output = never;

export type Adapter01CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration'>;
