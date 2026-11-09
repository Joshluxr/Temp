import { NextResponse, type NextRequest } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_PERMISSIONS,
  authorize,
  hasRole,
  verifySessionToken,
  type AdminPermissionKey,
  type WorkforcePerson,
} from './lib/auth.ts';

export interface RoutePolicy {
  readonly permission?: AdminPermissionKey;
  readonly requireRole?: 'user' | 'admin';
}

const PUBLIC_PATHS = new Set(['/login']);

const POLICIES: readonly { readonly prefix: string; readonly policy: RoutePolicy }[] = [
  { prefix: '/transfers', policy: { permission: 'transfersRead' } },
  { prefix: '/cases', policy: { permission: 'casesRead' } },
  { prefix: '/audit', policy: { permission: 'auditRead' } },
  { prefix: '/access', policy: { requireRole: 'admin' } },
  { prefix: '/dashboard', policy: {} },
];

export function resolvePolicy(pathname: string): RoutePolicy | undefined {
  if (PUBLIC_PATHS.has(pathname)) return undefined;
  const match = POLICIES
    .filter((entry) => pathname === entry.prefix || pathname.startsWith(`${entry.prefix}/`))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0];
  if (match) return match.policy;
  return {};
}

export function evaluate(policy: RoutePolicy, person: WorkforcePerson): boolean {
  if (policy.requireRole !== undefined && !hasRole(person, policy.requireRole)) return false;
  if (policy.permission !== undefined && !authorize(person, ADMIN_PERMISSIONS[policy.permission])) return false;
  return true;
}

export function sessionFromRequest(request: NextRequest): WorkforcePerson | undefined {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return undefined;
  try {
    return verifySessionToken(token);
  } catch {
    return undefined;
  }
}

export async function adminRouteGuard(request: NextRequest): Promise<NextResponse | undefined> {
  const { pathname } = request.nextUrl;
  const policy = resolvePolicy(pathname);
  if (policy === undefined) return undefined;

  const person = sessionFromRequest(request);
  if (person === undefined) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return deny(request, 'AUTHENTICATION_REQUIRED', 401);
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    const redirect = NextResponse.redirect(loginUrl);
    redirect.headers.set('Cache-Control', 'private, no-store');
    return redirect;
  }

  if (!evaluate(policy, person)) {
    return deny(request, 'SCOPE_OR_ASSURANCE_DENIED', 403);
  }
  return undefined;
}

function deny(request: NextRequest, code: string, status: number): NextResponse {
  if (isApiRoute(request.nextUrl.pathname)) {
    return NextResponse.json(
      {
        type: 'https://kita.example/problems/authorization-denied',
        title: 'Authorization denied',
        status,
        code,
        requestId: crypto.randomUUID(),
        retryable: false,
      },
      { status, headers: { 'Cache-Control': 'private, no-store' } },
    );
  }
  return new NextResponse(null, { status, headers: { 'Cache-Control': 'private, no-store' } });
}

function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/');
}
