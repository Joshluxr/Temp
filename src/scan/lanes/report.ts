/**
 * Report lane (report phase) — SARIF 2.1.0 export plus an operator-readable
 * Markdown report rendered from the scan's recorded findings.
 */

import { writeFile } from 'fs/promises';
import { join } from 'path';
import { exportSarif } from '../../analysis/sarif-export.js';
import { toAnalysisFindings } from '../../analysis/shannon-adapter.js';
import type { AnalysisFinding } from '../../analysis/finding.js';
import type { LaneContext, LaneResult } from '../types.js';

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'info'] as const;

/** Render the findings rollup as a Markdown report. Pure and deterministic. */
export function renderMarkdownReport(jobId: string, name: string | undefined, findings: readonly AnalysisFinding[]): string {
  const lines: string[] = [];
  lines.push(`# T3MP3ST Scan Report`);
  lines.push('');
  lines.push(`- Job: \`${jobId}\``);
  if (name) lines.push(`- Name: ${name}`);
  lines.push(`- Generated: ${new Date().toISOString()}`);
  lines.push(`- Findings: ${findings.length}`);
  lines.push('');
  if (findings.length === 0) {
    lines.push('_No findings recorded for this scan._');
    lines.push('');
    return lines.join('\n');
  }
  const bySeverity = new Map<string, AnalysisFinding[]>();
  for (const f of findings) {
    const bucket = bySeverity.get(f.severity) ?? [];
    bucket.push(f);
    bySeverity.set(f.severity, bucket);
  }
  for (const severity of SEVERITY_ORDER) {
    const bucket = bySeverity.get(severity);
    if (!bucket || bucket.length === 0) continue;
    lines.push(`## ${severity.toUpperCase()} (${bucket.length})`);
    lines.push('');
    lines.push('| Title | Target | Tool | CWE |');
    lines.push('| --- | --- | --- | --- |');
    for (const f of bucket) {
      const cell = (v: string | undefined): string => (v ?? '—').replace(/\|/g, '\\|').replace(/\n/g, ' ');
      lines.push(`| ${cell(f.title)} | ${cell(f.target)} | ${cell(f.tool)} | ${cell(f.cwe?.join(', '))} |`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

export const reportLane = {
  id: 'report' as const,
  phase: 'report' as const,
  async run(ctx: LaneContext): Promise<LaneResult> {
    ctx.abort.throwIfAborted();
    const analysis = toAnalysisFindings(ctx.findings);
    const artifacts: string[] = [];

    const sarifPath = join(ctx.deliverablesDir, 'report.sarif.json');
    await writeFile(sarifPath, JSON.stringify(exportSarif(analysis), null, 2));
    artifacts.push(sarifPath);

    const markdownPath = join(ctx.deliverablesDir, 'report.md');
    await writeFile(markdownPath, renderMarkdownReport(ctx.jobId, ctx.profile.name, analysis));
    artifacts.push(markdownPath);

    return {
      lane: 'report',
      status: 'completed',
      summary: `exported ${analysis.length} finding(s) as SARIF 2.1.0 + Markdown report`,
      findings: [],
      artifacts,
    };
  },
};
