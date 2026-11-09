import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import {
  ADMIN_AUDIENCE,
  type AuditEventList,
  type CaseList,
  type SessionAudience,
  type TransferList,
} from './contracts.ts';

export interface WorkforcePerson {
  readonly personId: string;
  readonly subject: string;
  readonly email: string;
  readonly displayName: string;
  readonly audience: SessionAudience;
  readonly roles: readonly string[];
  readonly grants: readonly string[];
  readonly maxMinorByCurrency: Readonly<Record<string, string>>;
  readonly stepUpAt?: number;
}

export const ADMIN_SESSION_COOKIE = '__Host-kita_admin_session';
export const ADMIN_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;
const STEP_UP_WINDOW_MS = 5 * 60 * 1000;

const ROLE_BUNDLES: Readonly<Record<string, readonly string[]>> = {
  user: ['queue.read', 'case.read', 'audit.read'],
  admin: ['queue.read', 'case.read', 'audit.read', 'pii.reveal', 'documents.read'],
};

/**
 * Local read-only projection of the workforce directory. It is NOT an identity
 * provider: production sessions come from the separate workforce OIDC audience
 * (`kita-admin`) per docs/kita-plan/09-admin-security.md I1 and ADR-01. No
 * credential here can create, approve or move money — there are no write paths.
 */
const DIRECTORY: readonly WorkforcePerson[] = [
  {
    personId: 'person-ops-0001',
    subject: 'ops@example.invalid',
    email: 'ops@example.invalid',
    displayName: 'Ops Viewer',
    audience: ADMIN_AUDIENCE,
    roles: ['user'],
    grants: [...(ROLE_BUNDLES['user'] ?? [])],
    maxMinorByCurrency: {},
  },
  {
    personId: 'person-adm-0001',
    subject: 'admin@example.invalid',
    email: 'admin@example.invalid',
    displayName: 'Access Administrator',
    audience: ADMIN_AUDIENCE,
    roles: ['admin'],
    grants: [...(ROLE_BUNDLES['admin'] ?? [])],
    maxMinorByCurrency: {},
    stepUpAt: Date.now(),
  },
];

export function findPerson(subject: string): WorkforcePerson | undefined {
  return DIRECTORY.find((p) => p.subject === subject);
}

export function listPeople(): readonly WorkforcePerson[] {
  return DIRECTORY;
}

export function hasRole(person: WorkforcePerson, role: 'user' | 'admin'): boolean {
  return person.roles.includes(role);
}

export function hasGrant(person: WorkforcePerson, permission: string): boolean {
  return person.grants.includes(permission);
}

export function hasFreshStepUp(person: WorkforcePerson, now: number = Date.now()): boolean {
  return person.stepUpAt !== undefined && now - person.stepUpAt <= STEP_UP_WINDOW_MS;
}

function encodeJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

function decodeJson(segment: string): unknown {
  return JSON.parse(Buffer.from(segment, 'base64url').toString('utf8')) as unknown;
}

function signingKey(): Buffer {
  const secret = process.env.KITA_ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('KITA_ADMIN_SESSION_SECRET is required (server-side only, min 32 chars)');
  }
  return Buffer.from(secret, 'utf8');
}

function sign(payloadSegment: string, key: Buffer): string {
  return createHmac('sha256', key).update(payloadSegment).digest('base64url');
}

export function issueSessionToken(person: WorkforcePerson, now: number = Date.now()): string {
  const payload = {
    pid: person.personId,
    aud: person.audience,
    iat: Math.floor(now / 1000),
    exp: Math.floor(now / 1000) + ADMIN_SESSION_MAX_AGE_SECONDS,
    jti: randomBytes(16).toString('hex'),
  };
  const body = encodeJson(payload);
  return `${body}.${sign(body, signingKey())}`;
}

export function verifySessionToken(token: string, now: number = Date.now()): WorkforcePerson | undefined {
  const parts = token.split('.');
  if (parts.length !== 2) return undefined;
  const body = parts[0];
  const mac = parts[1];
  if (body === undefined || mac === undefined) return undefined;
  const key = signingKey();
  const expected = sign(body, key);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return undefined;
  let payload: { pid?: string; aud?: string; exp?: number };
  try {
    payload = decodeJson(body) as typeof payload;
  } catch {
    return undefined;
  }
  if (typeof payload.exp !== 'number' || payload.exp * 1000 <= now) return undefined;
  if (payload.aud !== ADMIN_AUDIENCE) return undefined;
  const person = listPeople().find((p) => p.personId === payload.pid);
  if (person === undefined) return undefined;
  if (person.audience !== payload.aud) return undefined;
  return person;
}

export function sessionCookie(name: string, value: string): string {
  return [
    `${name}=${value}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    `Max-Age=${ADMIN_SESSION_MAX_AGE_SECONDS}`,
  ].join('; ');
}

export function clearedSessionCookie(name: string): string {
  return `${name}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}
