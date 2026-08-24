/**
 * Browser DAST lane (Phase A) — client-side/header-level dynamic analysis of
 * each target URL through the Arsenal DAST primitives. Real HTTP requests,
 * real classification inside each tool; this lane is the battery driver.
 *
 * Lane options:
 *   tools:              string[] subset override (defaults below)
 *   openRedirectParam:  query param name for open_redirect_test (default 'next')
 */

import type { AnalysisFinding } from '../../analysis/finding.js';
import type { LaneContext, LaneResult, ScanLane } from '../types.js';
import { optString, optStringArray, runTool, targetUrls } from './util.js';

const DEFAULT_TOOLS = [
  'header_analysis',
  'clickjacking_test',
  'cors_check',
  'cookie_analysis',
  'csp_analysis',
  'http_methods_test',
  'technology_detect',
  'open_redirect_test',
] as const;

export const browserDastLane: ScanLane = {
  id: 'browser_dast',
  phase: 'A',
  async run(ctx: LaneContext): Promise<LaneResult> {
    ctx.abort.throwIfAborted();
    const urls = targetUrls(ctx);
    if (urls.length === 0) {
      return { lane: 'browser_dast', status: 'skipped', reason: 'no target URLs', summary: 'no target URLs', findings: [], artifacts: [] };
    }
    const tools = optStringArray(ctx, 'browser_dast', 'tools');
    const battery = tools.length > 0 ? tools : [...DEFAULT_TOOLS];
    const redirectParam = optString(ctx, 'browser_dast', 'openRedirectParam') ?? 'next';

    const findings: AnalysisFinding[] = [];
    const artifacts: string[] = [];
    let ran = 0;
    let unavailable = 0;

    for (const url of urls) {
      for (const tool of battery) {
        ctx.abort.throwIfAborted();
        const parameters: Record<string, unknown> = { url };
        if (tool === 'open_redirect_test') parameters.param = redirectParam;
        const r = await runTool(ctx, tool, parameters, url);
        if (!r.available) { unavailable += 1; continue; }
        ran += 1;
        findings.push(...r.findings);
        if (r.error) artifacts.push(`${tool} ${url}: ${r.error}`);
      }
    }

    if (ran === 0 && unavailable > 0) {
      return {
        lane: 'browser_dast',
        status: 'skipped',
        reason: 'no DAST tools registered in the Arsenal',
        summary: 'DAST battery unavailable',
        findings,
        artifacts,
      };
    }
    return {
      lane: 'browser_dast',
      status: 'completed',
      summary: `DAST battery: ${ran} tool run(s) across ${urls.length} URL(s) — ${findings.length} finding(s)`,
      findings,
      artifacts,
    };
  },
};
