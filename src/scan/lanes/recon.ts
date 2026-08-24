/**
 * Recon lane (Phase A) — the always-available baseline probe: every target is
 * fetched through the real Arsenal HTTP primitive and any tool findings are
 * recorded. (Moved verbatim from the Phase-0 lane registry.)
 */

import type { LaneContext, LaneResult, ScanLane } from '../types.js';

export const reconLane: ScanLane = {
  id: 'recon',
  phase: 'A',
  async run(ctx: LaneContext): Promise<LaneResult> {
    const targets = Array.from(new Map(
      [...ctx.profile.target.urls, ...ctx.profile.target.hosts].map((value) => {
        const url = /^https?:\/\//i.test(value) ? value : `https://${value}`;
        try { return [new URL(url).toString(), url] as const; }
        catch { return [url.toLowerCase(), url] as const; }
      }),
    ).values());
    const findings: LaneResult['findings'] = [];
    const artifacts: string[] = [];
    let completed = 0;
    for (const target of targets) {
      ctx.abort.throwIfAborted();
      const url = /^https?:\/\//i.test(target) ? target : `https://${target}`;
      ctx.emit({ type: 'scan:lane_started', jobId: ctx.jobId, phase: 'A', lane: 'recon', status: 'probing', detail: url, at: Date.now() });
      const result = await ctx.arsenal.execute('http_request', { parameters: { url, method: 'GET' } });
      if (!result.success) {
        artifacts.push(`${url}: ${result.error ?? 'request failed'}`);
        continue;
      }
      completed += 1;
      artifacts.push(result.output ?? `${url}: request completed`);
      for (const finding of result.findings ?? []) {
        findings.push({
          tool: finding.toolName ?? 'http_request',
          target: url,
          title: finding.title,
          severity: finding.severity,
          evidence: finding.toolOutput ?? finding.details,
          cwe: finding.cwe,
          raw: finding,
        });
      }
    }
    return {
      lane: 'recon',
      status: 'completed',
      summary: `probed ${completed}/${targets.length} target(s) with the real Arsenal HTTP primitive`,
      findings,
      artifacts,
    };
  },
};
