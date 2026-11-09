import {
  ADMIN_AUDIENCE,
  CASE_STATES,
  COMPLIANCE_STATES,
  CURRENCY_RE,
  DISPUTE_STATES,
  FX_STATES,
  LEG_STATES,
  MAJOR_RE,
  MINOR_RE,
  RECONCILIATION_STATES,
  REFUND_STATES,
  TRANSFER_CUSTOMER_STATES,
  type AuditEventList,
  type AuditEventView,
  type CaseList,
  type CaseState,
  type CaseView,
  type ComplianceState,
  type DisputeState,
  type FxState,
  type LegState,
  type Money,
  type Problem,
  type RefundState,
  type TransferCustomerStatus,
  type TransferList,
  type TransferView,
} from './contracts.ts';

type Json = Record<string, unknown>;

function asObject(value: unknown): Json | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined;
  return value as Json;
}

function str(obj: Json, key: string): string | undefined {
  const v = obj[key];
  return typeof v === 'string' ? v : undefined;
}

function oneOf<T extends string>(value: string | undefined, allowed: readonly T[]): value is T {
  return value !== undefined && (allowed as readonly string[]).includes(value);
}

export function parseMoney(value: unknown): Money | undefined {
  const obj = asObject(value);
  if (!obj) return undefined;
  const currency = str(obj, 'currency');
  const minor = str(obj, 'minor');
  if (currency === undefined || minor === undefined) return undefined;
  if (!CURRENCY_RE.test(currency)) return undefined;
  if (!MINOR_RE.test(minor)) return undefined;
  return { currency, minor };
}

export function parseProblem(value: unknown): Problem | undefined {
  const obj = asObject(value);
  if (!obj) return undefined;
  const type = str(obj, 'type');
  const title = str(obj, 'title');
  const code = str(obj, 'code');
  const requestId = str(obj, 'requestId');
  const status = obj['status'];
  const retryable = obj['retryable'];
  if (type === undefined || title === undefined || code === undefined || requestId === undefined) return undefined;
  if (typeof status !== 'number' || typeof retryable !== 'boolean') return undefined;
  const detail = str(obj, 'detail');
  const operationId = str(obj, 'operationId');
  const rawFieldErrors = obj['fieldErrors'];
  const fieldErrors = Array.isArray(rawFieldErrors)
    ? rawFieldErrors.flatMap((entry) => {
        const e = asObject(entry);
        if (!e) return [];
        const field = str(e, 'field');
        const errCode = str(e, 'code');
        if (field === undefined || errCode === undefined) return [];
        return [{ field, code: errCode }];
      })
    : undefined;
  return {
    type,
    title,
    status,
    code,
    requestId,
    retryable,
    ...(detail === undefined ? {} : { detail }),
    ...(operationId === undefined ? {} : { operationId }),
    ...(fieldErrors === undefined ? {} : { fieldErrors }),
  };
}

function parseTransfer(value: unknown): TransferView | undefined {
  const obj = asObject(value);
  if (!obj) return undefined;
  const id = str(obj, 'id');
  const reference = str(obj, 'reference');
  const version = str(obj, 'version');
  if (id === undefined || reference === undefined || version === undefined) return undefined;
  if (!MAJOR_RE.test(version)) return undefined;
  const customerStatus = str(obj, 'customerStatus');
  const fundingState = str(obj, 'fundingState');
  const payoutState = str(obj, 'payoutState');
  const complianceState = str(obj, 'complianceState');
  const refundState = str(obj, 'refundState');
  const disputeState = str(obj, 'disputeState');
  const fxState = str(obj, 'fxState');
  const reconciliationState = str(obj, 'reconciliationState');
  if (!oneOf(customerStatus, TRANSFER_CUSTOMER_STATES)) return undefined;
  if (!oneOf(fundingState, LEG_STATES)) return undefined;
  if (!oneOf(payoutState, LEG_STATES)) return undefined;
  if (!oneOf(complianceState, COMPLIANCE_STATES)) return undefined;
  if (!oneOf(refundState, REFUND_STATES)) return undefined;
  if (!oneOf(disputeState, DISPUTE_STATES)) return undefined;
  if (!oneOf(fxState, FX_STATES)) return undefined;
  if (!oneOf(reconciliationState, RECONCILIATION_STATES)) return undefined;
  const rawActions = obj['allowedActions'];
  const allowedActions = Array.isArray(rawActions)
    ? rawActions.flatMap((entry) => {
        const a = asObject(entry);
        if (!a) return [];
        const action = str(a, 'action');
        const allowed = a['allowed'];
        if (action === undefined || typeof allowed !== 'boolean') return [];
        const reasonCode = str(a, 'reasonCode');
        return [{ action, allowed, ...(reasonCode === undefined ? {} : { reasonCode }) }];
      })
    : [];
  const acceptedAt = str(obj, 'acceptedAt');
  const deliveredAt = str(obj, 'deliveredAt');
  return {
    id,
    reference,
    version,
    customerStatus: customerStatus as TransferCustomerStatus,
    fundingState: fundingState as LegState,
    payoutState: payoutState as LegState,
    complianceState: complianceState as ComplianceState,
    refundState: refundState as RefundState,
    disputeState: disputeState as DisputeState,
    fxState: fxState as FxState,
    reconciliationState: reconciliationState as ReconciliationState,
    ...(acceptedAt === undefined ? {} : { acceptedAt }),
    ...(deliveredAt === undefined ? {} : { deliveredAt }),
    allowedActions,
  };
}

function parseCase(value: unknown): CaseView | undefined {
  const obj = asObject(value);
  if (!obj) return undefined;
  const id = str(obj, 'id');
  const version = str(obj, 'version');
  const kind = str(obj, 'kind');
  const state = str(obj, 'state');
  const receivedAt = str(obj, 'receivedAt');
  const dueAt = str(obj, 'dueAt');
  const publicSummary = str(obj, 'publicSummary');
  if (
    id === undefined ||
    version === undefined ||
    kind === undefined ||
    receivedAt === undefined ||
    dueAt === undefined ||
    publicSummary === undefined
  ) {
    return undefined;
  }
  if (!MAJOR_RE.test(version) || !oneOf(state, CASE_STATES)) return undefined;
  const requiredActions = Array.isArray(obj['requiredActions'])
    ? (obj['requiredActions'] as unknown[]).filter((v): v is string => typeof v === 'string')
    : [];
  return {
    id,
    version,
    kind,
    state: state as CaseState,
    receivedAt,
    dueAt,
    publicSummary,
    requiredActions,
  };
}

function parseAuditEvent(value: unknown): AuditEventView | undefined {
  const obj = asObject(value);
  if (!obj) return undefined;
  const id = str(obj, 'id');
  const actorRef = str(obj, 'actorRef');
  const action = str(obj, 'action');
  const targetRef = str(obj, 'targetRef');
  const recordedAt = str(obj, 'recordedAt');
  const payloadHash = str(obj, 'payloadHash');
  const eventHash = str(obj, 'eventHash');
  if (
    id === undefined ||
    actorRef === undefined ||
    action === undefined ||
    targetRef === undefined ||
    recordedAt === undefined ||
    payloadHash === undefined ||
    eventHash === undefined
  ) {
    return undefined;
  }
  const approvalId = str(obj, 'approvalId');
  return {
    id,
    actorRef,
    action,
    targetRef,
    recordedAt,
    payloadHash,
    eventHash,
    ...(approvalId === undefined ? {} : { approvalId }),
  };
}

function parseList<T>(value: unknown, parseItem: (item: unknown) => T | undefined): { items: T[]; asOf: string; nextCursor?: string } | undefined {
  const obj = asObject(value);
  if (!obj) return undefined;
  const asOf = str(obj, 'asOf');
  if (asOf === undefined || !Array.isArray(obj['items'])) return undefined;
  const items: T[] = [];
  for (const raw of obj['items'] as unknown[]) {
    const parsed = parseItem(raw);
    if (parsed === undefined) return undefined;
    items.push(parsed);
  }
  const nextCursor = str(obj, 'nextCursor');
  return { items, asOf, ...(nextCursor === undefined ? {} : { nextCursor }) };
}

export function parseTransferList(value: unknown): TransferList | undefined {
  return parseList<TransferView>(value, parseTransfer);
}

export function parseCaseList(value: unknown): CaseList | undefined {
  return parseList<CaseView>(value, parseCase);
}

export function parseAuditEventList(value: unknown): AuditEventList | undefined {
  return parseList<AuditEventView>(value, parseAuditEvent);
}

export function parseTransferView(value: unknown): TransferView | undefined {
  return parseTransfer(value);
}

export function parseCaseView(value: unknown): CaseView | undefined {
  return parseCase(value);
}

export { ADMIN_AUDIENCE };
