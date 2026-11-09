/**
 * @kita/domain/compliance — document/evidence access-grant GATE (T-IDENTITY-01
 * schema/types lane; docs/kita-plan/13-backlog.md line 105 "evidence-access
 * support records").
 *
 * Sol CONDITIONAL-PASS rule honored: SCHEMA/TYPES ONLY. Fabricating a success
 * is forbidden — `grantDocumentAccess` returns exactly one reachable outcome,
 * the stable F2 problem value `err(unavailable('grantDocumentAccess'))`
 * ('capability_unavailable', HTTP 503) so callers map 503 without catching.
 * This is NOT the providers/ DISABLED-gate idiom (those throw
 * ProviderDisabledError at external-dependency boundaries); here the failure
 * is an in-repo missing-capability denial carried as a Result error arm
 * (async function returning Result, never throws).
 *
 * BAN LIST (must never appear in this file or any successor pre-T-CORE-02):
 * - no `executeCommand` invocation or command-authority wiring;
 * - no `addSandboxFunds` / `simulatePartnerCompletion` identifiers (banned
 *   outright, see apps/kita/docs/FORBIDDEN.md and providers/disabled.ts);
 * - no KYC-pass literals and no scan verdicts ('clean'/'approved') asserted
 *   from code — evidence_access_scans.outcome stays 'pending' until a real
 *   scanner reports, per migration 004 CHECKs;
 * - no signed-link generation (no URL minting, no HMAC/signing logic);
 * - no DocumentAccessGrant construction — the ok-arm is unconstructible here.
 *
 * SECURITY RULES THIS GATE UPHOLDS (docs/kita-plan/09-admin-security.md):
 * - I2: `documents.read` and `access.grant` are SEPARATE permissions; a grant
 *   requires the latter plus assignment/purpose, active employment, session
 *   assurance, and no related-customer conflict. Default deny.
 * - I6: privileged reveal links are short-lived signed URLs capped at 60s —
 *   enforced in DDL by document_access_grants' CHECK on
 *   link_expires_at-created_at (packages/database/migrations/
 *   004_identity_access.sql), not by app logic.
 * - Every privileged read/reveal is audited via audit_events; this table is
 *   the grant side of that pairing, never a substitute for it.
 */

import { err, unavailable, type Problem, type Result } from '@kita/contracts';
import type { DocumentAccessGrant } from '@kita/contracts/auth';
import type { UUID } from '@kita/contracts/context';

/**
 * Input for the future grantDocumentAccess command (backlog T-IDENTITY-01
 * DB row: "extend device/identity-session binding and scan/access records
 * where absent"). The frozen signature will take a CommandContext once
 * T-CORE-02 lands; like the identity/funding stubs, this input deliberately
 * carries NO client-selectable role, book, or permission fields — actor,
 * purpose approval state, and step-up validation come from the server-side
 * context, never from the caller.
 */
export interface GrantDocumentAccessInput {
  /** documents.id being revealed to an authorized staff actor. */
  readonly documentId: UUID;
  /** Opaque staff subject (staff_identities.subject); never display names or credentials. */
  readonly actorRef: string;
  /** Mandatory business purpose; empty/generic purposes are rejected by the command layer. */
  readonly purpose: string;
  /** Opaque reference to the assurance event satisfying the access.grant permission (I1 step-up). */
  readonly stepUpRef: string;
}

/**
 * Issue a short-lived privileged document-access grant over migration 004's
 * document_access_grants. Fail-closed gate: the ONLY reachable result is the
 * 503 capability_unavailable Problem. No link URL, expiry, or audit pairing
 * may be synthesized in this lane — minting arrives with T-CORE-02 command
 * authority and the Security review pack (REQ-SC-15 IDOR coverage).
 */
export function grantDocumentAccess(
  _input: GrantDocumentAccessInput,
): Promise<Result<DocumentAccessGrant, Problem>> {
  // Fixed-shape, PII-free refusal — never an ok grant, never a throw.
  return Promise.resolve(err(unavailable('grantDocumentAccess')));
}
