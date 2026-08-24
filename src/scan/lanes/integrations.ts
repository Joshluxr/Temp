/**
 * Integrations lane (report phase) — exports the scan's findings in the
 * interoperable formats downstream tooling consumes:
 *   - STIX 2.1 bundle (threat-intel platforms)
 *   - MISP event (MISP communities)
 *   - MITRE ATT&CK Navigator layer (technique heatmap)
 */

import { writeFile } from 'fs/promises';
import { join } from 'path';
import { exportStixBundle, exportMispEvent } from '../../analysis/stix-misp-export.js';
import { exportNavigatorLayer } from '../../analysis/attack-navigator-export.js';
import { toAnalysisFindings } from '../../analysis/shannon-adapter.js';
import type { LaneContext, LaneResult } from '../types.js';

export const integrationsLane = {
  id: 'integrations' as const,
  phase: 'report' as const,
  async run(ctx: LaneContext): Promise<LaneResult> {
    ctx.abort.throwIfAborted();
    const analysis = toAnalysisFindings(ctx.findings);
    const exportable = analysis.map((f) => ({
      tool: f.tool,
      target: f.target,
      title: f.title,
      severity: f.severity,
      evidence: f.evidence,
    }));

    const artifacts: string[] = [];
    const engagementId = ctx.jobId;

    const stix = exportStixBundle({ findings: exportable, engagementId });
    const stixPath = join(ctx.deliverablesDir, 'stix-bundle.json');
    await writeFile(stixPath, JSON.stringify(stix, null, 2));
    artifacts.push(stixPath);

    const misp = exportMispEvent({ findings: exportable, engagementId });
    const mispPath = join(ctx.deliverablesDir, 'misp-event.json');
    await writeFile(mispPath, JSON.stringify(misp, null, 2));
    artifacts.push(mispPath);

    const navigator = exportNavigatorLayer(analysis, {
      name: `T3MP3ST scan ${ctx.profile.name ?? ctx.jobId}`,
      description: `ATT&CK technique coverage for scan job ${ctx.jobId}`,
    });
    const navigatorPath = join(ctx.deliverablesDir, 'attack-navigator.json');
    await writeFile(navigatorPath, JSON.stringify(navigator, null, 2));
    artifacts.push(navigatorPath);

    return {
      lane: 'integrations',
      status: 'completed',
      summary: `exported ${exportable.length} finding(s) as STIX 2.1, MISP, and ATT&CK Navigator artifacts`,
      findings: [],
      artifacts,
    };
  },
};
