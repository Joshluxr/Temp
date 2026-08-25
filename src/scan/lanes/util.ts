/**
 * Shared lane helpers: target normalization, Arsenal tool execution with
 * finding collection, intel-finding adaptation, and scope derivation for the
 * intel probe lanes.
 */

import type { AnalysisFinding } from '../../analysis/finding.js';
import type { IntelFinding } from '../../intel/types.js';
import { makeScopeProbe, type Probe } from '../../intel/probe.js';
import { hostFromTargetValue, type ArsenalScope } from '../../arsenal/index.js';
import type { LaneContext, LaneId } from '../types.js';

/** The lane's own options bag from the profile (everything beside `enabled`). */
export function laneOptions(ctx: LaneContext, lane: LaneId): Record<string, unknown> {
  const opts = ctx.profile.lanes?.[lane] as Record<string, unknown> | undefined;
  return opts ?? {};
}

/** The lane's full options record (alias of laneOptions for call-site brevity). */
export function optRecord(ctx: LaneContext, lane: LaneId): Record<string, unknown> {
  return laneOptions(ctx, lane);
}

export function optString(ctx: LaneContext, lane: LaneId, key: string, fallback: string): string;
export function optString(ctx: LaneContext, lane: LaneId, key: string, fallback?: string): string | undefined;
export function optString(ctx: LaneContext, lane: LaneId, key: string, fallback?: string): string | undefined {
  const v = laneOptions(ctx, lane)[key];
  return typeof v === 'string' && v.trim() ? v.trim() : fallback;
}

export function optStringArray(ctx: LaneContext, lane: LaneId, key: string): string[] {
  const v = laneOptions(ctx, lane)[key];
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).map((x) => x.trim());
}

export function optNumber(ctx: LaneContext, lane: LaneId, key: string, fallback: number): number {
  const v = laneOptions(ctx, lane)[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

export function optBoolean(ctx: LaneContext, lane: LaneId, key: string, fallback: boolean): boolean {
  const v = laneOptions(ctx, lane)[key];
  return typeof v === 'boolean' ? v : fallback;
}

/** Normalize a target value to an http(s) URL. Bare hosts get https://. */
export function toUrl(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

/** Deduped, normalized target URLs for this scan. */
export function targetUrls(ctx: LaneContext): string[] {
  const all = [...(ctx.profile.target.urls ?? []), ...(ctx.profile.target.hosts ?? [])];
  return [...new Set(all.map((v) => {
    try { return new URL(toUrl(v)).toString(); } catch { return toUrl(v); }
  }))];
}

/** Deduped bare hosts for this scan. */
export function targetHosts(ctx: LaneContext): string[] {
  const all = [...(ctx.profile.target.urls ?? []), ...(ctx.profile.target.hosts ?? [])];
  return [...new Set(all
    .map((v) => hostFromTargetValue(v))
    .filter((h): h is string => Boolean(h)))];
}

export interface ToolRun {
  /** False when the tool is not registered in this Arsenal. */
  available: boolean;
  success: boolean;
  findings: AnalysisFinding[];
  artifacts: string[];
  /** Raw tool output, when the tool ran and produced any. */
  output?: string;
  error?: string;
}

interface RawToolFinding {
  title?: string;
  severity?: AnalysisFinding['severity'];
  details?: string;
  toolOutput?: string;
  cwe?: string[];
  toolName?: string;
}

/**
 * Execute an Arsenal tool for a lane and normalize the result. Unregistered
 * tools come back as `available: false` (the lane self-skips) instead of
 * throwing, so a lane degrades gracefully on a minimal Arsenal.
 */
export async function runTool(
  ctx: LaneContext,
  tool: string,
  parameters: Record<string, unknown>,
  target: string,
): Promise<ToolRun> {
  ctx.abort.throwIfAborted();
  if (!ctx.arsenal.getTool(tool)) {
    return { available: false, success: false, findings: [], artifacts: [], error: `tool "${tool}" not registered` };
  }
  try {
    const result = await ctx.arsenal.execute(tool, { parameters });
    const findings: AnalysisFinding[] = (result.findings ?? []).map((f) => {
      const raw = f as unknown as RawToolFinding;
      return {
        tool: raw.toolName ?? tool,
        target,
        title: raw.title ?? `${tool} finding`,
        severity: raw.severity ?? 'info',
        evidence: raw.toolOutput ?? raw.details,
        cwe: raw.cwe,
        raw: f,
      };
    });
    const artifacts: string[] = [];
    if (result.output) artifacts.push(result.output);
    if (!result.success && result.error) artifacts.push(`${tool}: ${result.error}`);
    return { available: true, success: result.success, findings, artifacts, output: result.output, error: result.error };
  } catch (err) {
    // ScanAbortedError must propagate so the workflow can mark the job aborted.
    if (err instanceof Error && err.name === 'ScanAbortedError') throw err;
    const message = err instanceof Error ? err.message : String(err);
    return { available: true, success: false, findings: [], artifacts: [`${tool}: ${message}`], error: message };
  }
}

/** Adapt intel-module findings (authz-matrix / flow-attacks) to AnalysisFinding. */
export function intelToAnalysis(findings: readonly IntelFinding[]): AnalysisFinding[] {
  return findings.map((f) => ({
    tool: f.engine ?? f.source,
    target: f.target,
    title: f.title,
    severity: f.severity,
    evidence: f.evidence ?? f.description,
    raw: f,
  }));
}

const LOOPBACK_RE = /^(localhost|::1|127\.)/;
const PRIVATE_RE = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|fd|fe80)/;

/**
 * The scope an intel probe lane enforces: the Arsenal's live scope when the
 * server set one, otherwise a scope derived from the profile targets so the
 * lane still fails closed on anything off-target.
 */
export function laneScope(ctx: LaneContext): ArsenalScope {
  const live = ctx.arsenal.getScope();
  if (live) return live;
  const hosts = targetHosts(ctx);
  return {
    allowedHosts: hosts,
    allowLoopback: hosts.some((h) => LOOPBACK_RE.test(h)),
    allowPrivate: hosts.some((h) => PRIVATE_RE.test(h)),
  };
}

/** Build the scope-gated probe for intel lanes, honoring abort + progress. */
export function laneProbe(ctx: LaneContext): Probe {
  return makeScopeProbe({ scope: laneScope(ctx) });
}

/** Emit a per-lane progress line on the operator feed. */
export function progress(ctx: LaneContext, lane: LaneId, message: string): void {
  ctx.emit({ type: 'scan:lane_started', jobId: ctx.jobId, lane, status: 'progress', detail: message, at: Date.now() });
}
