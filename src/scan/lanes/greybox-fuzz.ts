/**
 * Greybox fuzz lane (Phase C) — differential mutation fuzzing of a target
 * parameter through the Arsenal HTTP primitive. A baseline request establishes
 * the normal response; each mutation is classified by delta:
 *   - 5xx on mutated input when baseline is healthy → crash-class finding
 *   - stack-trace / SQL-error leakage in the body → information disclosure
 *   - unencoded reflection of the mutation → injection-class signal
 *
 * Lane options:
 *   url:         target URL (defaults to the first profile URL)
 *   param:       query parameter to mutate (default 'q')
 *   method:      GET (default) or POST (body becomes param=value)
 *   corpus:      extra operator seed values appended to the builtin mutations
 *   maxRequests: hard cap on mutated requests (default 40, max 200)
 */

import type { AnalysisFinding } from '../../analysis/finding.js';
import type { LaneContext, LaneResult } from '../types.js';
import { optNumber, optString, optStringArray, runTool, targetUrls } from './util.js';

interface Mutation {
  name: string;
  value: string;
}

const BUILTIN_MUTATIONS: readonly Mutation[] = [
  { name: 'single-quote', value: "'" },
  { name: 'double-quote', value: '"' },
  { name: 'script-tag', value: '<script>alert(1)</script>' },
  { name: 'template', value: '{{7*7}}' },
  { name: 'path-traversal', value: '../../../../../../etc/passwd' },
  { name: 'null-byte', value: '%00' },
  { name: 'oversize', value: 'A'.repeat(8192) },
  { name: 'neg-int', value: '-1' },
  { name: 'int-overflow', value: '2147483648' },
  { name: 'hex', value: '0x10' },
  { name: 'array-type', value: '[]' },
  { name: 'nosql-operator', value: '{"$gt":""}' },
  { name: 'format-string', value: '%s%s%s%n' },
  { name: 'unicode', value: '‮test' },
  { name: 'sqli-tautology', value: "' OR '1'='1" },
];

const ERROR_LEAK_PATTERNS: readonly { regex: RegExp; label: string }[] = [
  { regex: /Traceback \(most recent call last\)/, label: 'Python traceback' },
  { regex: /at [\w$.]+\([\w/.-]+:\d+:\d+\)/, label: 'Node.js stack frame' },
  { regex: /NullPointerException|IllegalArgumentException/, label: 'Java exception' },
  { regex: /SQL syntax.*MySQL|ORA-\d{5}|PostgreSQL.*ERROR|SQLite3?::|Unclosed quotation mark/, label: 'SQL error' },
  { regex: /Warning: \w+\(\) expects|Fatal error:.*in \//, label: 'PHP error' },
];

interface Observed {
  status: number;
  body: string;
  ok: boolean;
}

function parseObserved(output: string | undefined): Observed | null {
  if (!output) return null;
  const statusMatch = output.match(/\b([1-5]\d\d)\b/);
  const status = statusMatch?.[1] ? Number.parseInt(statusMatch[1], 10) : 0;
  return { status, body: output, ok: status > 0 && status < 400 };
}

function withParam(url: string, param: string, value: string): string | null {
  try {
    const u = new URL(url);
    u.searchParams.set(param, value);
    return u.toString();
  } catch {
    return null;
  }
}

export async function classifyMutation(
  baseline: Observed,
  mutated: Observed,
  mutation: Mutation,
  url: string,
  param: string,
): Promise<AnalysisFinding[]> {
  const findings: AnalysisFinding[] = [];
  const reflectsRaw = mutation.value.length > 0
    && mutation.value.length <= 64
    && mutated.body.includes(mutation.value);

  if (baseline.ok && mutated.status >= 500) {
    findings.push({
      tool: 'greybox-fuzz',
      target: url,
      title: `Server error on mutated input (${mutation.name})`,
      severity: 'high',
      evidence: `Baseline ${param}=normal returned ${baseline.status}; ${param}=${JSON.stringify(mutation.value.slice(0, 80))} returned ${mutated.status}. Unhandled exception on attacker-controlled input (CWE-20/CWE-248).`,
      cwe: ['CWE-20', 'CWE-248'],
      raw: { mutation: mutation.name, baselineStatus: baseline.status, mutatedStatus: mutated.status },
    });
  }

  for (const { regex, label } of ERROR_LEAK_PATTERNS) {
    if (regex.test(mutated.body) && !regex.test(baseline.body)) {
      findings.push({
        tool: 'greybox-fuzz',
        target: url,
        title: `Error-message information disclosure (${label})`,
        severity: 'medium',
        evidence: `Mutation "${mutation.name}" triggered a ${label} in the response body. Stack traces and SQL errors leak internals useful for exploit development (CWE-209).`,
        cwe: ['CWE-209'],
        raw: { mutation: mutation.name, leak: label },
      });
      break;
    }
  }

  if (reflectsRaw && /<|>|'|"|\{\{/.test(mutation.value)) {
    findings.push({
      tool: 'greybox-fuzz',
      target: url,
      title: `Unencoded reflection of mutated ${param}`,
      severity: 'medium',
      evidence: `The mutation "${mutation.name}" is reflected verbatim in the response. Combined with content-type confusion this is an injection-class signal (CWE-79/CWE-94); the DAST lane confirms exploitability.`,
      cwe: ['CWE-79'],
      raw: { mutation: mutation.name },
    });
  }

  return findings;
}

export const greyboxFuzzLane: import('../types.js').ScanLane = {
  id: 'greybox_fuzz',
  phase: 'C',
  async run(ctx: LaneContext): Promise<LaneResult> {
    ctx.abort.throwIfAborted();
    const url = optString(ctx, 'greybox_fuzz', 'url') ?? targetUrls(ctx)[0];
    if (!url) {
      return { lane: 'greybox_fuzz', status: 'skipped', reason: 'no target URL', summary: 'no target URL', findings: [], artifacts: [] };
    }
    const param = optString(ctx, 'greybox_fuzz', 'param') ?? 'q';
    const method = (optString(ctx, 'greybox_fuzz', 'method') ?? 'GET').toUpperCase();
    const maxRequests = Math.min(optNumber(ctx, 'greybox_fuzz', 'maxRequests', 40), 200);
    const corpus = optStringArray(ctx, 'greybox_fuzz', 'corpus');
    const mutations: Mutation[] = [
      ...BUILTIN_MUTATIONS,
      ...corpus.map((value, i) => ({ name: `corpus-${i + 1}`, value })),
    ].slice(0, maxRequests);

    const findings: AnalysisFinding[] = [];
    const artifacts: string[] = [];

    const baselineUrl = method === 'GET' ? withParam(url, param, 'normal') : url;
    if (!baselineUrl) {
      return { lane: 'greybox_fuzz', status: 'failed', reason: `unparseable target url: ${url}`, summary: 'invalid url', findings: [], artifacts: [] };
    }
    const baselineResult = await runTool(ctx, 'http_request',
      method === 'GET'
        ? { url: baselineUrl, method: 'GET' }
        : { url, method: 'POST', body: `${param}=normal` },
      url);
    if (!baselineResult.available) {
      return { lane: 'greybox_fuzz', status: 'skipped', reason: 'http_request tool not registered', summary: 'http_request unavailable', findings: [], artifacts: [] };
    }
    const baseline = parseObserved(baselineResult.output);
    if (!baseline || baseline.status === 0) {
      return { lane: 'greybox_fuzz', status: 'failed', reason: 'baseline request failed', summary: 'baseline request failed', findings: [], artifacts: [baselineResult.error ?? 'baseline failed'] };
    }
    artifacts.push(`baseline: ${baseline.status}`);

    let sent = 0;
    for (const mutation of mutations) {
      ctx.abort.throwIfAborted();
      const mutatedUrl = method === 'GET' ? withParam(url, param, mutation.value) : url;
      if (!mutatedUrl) continue;
      const r = await runTool(ctx, 'http_request',
        method === 'GET'
          ? { url: mutatedUrl, method: 'GET' }
          : { url, method: 'POST', body: `${param}=${encodeURIComponent(mutation.value)}` },
        url);
      sent += 1;
      const observed = parseObserved(r.output);
      if (!observed) continue;
      findings.push(...await classifyMutation(baseline, observed, mutation, url, param));
    }
    artifacts.push(`mutations sent: ${sent}`);

    return {
      lane: 'greybox_fuzz',
      status: 'completed',
      summary: `fuzzed ${url} param "${param}" with ${sent} mutation(s) — ${findings.length} finding(s)`,
      findings,
      artifacts,
    };
  },
};
