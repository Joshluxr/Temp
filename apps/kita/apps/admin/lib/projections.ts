import { randomUUID } from 'node:crypto';
import {
  ADMIN_AUDIENCE,
  type AuditEventList,
  type AuditEventView,
  type CaseList,
  type CaseView,
  type ListQuery,
  type TransferList,
  type TransferView,
} from './contracts.ts';
import { mutationCalls, normalizeListQuery, recordUpstream } from './api-client.ts';

export const CAPABILITY_UNAVAILABLE = 'CAPABILITY_UNAVAILABLE';

/**
 * Local read projections only. Production data arrives from the frozen GET
 * operations (listAdminTransfers / getAdminTransfer / listAdminCases /
 * listAuditEvents) over the admin BFF; nothing in this module writes, and no
 * fixture can move money because there is no reducer or posting path here.
 */

const now = new Date('2026-11-09T12:00:00Z').toISOString();

const TRANSFERS: readonly TransferView[] = [
  {
    id: '40000000-0000-4000-8000-000000000001',
    reference: 'KTA-2026-000741',
    version: '8',
    customerStatus: 'processing',
    fundingState: 'captured',
    payoutState: 'pending',
    complianceState: 'cleared',
    refundState: 'none',
    disputeState: 'none',
    fxState: 'settled',
    reconciliationState: 'pending',
    acceptedAt: now,
    allowedActions: [
      { action: 'status_inquiry', allowed: true },
      { action: 'complete', allowed: false, reasonCode: CAPABILITY_UNAVAILABLE },
      { action: 'mark_paid_out', allowed: false, reasonCode: CAPABILITY_UNAVAILABLE },
    ],
  },
  {
    id: '40000000-0000-4000-8000-000000000002',
    reference: 'KTA-2026-000742',
    version: '3',
    customerStatus: 'under_review',
    fundingState: 'authorized',
    payoutState: 'not_started',
    complianceState: 'review',
    refundState: 'none',
    disputeState: 'none',
    fxState: 'accepted',
    reconciliationState: 'pending',
    acceptedAt: now,
    allowedActions: [{ action: 'evidence.request', allowed: true }],
  },
];

const CASES: readonly CaseView[] = [
  {
    id: 'a1000000-0000-4000-8000-000000000001',
    version: '2',
    kind: 'kyc',
    state: 'investigating',
    receivedAt: now,
    dueAt: new Date('2026-11-12T12:00:00Z').toISOString(),
    publicSummary: 'Identity evidence pending document authenticity review.',
    requiredActions: ['assign analyst', 'record screening outcome'],
  },
  {
    id: 'a1000000-0000-4000-8000-000000000002',
    version: '1',
    kind: 'aml',
    state: 'open',
    receivedAt: now,
    dueAt: new Date('2026-11-10T12:00:00Z').toISOString(),
    publicSummary: 'Velocity monitoring hit; case contents restricted to assigned analyst.',
    requiredActions: ['MLRO triage'],
  },
];

const AUDIT_EVENTS: readonly AuditEventView[] = [
  {
    id: 'b2000000-0000-4000-8000-000000000001',
    actorRef: 'person-ops-0001',
    action: 'queue.read',
    targetRef: 'transfer:40000000-0000-4000-8000-000000000001',
    recordedAt: now,
    payloadHash: 'a'.repeat(64),
    eventHash: 'b'.repeat(64),
  },
  {
    id: 'b2000000-0000-4000-8000-000000000002',
    actorRef: 'person-adm-0001',
    action: 'audit.read',
    targetRef: 'audit_events',
    recordedAt: now,
    payloadHash: 'c'.repeat(64),
    eventHash: 'd'.repeat(64),
  },
];

function page<T>(items: readonly T[], query: ListQuery): { items: readonly T[]; asOf: string; nextCursor?: string } {
  const limit = Math.min(Math.max(Math.floor(query.limit ?? 25), 1), 100);
  const sliced = items.slice(0, limit);
  return { items: sliced, asOf: now, ...(sliced.length < items.length ? { nextCursor: `offset:${sliced.length}` } : {}) };
}

export function projectTransfers(query: ListQuery): TransferList {
  recordUpstream({ method: 'GET', path: '/admin/v1/transfers', query: normalizeListQuery(query) });
  const filtered = query.status === undefined ? TRANSFERS : TRANSFERS.filter((t) => t.customerStatus === query.status);
  return page(filtered, query);
}

export function projectTransfer(id: string): TransferView | undefined {
  recordUpstream({ method: 'GET', path: `/admin/v1/transfers/${encodeURIComponent(id)}` });
  return TRANSFERS.find((t) => t.id === id);
}

export function projectCases(query: ListQuery): CaseList {
  recordUpstream({ method: 'GET', path: '/admin/v1/cases', query: normalizeListQuery(query) });
  const filtered = query.status === undefined ? CASES : CASES.filter((c) => c.state === query.status);
  return page(filtered, query);
}

export function projectCase(id: string): CaseView | undefined {
  recordUpstream({ method: 'GET', path: `/admin/v1/cases/${encodeURIComponent(id)}` });
  return CASES.find((c) => c.id === id);
}

export function projectAuditEvents(query: ListQuery): AuditEventList {
  recordUpstream({ method: 'GET', path: '/admin/v1/audit-events', query: normalizeListQuery(query) });
  return page(AUDIT_EVENTS, query);
}

/**
 * no-op: outcome manufacturing (admin complete/fail/mark_paid_out,
 * addSandboxFunds, simulatePartnerCompletion) is prohibited by ADR-12 and
 * docs/kita-plan/08-admin-rbac.md §2. Kept as an exported symbol so the build
 * baseline scan has something to assert is inert.
 */
export async function disabledOutcomeMutation(..._args: readonly unknown[]): Promise<never> {
  throw new Error(`${CAPABILITY_UNAVAILABLE}: admin outcome mutations are not implemented by design`);
}

export const ADMIN_PROJECTION_AUDIENCE = ADMIN_AUDIENCE;

export function assertNoMutationSince(mark: number): void {
  const mutations = mutationCalls().length;
  if (mutations > 0) {
    throw new Error(`READ_ONLY_VIOLATION: ${mutations} non-GET upstream calls recorded since projection start`);
  }
  void mark;
}

export function projectionId(): string {
  return randomUUID();
}
