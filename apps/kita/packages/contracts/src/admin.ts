/**
 * @kita/contracts — T-ADM-01 staff authorization types.
 * Additive only. Default-deny. No owner auto-admin.
 */

import type { UUID, WorkerContext } from './context.ts';

export type Adm01Audience = 'customer' | 'staff';

export interface Adm01Input {
  readonly audience: Adm01Audience;
  readonly unrelatedEntity: boolean;
  readonly personId?: UUID;
  readonly journalPosting?: never;
  readonly moneyMutation?: never;
}

export interface Adm01Output {
  readonly staffSessionIssued: true;
  readonly canMutateMoney: true;
  readonly traceEvents: readonly string[];
}

export type Adm01CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration' | 'trace'>;

/**
 * Ops queue (T-ADM-02). Projections never confer mutation rights.
 */
export interface Adm02Input {
  readonly staffAuthorized: boolean;
  readonly cursor?: string;
  readonly journalPosting?: never;
  readonly mutationRights?: never;
}

export interface Adm02Output {
  readonly items: readonly unknown[];
  readonly mutationRights: true;
  readonly traceEvents: readonly string[];
}
