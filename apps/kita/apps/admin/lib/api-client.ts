import { ADMIN_AUDIENCE, type ListQuery, type PageMeta } from './contracts.ts';

export const API_BASE_ENV = 'KITA_API_BASE_URL';
export const SERVICE_TOKEN_ENV = 'KITA_ADMIN_SERVICE_TOKEN';

export interface UpstreamCall {
  readonly method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly path: string;
  readonly query?: Readonly<Record<string, string | number | undefined>>;
}

const registry: UpstreamCall[] = [];

export function recordUpstream(call: UpstreamCall): void {
  registry.push({
    method: call.method,
    path: call.path,
    ...(call.query === undefined ? {} : { query: call.query }),
  });
}

export function upstreamCalls(): readonly UpstreamCall[] {
  return registry.slice();
}

export function resetUpstreamCalls(): void {
  registry.length = 0;
}

export function mutationCalls(): readonly UpstreamCall[] {
  return registry.filter((c) => c.method !== 'GET' && c.method !== 'HEAD');
}

/** The admin BFF uses the kita-admin audience only; customer tokens are never accepted. */
export function assertAdminAudience(audience: string): void {
  if (audience !== ADMIN_AUDIENCE) {
    throw new Error('AUDIENCE_MISMATCH');
  }
}

export function apiBase(): string {
  const base = process.env[API_BASE_ENV];
  if (!base) throw new Error(`${API_BASE_ENV} is not configured`);
  return base.replace(/\/+$/, '');
}

function serviceToken(): string {
  const token = process.env[SERVICE_TOKEN_ENV];
  if (!token) throw new Error(`${SERVICE_TOKEN_ENV} is not configured`);
  return token;
}

function queryString(query: Readonly<Record<string, string | number | undefined>>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue;
    params.set(key, String(value));
  }
  const rendered = params.toString();
  return rendered.length > 0 ? `?${rendered}` : '';
}

export interface ReadResult<T> {
  readonly ok: boolean;
  readonly status: number;
  readonly body?: T;
  readonly problemCode?: string;
  readonly requestId?: string;
}

/**
 * GET-only transport. There is deliberately no exported write helper: admin reads
 * project state and never invoke a financial reducer or command.
 */
export async function adminGet<T>(path: string, query: Record<string, string | number | undefined> = {}): Promise<ReadResult<T>> {
  assertAdminAudience(ADMIN_AUDIENCE);
  recordUpstream({ method: 'GET', path, query });
  const response = await fetch(`${apiBase()}${path}${queryString(query)}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${serviceToken()}`,
    },
    cache: 'no-store',
  });
  const requestId = response.headers.get('x-request-id') ?? undefined;
  if (!response.ok) {
    const problemCode = await response
      .json()
      .then((body: unknown) => {
        const code = (body as { code?: unknown }).code;
        return typeof code === 'string' ? code : undefined;
      })
      .catch(() => undefined);
    return {
      ok: false,
      status: response.status,
      ...(problemCode === undefined ? {} : { problemCode }),
      ...(requestId === undefined ? {} : { requestId }),
    };
  }
  const body = (await response.json()) as T;
  return { ok: true, status: response.status, body, ...(requestId === undefined ? {} : { requestId }) };
}

export function normalizeListQuery(query: ListQuery): Record<string, string | number> {
  const limit = Math.min(Math.max(Math.floor(query.limit ?? 25), 1), 100);
  const out: Record<string, string | number> = { limit };
  if (query.cursor !== undefined) out.cursor = query.cursor;
  if (query.status !== undefined) out.status = query.status;
  if (query.reference !== undefined) out.reference = query.reference;
  if (query.provider !== undefined) out.provider = query.provider;
  if (query.corridor !== undefined) out.corridor = query.corridor;
  if (query.assignee !== undefined) out.assignee = query.assignee;
  return out;
}

export function isPageMeta(value: unknown): value is PageMeta {
  const candidate = value as { items?: unknown; asOf?: unknown } | null;
  return !!candidate && Array.isArray(candidate.items) && typeof candidate.asOf === 'string';
}
