/**
 * Authz-matrix lane (Phase B) — wraps the ported Shannon authorization-matrix
 * engine (src/intel/authz-matrix.ts) with a scope-gated probe derived from the
 * engagement targets. Sessions are operator-supplied (cookie/bearer); no
 * credential guessing happens here.
 *
 * Lane options:
 *   identities:   [{ name, role: 'anon'|'user'|'admin', cookie?, bearerToken? }]
 *                 — an anonymous identity is always added when absent
 *   endpoints:    [{ url, method? }]  — GET endpoints to replay (defaults derived)
 *   maxEndpoints: number              — cap on replayed endpoints (default 60)
 */

import { runAuthzMatrix, type MatrixEndpoint, type MatrixIdentity, type MatrixRole } from '../../intel/authz-matrix.js';
import { makeScopeProbe } from '../../intel/probe.js';
import type { LaneContext, LaneResult, ScanLane } from '../types.js';
import { intelToAnalysis, laneScope, optNumber, optRecord, targetUrls } from './util.js';

const ROLES: readonly MatrixRole[] = ['anon', 'user', 'admin'];

function identitiesFrom(ctx: LaneContext): MatrixIdentity[] {
  const raw = optRecord(ctx, 'authz_matrix')['identities'];
  const identities: MatrixIdentity[] = [];
  if (Array.isArray(raw)) {
    for (const entry of raw) {
      if (typeof entry !== 'object' || entry === null) continue;
      const e = entry as Record<string, unknown>;
      if (typeof e.name !== 'string' || !e.name.trim()) continue;
      const role = ROLES.includes(e.role as MatrixRole) ? (e.role as MatrixRole) : 'user';
      identities.push({
        name: e.name.trim().slice(0, 80),
        role,
        cookie: typeof e.cookie === 'string' && e.cookie ? e.cookie : undefined,
        bearerToken: typeof e.bearerToken === 'string' && e.bearerToken ? e.bearerToken : undefined,
      });
    }
  }
  if (!identities.some((i) => i.role === 'anon')) {
    identities.unshift({ name: 'anon', role: 'anon' });
  }
  return identities;
}

function endpointsFrom(ctx: LaneContext): MatrixEndpoint[] | undefined {
  const raw = optRecord(ctx, 'authz_matrix')['endpoints'];
  if (!Array.isArray(raw)) return undefined;
  const endpoints: MatrixEndpoint[] = [];
  for (const entry of raw) {
    if (typeof entry === 'object' && entry !== null && typeof (entry as Record<string, unknown>).url === 'string') {
      const e = entry as Record<string, unknown>;
      endpoints.push({ url: e.url as string, method: typeof e.method === 'string' ? e.method : 'GET' });
    } else if (typeof entry === 'string' && entry.trim()) {
      endpoints.push({ url: entry.trim() });
    }
  }
  return endpoints.length > 0 ? endpoints : undefined;
}

export const authzMatrixLane: ScanLane = {
  id: 'authz_matrix',
  phase: 'B',
  async run(ctx: LaneContext): Promise<LaneResult> {
    ctx.abort.throwIfAborted();
    const targets = targetUrls(ctx);
    if (targets.length === 0) {
      return { lane: 'authz_matrix', status: 'skipped', reason: 'no URL targets', summary: 'no URL targets', findings: [], artifacts: [] };
    }
    const identities = identitiesFrom(ctx);
    const endpoints = endpointsFrom(ctx);
    const maxEndpoints = optNumber(ctx, 'authz_matrix', 'maxEndpoints', 60);
    const probe = makeScopeProbe({ scope: laneScope(ctx) });

    const findings: LaneResult['findings'] = [];
    const artifacts: string[] = [];
    let tested = 0;
    for (const target of targets) {
      ctx.abort.throwIfAborted();
      const result = await runAuthzMatrix({
        target,
        endpoints,
        identities,
        probe,
        maxEndpoints,
        aborted: () => ctx.abort.aborted,
        onProgress: (message) => ctx.emit({ type: 'scan:lane_started', jobId: ctx.jobId, phase: 'B', lane: 'authz_matrix', status: 'replaying', detail: message, at: Date.now() }),
      });
      tested += result.endpointsTested;
      findings.push(...intelToAnalysis(result.findings));
      artifacts.push(`${target}: replayed ${result.endpointsTested} endpoint(s) × ${identities.length} identit(ies) in ${result.durationMs}ms`);
    }

    return {
      lane: 'authz_matrix',
      status: 'completed',
      summary: `replayed ${tested} endpoint(s) as ${identities.length} identit(ies) — ${findings.length} authorization finding(s)`,
      findings,
      artifacts,
    };
  },
};
