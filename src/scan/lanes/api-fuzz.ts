/**
 * API fuzz lane (Phase B) — discovers endpoints (api_endpoint_discovery) and
 * drives the injection battery (xss/sqli/lfi/ssti) at every fuzzable parameter.
 *
 * Endpoints come from, in priority order:
 *   1. lanes.api_fuzz.endpoints: [{ url, params: string[] }]  (operator-supplied)
 *   2. endpoints discovered by the api_endpoint_discovery tool run per base URL
 *   3. the target URLs themselves with `params` from options (default ['id'])
 *
 * Lane options:
 *   endpoints:    [{ url, params?: string[] }]
 *   params:       default parameter names when an endpoint lists none (default ['id'])
 *   tools:        injection battery override (default xss_scan, sqli_scan, lfi_test, ssti_test)
 *   maxEndpoints: cap per scan (default 10)
 *   wordlist:     path wordlist override for api_endpoint_discovery
 */

import type { AnalysisFinding } from '../../analysis/finding.js';
import type { LaneContext, LaneResult, ScanLane } from '../types.js';
import { optNumber, optRecord, optStringArray, runTool, targetUrls } from './util.js';

const DEFAULT_INJECTION_TOOLS = ['xss_scan', 'sqli_scan', 'lfi_test', 'ssti_test'] as const;
const URL_IN_TEXT = /https?:\/\/[^\s"'<>()\]]+/g;

interface Endpoint {
  url: string;
  params: string[];
}

function operatorEndpoints(ctx: LaneContext): Endpoint[] {
  const raw = optRecord(ctx, 'api_fuzz')['endpoints'];
  if (!Array.isArray(raw)) return [];
  const out: Endpoint[] = [];
  for (const entry of raw) {
    if (typeof entry !== 'object' || entry === null) continue;
    const e = entry as Record<string, unknown>;
    if (typeof e.url !== 'string' || !/^https?:\/\//i.test(e.url)) continue;
    const params = Array.isArray(e.params)
      ? e.params.filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
      : [];
    out.push({ url: e.url, params });
  }
  return out;
}

async function discoverEndpoints(ctx: LaneContext, baseUrl: string, wordlist: string[] | undefined): Promise<string[]> {
  const parameters: Record<string, unknown> = { url: baseUrl };
  if (wordlist && wordlist.length > 0) parameters.wordlist = wordlist.slice(0, 200);
  const r = await runTool(ctx, 'api_endpoint_discovery', parameters, baseUrl);
  if (!r.available) return [];
  const text = [r.output, r.error].filter(Boolean).join('\n');
  const found = new Set<string>();
  for (const m of text.matchAll(URL_IN_TEXT)) {
    try {
      const u = new URL(m[0]);
      if (u.origin === new URL(baseUrl).origin) found.add(u.toString());
    } catch { /* unparseable — skip */ }
  }
  return [...found];
}

export const apiFuzzLane: ScanLane = {
  id: 'api_fuzz',
  phase: 'B',
  async run(ctx: LaneContext): Promise<LaneResult> {
    ctx.abort.throwIfAborted();
    const urls = targetUrls(ctx);
    const maxEndpoints = optNumber(ctx, 'api_fuzz', 'maxEndpoints', 10);
    const defaultParams = optStringArray(ctx, 'api_fuzz', 'params');
    const fallbackParams = defaultParams.length > 0 ? defaultParams : ['id'];
    const tools = optStringArray(ctx, 'api_fuzz', 'tools');
    const battery = tools.length > 0 ? tools : [...DEFAULT_INJECTION_TOOLS];
    const wordlistRaw = optStringArray(ctx, 'api_fuzz', 'wordlist');
    const wordlist = wordlistRaw.length > 0 ? wordlistRaw : undefined;

    const endpoints: Endpoint[] = operatorEndpoints(ctx);
    if (endpoints.length === 0) {
      for (const base of urls) {
        ctx.abort.throwIfAborted();
        for (const url of await discoverEndpoints(ctx, base, wordlist)) {
          endpoints.push({ url, params: fallbackParams });
          if (endpoints.length >= maxEndpoints) break;
        }
        if (endpoints.length >= maxEndpoints) break;
      }
    }
    const queue = endpoints.slice(0, maxEndpoints);

    if (queue.length === 0) {
      return {
        lane: 'api_fuzz',
        status: 'skipped',
        reason: 'no endpoints supplied or discovered (set lanes.api_fuzz.endpoints)',
        summary: 'no endpoints to fuzz',
        findings: [],
        artifacts: [],
      };
    }

    const findings: AnalysisFinding[] = [];
    const artifacts: string[] = [];
    let runs = 0;

    for (const endpoint of queue) {
      const params = endpoint.params.length > 0 ? endpoint.params : fallbackParams;
      for (const param of params) {
        for (const tool of battery) {
          ctx.abort.throwIfAborted();
          const parameters: Record<string, unknown> = { url: endpoint.url };
          if (tool === 'xss_scan' || tool === 'sqli_scan') {
            parameters.param = param;
          } else {
            parameters.parameter = param;
          }
          const r = await runTool(ctx, tool, parameters, endpoint.url);
          if (!r.available) continue;
          runs += 1;
          findings.push(...r.findings);
          if (r.error) artifacts.push(`${tool} ${endpoint.url} [${param}]: ${r.error}`);
        }
      }
    }

    return {
      lane: 'api_fuzz',
      status: 'completed',
      summary: `fuzzed ${queue.length} endpoint(s) with ${runs} injection run(s) — ${findings.length} finding(s)`,
      findings,
      artifacts,
    };
  },
};
