/**
 * Identity (KYC/IDV) provider gate — Persona candidate (§H1 IDV row).
 *
 * DISABLED no-op adapter: throws ProviderDisabledError on every method. This
 * is a GATE, not a mock — it must never return Confirmed/Pending for a real
 * subject, because "KYC default is literally 'Sandbox eKYC' in current code —
 * no production IDV exists yet" and DEP-05 sign-off is outstanding. Fake KYC
 * approvals are forbidden; approval manufacturing via any admin/simulate path
 * is banned here and everywhere.
 */

import { ProviderDisabledError } from './disabled.ts';

const PROVIDER = 'persona-idv';

function blocked(operation: string): never {
  // DISABLED: outcome manufacturing forbidden — external dependency (DEP-05) not approved.
  throw new ProviderDisabledError(PROVIDER, 'identity', operation);
}

export const personaIdentityAdapter = {
  createSession: (): never => blocked('createSession'),
  getDecision: (): never => blocked('getDecision'),
  getEvidence: (): never => blocked('getEvidence'),
  requestAdditionalEvidence: (): never => blocked('requestAdditionalEvidence'),
  deleteEligibleData: (): never => blocked('deleteEligibleData'),
  verifyWebhook: (): never => blocked('verifyWebhook'),
} as const;

export type PersonaIdentityAdapter = typeof personaIdentityAdapter;
