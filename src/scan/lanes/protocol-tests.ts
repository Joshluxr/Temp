/**
 * Protocol tests lane (Phase B) — transport and naming-layer assessment:
 * TLS posture (ssl_scan), DNS/whois/reverse-DNS records, subdomain-takeover
 * surface, HTTP method inventory, and CIDR expansion for range-shaped hosts.
 *
 * Lane options:
 *   port:         TLS port for ssl_scan (default: target port or 443)
 *   dnsType:      record type for dns_lookup (default 'A')
 *   cidr:         CIDR to expand (default: any CIDR-shaped host in the target list)
 *   skipNetworkTrace: set true to skip network_trace even when available
 */

import type { LaneContext, LaneResult, ScanLane } from '../types.js';
import { optBoolean, optNumber, optString, runTool, targetHosts, targetUrls } from './util.js';

const CIDR_RE = /^\d{1,3}(?:\.\d{1,3}){3}\/\d{1,2}$/;

export const protocolTestsLane: ScanLane = {
  id: 'protocol_tests',
  phase: 'B',
  async run(ctx: LaneContext): Promise<LaneResult> {
    ctx.abort.throwIfAborted();
    const hosts = targetHosts(ctx);
    const urls = targetUrls(ctx);
    // CIDR-shaped targets never survive URL/host normalization, so look at the
    // raw profile targets — otherwise a CIDR-only engagement dead-ends here.
    const rawTargets = [...(ctx.profile.target.urls ?? []), ...(ctx.profile.target.hosts ?? [])];
    const cidrTarget = rawTargets.find((h) => CIDR_RE.test(h));
    if (hosts.length === 0 && urls.length === 0 && !cidrTarget) {
      return { lane: 'protocol_tests', status: 'skipped', reason: 'no targets', summary: 'no targets', findings: [], artifacts: [] };
    }

    const port = optNumber(ctx, 'protocol_tests', 'port', 443);
    const dnsType = optString(ctx, 'protocol_tests', 'dnsType') || 'A';
    const cidrOverride = optString(ctx, 'protocol_tests', 'cidr');
    const skipTrace = optBoolean(ctx, 'protocol_tests', 'skipNetworkTrace', false);

    const findings: LaneResult['findings'] = [];
    const artifacts: string[] = [];
    let runs = 0;

    const push = (r: Awaited<ReturnType<typeof runTool>>, label: string): void => {
      if (!r.available) return;
      runs += 1;
      findings.push(...r.findings);
      if (r.error) artifacts.push(`${label}: ${r.error}`);
    };

    for (const host of hosts) {
      if (CIDR_RE.test(host)) continue; // handled below
      ctx.abort.throwIfAborted();
      const urlPort = urls.map((u) => { try { return new URL(u).port; } catch { return ''; } }).find(Boolean);
      const tlsPort = port !== 443 ? port : (urlPort ? Number(urlPort) : 443);
      push(await runTool(ctx, 'ssl_scan', { host, port: tlsPort }, host), `ssl_scan ${host}`);
      push(await runTool(ctx, 'dns_lookup', { domain: host, type: dnsType }, host), `dns_lookup ${host}`);
      push(await runTool(ctx, 'whois_lookup', { target: host }, host), `whois_lookup ${host}`);
      push(await runTool(ctx, 'subdomain_takeover_check', { domain: host }, host), `subdomain_takeover_check ${host}`);
    }

    for (const url of urls) {
      ctx.abort.throwIfAborted();
      push(await runTool(ctx, 'http_methods_test', { url }, url), `http_methods_test ${url}`);
    }

    if (!skipTrace) {
      for (const url of urls.slice(0, 3)) {
        ctx.abort.throwIfAborted();
        push(await runTool(ctx, 'network_trace', { url }, url), `network_trace ${url}`);
      }
    }

    const cidr = cidrOverride || cidrTarget;
    if (cidr) {
      ctx.abort.throwIfAborted();
      push(await runTool(ctx, 'cidr_expand', { cidr }, cidr), `cidr_expand ${cidr}`);
    }

    if (runs === 0) {
      return {
        lane: 'protocol_tests',
        status: 'skipped',
        reason: 'no protocol tools registered in the arsenal',
        summary: 'protocol tools unavailable',
        findings,
        artifacts,
      };
    }

    return {
      lane: 'protocol_tests',
      status: 'completed',
      summary: `${runs} protocol check(s) across ${hosts.length} host(s) — ${findings.length} finding(s)`,
      findings,
      artifacts,
    };
  },
};
