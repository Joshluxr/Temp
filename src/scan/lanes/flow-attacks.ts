/**
 * Flow-attacks lane (Phase B) — drives the ported Shannon multi-step engines
 * (src/intel/flow-attacks.ts) through a scope-gated probe:
 *
 *   auth-flow   — OAuth redirect_uri validation, JWT signature flaws
 *                 (alg:none / confusion), session fixation/non-invalidation
 *   reset-chain — password-reset host-header poisoning, token leak, token reuse
 *   enum-spray  — enumerable object ids (IDOR at scale), missing rate limiting
 *
 * Each sub-engine runs only when its inputs exist — the lane is honest about
 * what it did and did not test instead of fabricating coverage.
 *
 * Lane options:
 *   authorizeUrls: string[]; protectedUrl: string; bearerToken: string;
 *   legitimateRedirectUri: string; preAuthCookie: string
 *   resetRequestUrls: string[]; account: string; resetConfirmUrl: string
 *   accessUrlTemplate: string (with {id}); enumRange: { from, to };
 *   maxEnumProbes: number; loginUrl: string; usernames: string[]; passwords: string[]
 */

import { runAuthFlow, runEnumSpray, runResetChain } from '../../intel/flow-attacks.js';
import { makeScopeProbe } from '../../intel/probe.js';
import type { LaneContext, LaneResult, ScanLane } from '../types.js';
import { intelToAnalysis, laneScope, optNumber, optRecord, optString, optStringArray, targetUrls } from './util.js';

export const flowAttacksLane: ScanLane = {
  id: 'flow_attacks',
  phase: 'B',
  async run(ctx: LaneContext): Promise<LaneResult> {
    ctx.abort.throwIfAborted();
    const opts = optRecord(ctx, 'flow_attacks');
    const probe = makeScopeProbe({ scope: laneScope(ctx) });
    const aborted = () => ctx.abort.aborted;
    const onProgress = (message: string) =>
      ctx.emit({ type: 'scan:lane_started', jobId: ctx.jobId, phase: 'B', lane: 'flow_attacks', status: 'probing', detail: message, at: Date.now() });

    const authorizeUrls = optStringArray(ctx, 'flow_attacks', 'authorizeUrls');
    const protectedUrl = optString(ctx, 'flow_attacks', 'protectedUrl', targetUrls(ctx)[0] ?? '');
    const resetRequestUrls = optStringArray(ctx, 'flow_attacks', 'resetRequestUrls');
    const account = optString(ctx, 'flow_attacks', 'account', '');
    const accessUrlTemplate = optString(ctx, 'flow_attacks', 'accessUrlTemplate', '');
    const loginUrl = optString(ctx, 'flow_attacks', 'loginUrl', '');

    const enginesRun: string[] = [];
    const findings: LaneResult['findings'] = [];
    const artifacts: string[] = [];

    if (authorizeUrls.length > 0 || protectedUrl) {
      enginesRun.push('auth-flow');
      const out = await runAuthFlow({
        probe, aborted, onProgress,
        authorizeUrls,
        protectedUrl,
        bearerToken: optString(ctx, 'flow_attacks', 'bearerToken', '') || undefined,
        legitimateRedirectUri: optString(ctx, 'flow_attacks', 'legitimateRedirectUri', '') || undefined,
        preAuthCookie: optString(ctx, 'flow_attacks', 'preAuthCookie', '') || undefined,
      });
      findings.push(...intelToAnalysis(out));
      artifacts.push(`auth-flow: ${out.length} finding(s)`);
    }

    if (resetRequestUrls.length > 0 && account) {
      enginesRun.push('reset-chain');
      const out = await runResetChain({
        probe, aborted, onProgress,
        resetRequestUrls,
        account,
        resetConfirmUrl: optString(ctx, 'flow_attacks', 'resetConfirmUrl', '') || undefined,
      });
      findings.push(...intelToAnalysis(out));
      artifacts.push(`reset-chain: ${out.length} finding(s)`);
    }

    const enumRangeRaw = opts['enumRange'];
    const enumRange = typeof enumRangeRaw === 'object' && enumRangeRaw !== null
      && typeof (enumRangeRaw as Record<string, unknown>).from === 'number'
      && typeof (enumRangeRaw as Record<string, unknown>).to === 'number'
      ? { from: (enumRangeRaw as Record<string, number>).from, to: (enumRangeRaw as Record<string, number>).to }
      : undefined;

    if (accessUrlTemplate || loginUrl) {
      enginesRun.push('enum-spray');
      const out = await runEnumSpray({
        probe, aborted, onProgress,
        accessUrlTemplate: accessUrlTemplate || undefined,
        enumRange,
        maxEnumProbes: optNumber(ctx, 'flow_attacks', 'maxEnumProbes', 50),
        loginUrl: loginUrl || undefined,
        usernames: optStringArray(ctx, 'flow_attacks', 'usernames'),
        passwords: optStringArray(ctx, 'flow_attacks', 'passwords'),
      });
      findings.push(...intelToAnalysis(out));
      artifacts.push(`enum-spray: ${out.length} finding(s)`);
    }

    if (enginesRun.length === 0) {
      return {
        lane: 'flow_attacks',
        status: 'skipped',
        reason: 'no engine inputs supplied (authorizeUrls/protectedUrl, resetRequestUrls+account, accessUrlTemplate, or loginUrl)',
        summary: 'no flow-attack engine inputs supplied',
        findings: [],
        artifacts: [],
      };
    }

    return {
      lane: 'flow_attacks',
      status: 'completed',
      summary: `ran ${enginesRun.join(', ')} — ${findings.length} flow finding(s)`,
      findings,
      artifacts,
    };
  },
};
