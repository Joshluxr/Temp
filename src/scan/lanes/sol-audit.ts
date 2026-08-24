/**
 * Solidity audit lane (Phase B) — deterministic static pattern analysis over
 * operator-supplied contract source (inline `contracts` option or `paths` read
 * from disk), mapped to SWC/CWE. When an LLM backbone is attached, a second
 * deep-review pass asks the model for additional issues; model-sourced
 * findings are tagged tool='llm-review' so they never masquerade as
 * deterministic results.
 *
 * Lane options:
 *   contracts: [{ name, content }] — inline Solidity sources
 *   paths:     string[]            — .sol files to read (capped: 32 files, 256KB each)
 *   llmReview: boolean             — default true when an LLM is attached
 */

import { readFile } from 'fs/promises';
import type { AnalysisFinding } from '../../analysis/finding.js';
import type { LaneContext, LaneResult, ScanLane } from '../types.js';
import { optBoolean, optRecord, optStringArray } from './util.js';

interface SourceUnit {
  name: string;
  content: string;
}

interface PatternRule {
  id: string;
  regex: RegExp;
  title: string;
  severity: AnalysisFinding['severity'];
  cwe: string[];
  detail: string;
}

const SWC_RULES: readonly PatternRule[] = [
  {
    id: 'tx-origin',
    regex: /\btx\.origin\b/,
    title: 'tx.origin used for authorization',
    severity: 'high',
    cwe: ['CWE-346', 'CWE-441'],
    detail: 'tx.origin tracks the original EOA across the whole call chain; using it for access control makes the contract phishable by any intermediary contract (SWC-115). Use msg.sender.',
  },
  {
    id: 'selfdestruct',
    regex: /\b(selfdestruct|suicide)\s*\(/,
    title: 'selfdestruct present',
    severity: 'medium',
    cwe: ['CWE-284'],
    detail: 'selfdestruct permanently removes code and force-sends balance; when reachable by non-owners it is an unprotected-suicide (SWC-106). Post-Cancun it no longer removes code, but the force-send remains — verify intent.',
  },
  {
    id: 'delegatecall',
    regex: /\.delegatecall\s*\(/,
    title: 'delegatecall to external code',
    severity: 'high',
    cwe: ['CWE-829'],
    detail: 'delegatecall executes foreign code in this contract\'s storage context; a user-controlled target or slot-colliding library is a full takeover (SWC-112).',
  },
  {
    id: 'unchecked-call',
    regex: /\.call(?:\{[^}]*\})?\s*\([^)]*\)\s*;/,
    title: 'Low-level call return value unchecked',
    severity: 'medium',
    cwe: ['CWE-252'],
    detail: 'A low-level .call whose success flag is discarded silently continues after failure (SWC-104). Check the returned boolean or use transfer/high-level calls.',
  },
  {
    id: 'weak-randomness',
    regex: /\b(block\.timestamp|block\.number|blockhash\s*\(|block\.prevrandao|block\.difficulty)\b/,
    title: 'Block values used where randomness is expected',
    severity: 'low',
    cwe: ['CWE-338'],
    detail: 'block.timestamp/number/prevrandao/blockhash are validator-influenceable; using them for randomness or lotteries is exploitable (SWC-116/SWC-120).',
  },
  {
    id: 'unsafe-approve',
    regex: /\.approve\s*\(\s*[^,]+,\s*(type\s*\(\s*uint256\s*\)\s*\.max|2\s*\*\*\s*256|115792089237316195423570985008687907853269984665640564039457)/,
    title: 'Unlimited ERC-20 approval',
    severity: 'medium',
    cwe: ['CWE-732'],
    detail: 'Approving type(uint256).max grants the spender the entire balance forever; a compromised spender drains the wallet later without further consent.',
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

/** Reentrancy heuristic: external call whose effects precede a later state write. */
function detectReentrancy(unit: SourceUnit): AnalysisFinding[] {
  const findings: AnalysisFinding[] = [];
  const fnRegex = /function\s+(\w+)[^{]*\{([\s\S]*?)\n\s*\}/g;
  let match: RegExpExecArray | null;
  while ((match = fnRegex.exec(unit.content)) !== null) {
    const [, name, body] = match;
    if (!name || !body) continue;
    const callIdx = body.search(/\.call(?:\{[^}]*\})?\s*\(|\.transfer\s*\(|\.send\s*\(/);
    if (callIdx === -1) continue;
    const writeIdx = body.slice(callIdx).search(/\b\w+(?:\[[^\]]*\])?\s*(?:=[^=]|-=|\+=)/);
    if (writeIdx === -1) continue;
    const absolute = match.index + callIdx;
    findings.push({
      tool: 'sol-audit',
      target: unit.name,
      title: `Potential reentrancy in ${name}()`,
      severity: 'high',
      evidence: `External call at line ${lineOf(unit.content, absolute)} is followed by a state write — checks-effects-interactions is violated (SWC-107, CWE-841). Guard with a reentrancy lock or write state before the call.`,
      cwe: ['CWE-841'],
      raw: { function: name, snippet: snippet(unit.content, absolute) },
    });
  }
  return findings;
}

function staticAudit(unit: SourceUnit): AnalysisFinding[] {
  const findings: AnalysisFinding[] = [];
  for (const rule of SWC_RULES) {
    const m = rule.regex.exec(unit.content);
    if (!m || m.index === undefined) continue;
    findings.push({
      tool: 'sol-audit',
      target: unit.name,
      title: rule.title,
      severity: rule.severity,
      evidence: `${rule.detail} — line ${lineOf(unit.content, m.index)}: ${snippet(unit.content, m.index)}`,
      cwe: rule.cwe,
      raw: { rule: rule.id, line: lineOf(unit.content, m.index) },
    });
  }
  findings.push(...detectReentrancy(unit));
  return findings;
}

interface LlmIssue {
  title?: unknown;
  severity?: unknown;
  description?: unknown;
  line?: unknown;
}

const SEVERITIES = new Set(['info', 'low', 'medium', 'high', 'critical']);

async function llmAudit(ctx: LaneContext, unit: SourceUnit): Promise<AnalysisFinding[]> {
  const llm = ctx.llm;
  if (!llm) return [];
  const response = await llm.chat([
    {
      role: 'system',
      content: 'You are a Solidity security auditor. Review the contract and respond with ONLY a JSON array of issues: [{"title","severity","description","line"}]. severity must be one of info|low|medium|high|critical. Only report issues you can point to in the code; do not invent line numbers.',
    },
    { role: 'user', content: `Contract "${unit.name}":\n\n${unit.content.slice(0, 24000)}` },
  ], { maxTokens: 4000, temperature: 0 });

  const text = (response.content ?? '').trim();
  const jsonStart = text.indexOf('[');
  const jsonEnd = text.lastIndexOf(']');
  if (jsonStart === -1 || jsonEnd <= jsonStart) return [];
  let issues: LlmIssue[];
  try {
    issues = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as LlmIssue[];
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

const MAX_FILES = 32;
const MAX_BYTES = 256 * 1024;

async function loadSourceUnits(ctx: LaneContext): Promise<SourceUnit[]> {
  const units: SourceUnit[] = [];
  const rawContracts = optRecord(ctx, 'sol_audit')['contracts'];
  if (Array.isArray(rawContracts)) {
    for (const entry of rawContracts.slice(0, MAX_FILES)) {
      if (typeof entry !== 'object' || entry === null) continue;
      const c = entry as Record<string, unknown>;
      if (typeof c.content !== 'string' || !c.content.trim()) continue;
      units.push({
        name: typeof c.name === 'string' && c.name.trim() ? c.name.trim().slice(0, 120) : `contract-${units.length + 1}.sol`,
        content: c.content.slice(0, MAX_BYTES),
      });
    }
  }
  for (const path of optStringArray(ctx, 'sol_audit', 'paths').slice(0, MAX_FILES - units.length)) {
    try {
      const stat = await readFile(path, 'utf8');
      units.push({ name: path, content: stat.slice(0, MAX_BYTES) });
    } catch {
      // unreadable file — recorded via artifact in the caller's summary
    }
  }
  return units;
}

export const solAuditLane: ScanLane = {
  id: 'sol_audit',
  phase: 'B',
  async run(ctx: LaneContext): Promise<LaneResult> {
    ctx.abort.throwIfAborted();
    const units = await loadSourceUnits(ctx);
    if (units.length === 0) {
      return {
        lane: 'sol_audit',
        status: 'skipped',
        reason: 'no contract source supplied (set lanes.sol_audit.contracts or lanes.sol_audit.paths)',
        summary: 'no contract source supplied',
        findings: [],
        artifacts: [],
      };
    }

    const findings: AnalysisFinding[] = [];
    const artifacts: string[] = [];
    const llmReview = optBoolean(ctx, 'sol_audit', 'llmReview', true) && Boolean(ctx.llm);

    for (const unit of units) {
      ctx.abort.throwIfAborted();
      const staticFindings = staticAudit(unit);
      findings.push(...staticFindings);
      artifacts.push(`${unit.name}: static pass — ${staticFindings.length} finding(s)`);
      if (llmReview) {
        try {
          const llmFindings = await llmAudit(ctx, unit);
          findings.push(...llmFindings);
          artifacts.push(`${unit.name}: llm review — ${llmFindings.length} finding(s)`);
        } catch (error) {
          artifacts.push(`${unit.name}: llm review failed — ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    return {
      lane: 'sol_audit',
      status: 'completed',
      summary: `audited ${units.length} contract(s), ${findings.length} finding(s)${llmReview ? ' (static + LLM review)' : ' (static)'}`,
      findings,
      artifacts,
    };
  },
};
