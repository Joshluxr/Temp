/**
 * @kita/contracts — T-EXT-01 market permission types.
 * Additive only. Live corridor activation is T-DEPEND-01, not this checker.
 */

import type { UUID } from './context.ts';
import type { WorkerIdentity } from './platform.ts';

export type Ext01IsoCountry = string;
export type Ext01Product = 'remittance' | string;

export interface Ext01Input {
  readonly worker: WorkerIdentity;
  readonly originCountry: Ext01IsoCountry;
  readonly destinationCountry: Ext01IsoCountry;
  readonly originSubdivision?: string;
  readonly product: Ext01Product;
  readonly method?: string;
  readonly sourceCurrency?: string;
  readonly destCurrency?: string;
  readonly journalPosting?: never;
  readonly legalEvidenceLocator?: string;
}

export interface Ext01Output {
  readonly allowed: true;
  readonly corridor: 'US_PH';
  readonly policyVersion: string;
  readonly traceEvents: readonly string[];
}

export interface Ext01CapabilityUnavailableDetail {
  readonly code: 'CAPABILITY_UNAVAILABLE';
  readonly originCountry: Ext01IsoCountry;
  readonly destinationCountry: Ext01IsoCountry;
  readonly reason: string;
}

export type Ext01FailureDetail = Ext01CapabilityUnavailableDetail;
