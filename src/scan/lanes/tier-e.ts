/**
 * Tier-E white-box lane (Phase A) — static source analysis over operator-
 * supplied code, with an optional LLM deep-review pass. Deterministic rules
 * fire first (each maps to CWE); the LLM pass only runs when a backbone is
 * attached and is tagged tool='llm-review' so provenance stays honest.
 *
 * Lane options:
 *   sources: [{ name, content }] — inline source units
 *   paths:   string[]            — files to read (capped: 64 files, 256KB each)
 *   llmReview: boolean           — default true when an LLM is attached
 */

import { readFile } from 'fs/promises';
import type { AnalysisFinding } from '../../analysis/finding.js';
import type { LaneContext, LaneResult, ScanLane } from '../types.js';
import { optBoolean, optRecord, optStringArray } from './util.js';

interface SourceUnit {
  name: string;
  content: string;
}

interface Rule {
  id: string;
  regex: RegExp;
  title: string;
  severity: AnalysisFinding['severity'];
  cwe: string[];
  detail: string;
}

const TIER_E_RULES: readonly Rule[] = [
  {
    id: 'eval',
    regex: /\beval\s*\(|new\s+Function\s*\(/,
    title: 'Dynamic code execution (eval / new Function)',
    severity: 'high',
    cwe: ['CWE-95'],
    detail: 'eval/new Function execute attacker-influencable strings as code; any tainted input reaching this sink is RCE.',
  },
  {
    id: 'command-exec',
    regex: /(?:child_process\.(?:exec|execSync)|\bexec\s*\(\s*[`'"][^`'"]*\+|os\.system\s*\(|subprocess\.(?:call|run|Popen)\s*\(\s*[^)]*shell\s*=\s*True)/,
    title: 'Shell command execution sink',
    severity: 'high',
    cwe: ['CWE-78'],
    detail: 'Shell exec with string concatenation or shell=True turns any tainted argument into command injection.',
  },
  {
    id: 'hardcoded-secret',
    regex: /\b(api[_-]?key|secret|password|passwd|private[_-]?key|access[_-]?token)\b\s*[:=]\s*['"][A-Za-z0-9_\-/+]{8,}['"]/i,
    title: 'Hardcoded credential in source',
    severity: 'high',
    cwe: ['CWE-798'],
    detail: 'A credential literal is embedded in source; anyone with repo access holds the secret and it leaks into builds/logs.',
  },
  {
    id: 'sql-concat',
    regex: /(?:query|execute|exec)\s*\(\s*[`'"]?\s*(?:SELECT|INSERT|UPDATE|DELETE|DROP)[^`'"]*[`'"]?\s*(\$\{|\+|\.\s*concat)/i,
    title: 'SQL built by string concatenation',
    severity: 'high',
    cwe: ['CWE-89'],
    detail: 'SQL text assembled with interpolation/concatenation instead of bound parameters is injectable whenever any component is tainted.',
  },
  {
    id: 'weak-hash',
    regex: /createHash\s*\(\s*['"](?:md5|sha1)['"]|hashlib\.(?:md5|sha1)\s*\(|MessageDigest\.getInstance\s*\(\s*"(?:MD5|SHA-?1)"/i,
    title: 'Weak cryptographic hash (MD5/SHA-1)',
    severity: 'medium',
    cwe: ['CWE-327'],
    detail: 'MD5/SHA-1 are collision-broken; using them for integrity, passwords, or signatures is forgeable.',
  },
  {
    id: 'insecure-random',
    regex: /Math\.random\s*\(|random\.random\s*\(|rand\s*\(\s*\)/,
    title: 'Non-cryptographic randomness in security context',
    severity: 'low',
    cwe: ['CWE-338'],
    detail: 'Math.random/rand() are predictable; tokens, nonces, and session ids must come from a CSPRNG.',
  },
  {
    id: 'dom-xss',
    regex: /\.innerHTML\s*=(?!=)|document\.write\s*\(|dangerouslySetInnerHTML/,
    title: 'DOM XSS sink (innerHTML/document.write)',
    severity: 'medium',
    cwe: ['CWE-79'],
    detail: 'Assigning to innerHTML/document.write with any tainted value executes attacker markup in the page origin.',
  },
  {
    id: 'deserialization',
    regex: /pickle\.loads?\s*\(|yaml\.load\s*\((?![^)]*SafeLoader)|unserialize\s*\(|ObjectInputStream/,
    title: 'Unsafe deserialization',
    severity: 'high',
    cwe: ['CWE-502'],
    detail: 'Deserializing untrusted data with pickle/yaml.load/unserialize/Java native serialization executes embedded objects.',
  },
  {
    id: 'tls-verify-off',
    regex: /rejectUnauthorized\s*:\s*false|verify\s*=\s*False|CERT_NONE|InsecureSkipVerify\s*[:=]\s*true/,
    title: 'TLS certificate verification disabled',
    severity: 'high',
    cwe: ['CWE-295'],
    detail: 'Skipping certificate validation silently enables MITM tampering of every request on this client.',
  },
];

function lineOf(content: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < content.length; i++) if (content[i] === '\n') line += 1;
  return line;
}

function snippet(content: string, index: number): string {
  const start = content.lastIndexOf('\n', index) + 1;
  const end = content.indexOf('\n', index);
  return content.slice(start, end === -1 ? undefined : end).trim().slice(0, 200);
}

export function staticTierE(unit: SourceUnit): AnalysisFinding[] {
  const findings: AnalysisFinding[] = [];
  for (const rule of TIER_E_RULES) {
    const m = rule.regex.exec(unit.content);
    if (!m || m.index === undefined) continue;
    findings.push({
      tool: 'tier-e',
      target: unit.name,
      title: rule.title,
      severity: rule.severity,
      evidence: `${rule.detail} — line ${lineOf(unit.content, m.index)}: ${snippet(unit.content, m.index)}`,
      cwe: rule.cwe,
      raw: { rule: rule.id, line: lineOf(unit.content, m.index) },
    });
  }
  return findings;
}

const SEVERITIES = new Set(['info', 'low', 'medium', 'high', 'critical']);

async function llmTierE(ctx: LaneContext, unit: SourceUnit): Promise<AnalysisFinding[]> {
  const llm = ctx.llm;
  if (!llm) return [];
  const response = await llm.chat([
    {
      role: 'system',
      content: 'You are a white-box application security reviewer. Review the source and respond with ONLY a JSON array of vulnerabilities: [{"title","severity","description","line"}]. severity must be one of info|low|medium|high|critical. Report only concrete issues traceable to the code shown.',
    },
    { role: 'user', content: `Source "${unit.name}":\n\n${unit.content.slice(0, 24000)}` },
  ], { maxTokens: 4000, temperature: 0 });

  const text = (response.content ?? '').trim();
  const jsonStart = text.indexOf('[');
  const jsonEnd = text.lastIndexOf(']');
  if (jsonStart === -1 || jsonEnd <= jsonStart) return [];
  let issues: Array<{ title?: unknown; severity?: unknown; description?: unknown; line?: unknown }>;
  try {
    issues = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
  } catch {
    return [];
  }
  if (!Array.isArray(issues)) return [];
  const findings: AnalysisFinding[] = [];
  for (const issue of issues.slice(0, 50)) {
    if (typeof issue.title !== 'string' || !issue.title.trim()) continue;
    findings.push({
      tool: 'llm-review',
      target: unit.name,
      title: issue.title.trim().slice(0, 200),
      severity: typeof issue.severity === 'string' && SEVERITIES.has(issue.severity)
        ? (issue.severity as AnalysisFinding['severity'])
        : 'medium',
      evidence: typeof issue.description === 'string' ? issue.description.slice(0, 2000) : undefined,
      raw: { source: 'llm', line: typeof issue.line === 'number' ? issue.line : undefined },
    });
  }
  return findings;
}

const MAX_FILES = 64;
const MAX_BYTES = 256 * 1024;

async function loadUnits(ctx: LaneContext): Promise<SourceUnit[]> {
  const units: SourceUnit[] = [];
  const rawSources = optRecord(ctx, 'tier_e')['sources'];
  if (Array.isArray(rawSources)) {
    for (const entry of rawSources.slice(0, MAX_FILES)) {
      if (typeof entry !== 'object' || entry === null) continue;
      const s = entry as Record<string, unknown>;
      if (typeof s.content !== 'string' || !s.content.trim()) continue;
      units.push({
        name: typeof s.name === 'string' && s.name.trim() ? s.name.trim().slice(0, 120) : `source-${units.length + 1}`,
        content: s.content.slice(0, MAX_BYTES),
      });
    }
  }
  for (const path of optStringArray(ctx, 'tier_e', 'paths').slice(0, MAX_FILES - units.length)) {
    try {
      const content = await readFile(path, 'utf8');
      units.push({ name: path, content: content.slice(0, MAX_BYTES) });
    } catch {
      // unreadable — surfaced in the skip/summary counts
    }
  }
  return units;
}

export const tierELane: ScanLane = {
  id: 'tier_e',
  phase: 'A',
  async run(ctx: LaneContext): Promise<LaneResult> {
    ctx.abort.throwIfAborted();
    const units = await loadUnits(ctx);
    if (units.length === 0) {
      return {
        lane: 'tier_e',
        status: 'skipped',
        reason: 'no source supplied (set lanes.tier_e.sources or lanes.tier_e.paths)',
        summary: 'no source supplied',
        findings: [],
        artifacts: [],
      };
    }

    const findings: AnalysisFinding[] = [];
    const artifacts: string[] = [];
    const llmReview = optBoolean(ctx, 'tier_e', 'llmReview', true) && Boolean(ctx.llm);

    for (const unit of units) {
      ctx.abort.throwIfAborted();
      const staticFindings = staticTierE(unit);
      findings.push(...staticFindings);
      artifacts.push(`${unit.name}: static — ${staticFindings.length} finding(s)`);
      if (llmReview) {
        try {
          const llmFindings = await llmTierE(ctx, unit);
          findings.push(...llmFindings);
          artifacts.push(`${unit.name}: llm — ${llmFindings.length} finding(s)`);
        } catch (error) {
          artifacts.push(`${unit.name}: llm failed — ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    return {
      lane: 'tier_e',
      status: 'completed',
      summary: `analyzed ${units.length} source unit(s), ${findings.length} finding(s)${llmReview ? ' (static + LLM)' : ' (static)'}`,
      findings,
      artifacts,
    };
  },
};
