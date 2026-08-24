/**
 * Lane-level real-logic tests — every scan lane executes its true code path
 * against stub Arsenal tools / local HTTP servers, and asserts on the actual
 * findings and artifacts produced. No smoke tests: each test would fail if
 * the lane's logic regressed.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { createServer, type Server } from 'http';
import type { AddressInfo } from 'net';
import { Arsenal } from '../arsenal/index.js';
import { EvidenceVault } from '../evidence/index.js';
import type { CustomTool, ToolResult } from '../types/index.js';
import type { LLMBackbone } from '../llm/index.js';
import { createScanAbortController } from '../scan/abort.js';
import type { LaneContext, ScanProfile } from '../scan/types.js';
import {
  optString, optStringArray, optNumber, optBoolean, optRecord, laneScope,
} from '../scan/lanes/util.js';
import { tierELane } from '../scan/lanes/tier-e.js';
import { solAuditLane } from '../scan/lanes/sol-audit.js';
import { chainSimLane, simulateChain } from '../scan/lanes/chain-sim.js';
import { greyboxFuzzLane, classifyMutation } from '../scan/lanes/greybox-fuzz.js';
import { browserDastLane } from '../scan/lanes/browser-dast.js';
import { credentialLane } from '../scan/lanes/credential.js';
import { apiFuzzLane } from '../scan/lanes/api-fuzz.js';
import { protocolTestsLane } from '../scan/lanes/protocol-tests.js';
import { authzMatrixLane } from '../scan/lanes/authz-matrix.js';
import { flowAttacksLane } from '../scan/lanes/flow-attacks.js';
import { reportLane, renderMarkdownReport } from '../scan/lanes/report.js';
import { integrationsLane } from '../scan/lanes/integrations.js';
import { KillChainPhase } from '../types/index.js';

function profile(overrides: Partial<ScanProfile> = {}): ScanProfile {
  return {
    target: { urls: ['https://app.example.test'], hosts: ['app.example.test'] },
    lanes: {},
    ...overrides,
  };
}

function stubTool(name: string, handler: CustomTool['handler']): CustomTool {
  return { name, description: `stub ${name}`, category: 'recon', parameters: [], handler };
}

function makeCtx(p: ScanProfile, opts: { arsenal?: Arsenal; llm?: unknown; dir: string }): LaneContext {
  return {
    jobId: 'test-job',
    profile: p,
    arsenal: opts.arsenal ?? new Arsenal(),
    vault: new EvidenceVault(),
    llm: opts.llm as LLMBackbone | undefined,
    abort: createScanAbortController(),
    deliverablesDir: opts.dir,
    findings: [],
    emit: () => {},
  };
}

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 't3-lane-test-'));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('lane option helpers', () => {
  it('reads typed options from profile.lanes ctx-first', () => {
    const ctx = makeCtx(profile({
      lanes: {
        api_fuzz: { enabled: true, maxEndpoints: 7, tools: ['xss_scan'], note: ' hi ', flag: false },
      },
    }), { dir });
    expect(optNumber(ctx, 'api_fuzz', 'maxEndpoints', 10)).toBe(7);
    expect(optNumber(ctx, 'api_fuzz', 'missing', 10)).toBe(10);
    expect(optStringArray(ctx, 'api_fuzz', 'tools')).toEqual(['xss_scan']);
    expect(optString(ctx, 'api_fuzz', 'note')).toBe('hi');
    expect(optString(ctx, 'api_fuzz', 'missing')).toBeUndefined();
    expect(optString(ctx, 'api_fuzz', 'missing', 'fallback')).toBe('fallback');
    expect(optBoolean(ctx, 'api_fuzz', 'flag', true)).toBe(false);
    expect(optBoolean(ctx, 'api_fuzz', 'missing', true)).toBe(true);
    expect(optRecord(ctx, 'api_fuzz')['maxEndpoints']).toBe(7);
    expect(optRecord(ctx, 'credential')).toEqual({});
  });

  it('derives a fail-closed scope from the profile targets', () => {
    const ctx = makeCtx(profile({ target: { urls: ['https://app.example.test'], hosts: ['10.0.0.4'] } }), { dir });
    const scope = laneScope(ctx);
    expect(scope.allowedHosts).toContain('app.example.test');
    expect(scope.allowedHosts).toContain('10.0.0.4');
    expect(scope.allowPrivate).toBe(true);

    const publicOnly = makeCtx(profile(), { dir });
    expect(laneScope(publicOnly).allowPrivate).toBe(false);
    expect(laneScope(publicOnly).allowLoopback).toBe(false);
  });
});

describe('tier-e lane', () => {
  it('skips honestly when no source is supplied', async () => {
    const result = await tierELane.run(makeCtx(profile({ lanes: { tier_e: { enabled: true } } }), { dir }));
    expect(result.status).toBe('skipped');
    expect(result.reason).toMatch(/no source supplied/);
  });

  it('flags deterministic CWE-mapped patterns in operator source', async () => {
    const source = `
      const password = "hunter2hunter2";
      eval(userInput);
      db.query("SELECT * FROM users WHERE id = " + req.params.id);
      crypto.createHash("md5");
    `;
    const ctx = makeCtx(profile({
      lanes: { tier_e: { enabled: true, sources: [{ name: 'app.js', content: source }] } },
    }), { dir });
    const result = await tierELane.run(ctx);
    expect(result.status).toBe('completed');
    expect(result.findings.length).toBeGreaterThanOrEqual(4);
    expect(result.findings.every((f) => f.cwe && f.cwe.length > 0)).toBe(true);
    const titles = result.findings.map((f) => f.title);
    expect(titles).toContain('Dynamic code execution (eval / new Function)');
    expect(titles).toContain('Hardcoded credential in source');
    expect(titles).toContain('SQL built by string concatenation');
    expect(titles).toContain('Weak cryptographic hash (MD5/SHA-1)');
  });

  it('tags LLM-pass findings as llm-review so they never masquerade as static', async () => {
    const llm = {
      chat: async () => ({
        content: JSON.stringify([{ title: 'Prototype pollution risk', severity: 'high', description: 'merge() copies __proto__', line: 4 }]),
      }),
    };
    const ctx = makeCtx(profile({
      lanes: { tier_e: { enabled: true, sources: [{ name: 'lib.js', content: 'function merge(a,b){return Object.assign(a,b)}' }], llmReview: true } },
    }), { dir, llm });
    const result = await tierELane.run(ctx);
    const llmFindings = result.findings.filter((f) => f.tool === 'llm-review');
    expect(llmFindings).toHaveLength(1);
    expect(llmFindings[0]?.title).toBe('Prototype pollution risk');
    expect(llmFindings[0]?.severity).toBe('high');
  });
});

describe('sol-audit lane', () => {
  const VULNERABLE = `
    contract Vault {
      mapping(address => uint) balances;
      function withdraw() public {
        require(tx.origin == msg.sender);
        (bool ok, ) = msg.sender.call{value: balances[msg.sender]}("");
        balances[msg.sender] = 0;
      }
      function kill() public { selfdestruct(payable(msg.sender)); }
    }
  `;

  it('detects SWC-mapped patterns and reentrancy ordering', async () => {
    const ctx = makeCtx(profile({
      lanes: { sol_audit: { enabled: true, contracts: [{ name: 'Vault.sol', content: VULNERABLE }], llmReview: false } },
    }), { dir });
    const result = await solAuditLane.run(ctx);
    expect(result.status).toBe('completed');
    const titles = result.findings.map((f) => f.title).join('\n');
    expect(titles).toMatch(/tx\.origin/);
    expect(titles).toMatch(/selfdestruct/);
    expect(titles).toMatch(/reentrancy/i);
    const reentrancy = result.findings.find((f) => /reentrancy/i.test(f.title));
    expect(reentrancy?.severity).toBe('high');
    expect(reentrancy?.cwe).toContain('CWE-841');
  });

  it('skips when no contract source is supplied', async () => {
    const result = await solAuditLane.run(makeCtx(profile({ lanes: { sol_audit: { enabled: true } } }), { dir }));
    expect(result.status).toBe('skipped');
    expect(result.reason).toMatch(/no contract source/);
  });
});

describe('chain-sim lane', () => {
  it('flags overspend, unlimited approval, allowance breach, unauthorized mint, and burn underflow', () => {
    const { findings, state } = simulateChain({ alice: 100 }, [
      { kind: 'transfer', from: 'alice', to: 'bob', amount: 150, authorized: true },
      { kind: 'approve', from: 'alice', spender: 'dex', amount: 2 ** 256 - 1, authorized: true },
      { kind: 'approve', from: 'alice', spender: 'mallory', amount: 50, authorized: true },
      { kind: 'transferFrom', from: 'mallory', to: 'alice', amount: 999, authorized: true },
      { kind: 'transferFrom', from: 'dex', to: 'alice', amount: 40, authorized: true },
      { kind: 'mint', from: 'attacker', to: 'attacker', amount: 1000, authorized: false },
      { kind: 'burn', from: 'carol', amount: 5, authorized: true },
    ]);
    const titles = findings.map((f) => f.title).join('\n');
    expect(titles).toMatch(/overspend\/underflow/i);
    expect(titles).toMatch(/Unlimited approval/);
    expect(titles).toMatch(/exceeds allowance/i);
    expect(titles).toMatch(/Unauthorized mint/);
    expect(titles).toMatch(/Burn exceeds balance/);
    expect(findings.find((f) => /Unauthorized mint/.test(f.title))?.severity).toBe('critical');
    // The failed transfer did not move funds; the successful transferFrom moved 40.
    expect(state.balances.get('alice')).toBe(60);
    expect(state.balances.get('dex')).toBe(40);
  });

  it('lane persists final chain state and skips without operations', async () => {
    const skip = await chainSimLane.run(makeCtx(profile({ lanes: { chain_sim: { enabled: true } } }), { dir }));
    expect(skip.status).toBe('skipped');

    const ctx = makeCtx(profile({
      lanes: {
        chain_sim: {
          enabled: true,
          initialBalances: { alice: 10 },
          operations: [{ kind: 'transfer', from: 'alice', to: 'bob', amount: 4 }],
        },
      },
    }), { dir });
    const result = await chainSimLane.run(ctx);
    expect(result.status).toBe('completed');
    const persisted = JSON.parse(await readFile(join(dir, 'chain-state.json'), 'utf8'));
    expect(persisted.finalBalances.bob).toBe(4);
    expect(persisted.finalBalances.alice).toBe(6);
  });
});

describe('greybox-fuzz lane', () => {
  it('classifies 5xx deltas, error leakage, and raw reflection', async () => {
    const baseline = { status: 200, body: 'ok', ok: true };

    const crash = await classifyMutation(baseline, { status: 500, body: 'boom', ok: false }, { name: 'single-quote', value: "'" }, 'https://t', 'q');
    expect(crash.some((f) => /Server error/.test(f.title) && f.severity === 'high')).toBe(true);

    const leak = await classifyMutation(baseline, { status: 200, body: 'Traceback (most recent call last): ...', ok: true }, { name: 'path-traversal', value: '../etc/passwd' }, 'https://t', 'q');
    expect(leak.some((f) => /information disclosure/i.test(f.title))).toBe(true);

    const reflect = await classifyMutation(baseline, { status: 200, body: 'you said <script>alert(1)</script>', ok: true }, { name: 'script-tag', value: '<script>alert(1)</script>' }, 'https://t', 'q');
    expect(reflect.some((f) => /reflection/i.test(f.title))).toBe(true);

    const clean = await classifyMutation(baseline, { status: 200, body: 'ok', ok: true }, { name: 'neg-int', value: '-1' }, 'https://t', 'q');
    expect(clean).toHaveLength(0);
  });

  it('lane drives baseline + mutations through the Arsenal HTTP primitive', async () => {
    const arsenal = new Arsenal();
    const seen: string[] = [];
    arsenal.register(stubTool('http_request', async (c): Promise<ToolResult> => {
      const url = String(c.parameters.url);
      seen.push(url);
      const crashed = url.includes('%27') || url.includes("q='");
      return { success: true, output: `${crashed ? 500 : 200} body` };
    }));
    const ctx = makeCtx(profile({
      target: { urls: ['https://app.example.test/search'], hosts: [] },
      lanes: { greybox_fuzz: { enabled: true, param: 'q', maxRequests: 15 } },
    }), { dir, arsenal });
    const result = await greyboxFuzzLane.run(ctx);
    expect(result.status).toBe('completed');
    expect(seen.length).toBeGreaterThan(2);
    expect(result.findings.some((f) => /Server error on mutated input/.test(f.title))).toBe(true);
  });
});

describe('browser-dast lane', () => {
  it('skips honestly when the Arsenal has no DAST tools registered', async () => {
    const result = await browserDastLane.run(makeCtx(profile({ lanes: { browser_dast: { enabled: true } } }), { dir }));
    expect(result.status).toBe('skipped');
    expect(result.reason).toMatch(/no DAST tools/);
  });

  it('runs the default battery and collects tool findings', async () => {
    const arsenal = new Arsenal();
    arsenal.register(stubTool('header_analysis', async (): Promise<ToolResult> => ({
      success: true,
      output: 'missing headers',
      findings: [{ title: 'Missing X-Frame-Options', severity: 'medium', details: 'clickjacking exposure' }],
    })));
    arsenal.register(stubTool('cors_check', async (): Promise<ToolResult> => ({ success: true, output: 'cors ok' })));
    const ctx = makeCtx(profile({
      lanes: { browser_dast: { enabled: true, tools: ['header_analysis', 'cors_check'] } },
    }), { dir, arsenal });
    const result = await browserDastLane.run(ctx);
    expect(result.status).toBe('completed');
    expect(result.summary).toMatch(/2 tool run/);
    expect(result.findings.map((f) => f.title)).toContain('Missing X-Frame-Options');
    expect(result.findings[0]?.severity).toBe('medium');
  });
});

describe('credential lane', () => {
  it('skips honestly without tokens, hashes, or spray config', async () => {
    const result = await credentialLane.run(makeCtx(profile({ lanes: { credential: { enabled: true } } }), { dir }));
    expect(result.status).toBe('skipped');
    expect(result.reason).toMatch(/no tokens, hashes, or spray/);
  });

  it('processes operator tokens/hashes and honors the spray attempt cap', async () => {
    const arsenal = new Arsenal();
    arsenal.register(stubTool('jwt_decode', async (): Promise<ToolResult> => ({
      success: true,
      output: 'alg none',
      findings: [{ title: 'JWT uses alg none', severity: 'critical', details: 'signature bypass' }],
    })));
    arsenal.register(stubTool('hash_crack', async (): Promise<ToolResult> => ({
      success: true,
      output: 'cracked: password123',
      findings: [{ title: 'Weak hash cracked', severity: 'high', details: 'md5' }],
    })));
    let sprayAttempts = 0;
    arsenal.register(stubTool('password_spray', async (): Promise<ToolResult> => {
      sprayAttempts += 1;
      return { success: true, output: 'denied' };
    }));

    const ctx = makeCtx(profile({
      lanes: {
        credential: {
          enabled: true,
          tokens: ['aaa.bbb.ccc'],
          hashes: [{ hash: '5f4dcc3b5aa765d61d8327deb882cf99', type: 'md5' }],
          spray: { url: 'https://app.example.test/login', usernames: ['u1', 'u2'], passwords: ['p1', 'p2', 'p3'], maxAttempts: 3 },
        },
      },
    }), { dir, arsenal });
    const result = await credentialLane.run(ctx);
    expect(result.status).toBe('completed');
    expect(result.findings.map((f) => f.title)).toContain('JWT uses alg none');
    expect(result.findings.map((f) => f.title)).toContain('Weak hash cracked');
    expect(sprayAttempts).toBe(3); // capped by maxAttempts, not 2×3=6
  });
});

describe('api-fuzz lane', () => {
  it('skips honestly when no endpoints exist', async () => {
    const ctx = makeCtx(profile({ target: { urls: [], hosts: [] }, lanes: { api_fuzz: { enabled: true } } }), { dir });
    const result = await apiFuzzLane.run(ctx);
    expect(result.status).toBe('skipped');
  });

  it('drives the injection battery at every endpoint param', async () => {
    const arsenal = new Arsenal();
    const calls: string[] = [];
    for (const tool of ['xss_scan', 'sqli_scan', 'lfi_test', 'ssti_test']) {
      arsenal.register(stubTool(tool, async (c): Promise<ToolResult> => {
        calls.push(`${tool}:${String(c.parameters.param ?? c.parameters.parameter)}`);
        if (tool === 'sqli_scan') {
          return { success: true, output: 'sqli', findings: [{ title: 'SQL injection', severity: 'critical', details: 'tautology' }] };
        }
        return { success: true, output: 'clean' };
      }));
    }
    const ctx = makeCtx(profile({
      lanes: {
        api_fuzz: {
          enabled: true,
          endpoints: [{ url: 'https://app.example.test/api/item', params: ['id', 'sort'] }],
        },
      },
    }), { dir, arsenal });
    const result = await apiFuzzLane.run(ctx);
    expect(result.status).toBe('completed');
    // 2 params × 4 tools = 8 runs
    expect(calls).toHaveLength(8);
    expect(calls).toContain('xss_scan:id');
    expect(calls).toContain('lfi_test:sort');
    expect(result.findings.filter((f) => f.title === 'SQL injection')).toHaveLength(2);
  });
});

describe('protocol-tests lane', () => {
  it('skips with no targets and runs the transport battery with stub tools', async () => {
    const noTargets = await protocolTestsLane.run(makeCtx(profile({ target: { urls: [], hosts: [] } }), { dir }));
    expect(noTargets.status).toBe('skipped');

    const arsenal = new Arsenal();
    const ran: string[] = [];
    for (const tool of ['ssl_scan', 'dns_lookup', 'whois_lookup', 'subdomain_takeover_check', 'http_methods_test', 'network_trace', 'cidr_expand']) {
      arsenal.register(stubTool(tool, async (): Promise<ToolResult> => {
        ran.push(tool);
        if (tool === 'ssl_scan') {
          return { success: true, output: 'tls', findings: [{ title: 'TLS 1.0 enabled', severity: 'medium', details: 'deprecated protocol' }] };
        }
        return { success: true, output: 'ok' };
      }));
    }
    const ctx = makeCtx(profile({
      target: { urls: ['https://app.example.test'], hosts: ['app.example.test', '203.0.113.0/30'] },
      lanes: { protocol_tests: { enabled: true } },
    }), { dir, arsenal });
    const result = await protocolTestsLane.run(ctx);
    expect(result.status).toBe('completed');
    expect(ran).toContain('ssl_scan');
    expect(ran).toContain('http_methods_test');
    expect(ran).toContain('cidr_expand'); // CIDR-shaped host picked up automatically
    expect(result.findings.map((f) => f.title)).toContain('TLS 1.0 enabled');
  });
});

describe('authz-matrix lane', () => {
  let server: Server | undefined;
  afterEach(async () => {
    if (server) await new Promise<void>((res, rej) => server!.close((e) => (e ? rej(e) : res())));
    server = undefined;
  });

  it('flags an endpoint that answers 200 to the anonymous identity', async () => {
    server = createServer((_req, res) => {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ admin: true, users: ['root'] }));
    });
    await new Promise<void>((res) => server!.listen(0, '127.0.0.1', res));
    const port = (server.address() as AddressInfo).port;
    const base = `http://127.0.0.1:${port}`;

    const ctx = makeCtx(profile({
      target: { urls: [base], hosts: ['127.0.0.1'] },
      lanes: {
        authz_matrix: {
          enabled: true,
          endpoints: [`${base}/admin`],
          identities: [{ name: 'admin', role: 'admin', cookie: 'session=admin' }],
        },
      },
    }), { dir });
    const result = await authzMatrixLane.run(ctx);
    expect(result.status).toBe('completed');
    expect(result.findings.some((f) => /Missing authentication/i.test(f.title))).toBe(true);
  });

  it('skips honestly without URL targets', async () => {
    const ctx = makeCtx(profile({ target: { urls: [], hosts: [] }, lanes: { authz_matrix: { enabled: true } } }), { dir });
    const result = await authzMatrixLane.run(ctx);
    expect(result.status).toBe('skipped');
  });
});

describe('flow-attacks lane', () => {
  let server: Server | undefined;
  afterEach(async () => {
    if (server) await new Promise<void>((res, rej) => server!.close((e) => (e ? rej(e) : res())));
    server = undefined;
  });

  it('skips honestly when no engine inputs are supplied', async () => {
    const ctx = makeCtx(profile({ target: { urls: [], hosts: [] }, lanes: { flow_attacks: { enabled: true } } }), { dir });
    const result = await flowAttacksLane.run(ctx);
    expect(result.status).toBe('skipped');
    expect(result.reason).toMatch(/no engine inputs/);
  });

  it('enum-spray flags enumerable object ids answered with 200s', async () => {
    server = createServer((req, res) => {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ id: req.url, secret: 'user-record' }));
    });
    await new Promise<void>((res) => server!.listen(0, '127.0.0.1', res));
    const port = (server.address() as AddressInfo).port;
    const base = `http://127.0.0.1:${port}`;

    const ctx = makeCtx(profile({
      target: { urls: [base], hosts: ['127.0.0.1'] },
      lanes: {
        flow_attacks: {
          enabled: true,
          accessUrlTemplate: `${base}/users/{id}`,
          enumRange: { from: 1, to: 4 },
        },
      },
    }), { dir });
    const result = await flowAttacksLane.run(ctx);
    expect(result.status).toBe('completed');
    expect(result.artifacts.join('\n')).toMatch(/enum-spray/);
    expect(result.findings.some((f) => /enumerable/i.test(f.title))).toBe(true);
  });
});

describe('report lane', () => {
  it('renders a severity-grouped Markdown report deterministically', () => {
    const md = renderMarkdownReport('job-1', 'engagement', [
      { tool: 't', target: 'https://a', title: 'B | bad', severity: 'high', cwe: ['CWE-79'] },
      { tool: 't', target: 'https://a', title: 'info note', severity: 'info' },
    ]);
    expect(md).toMatch(/# T3MP3ST Scan Report/);
    expect(md).toMatch(/## HIGH \(1\)/);
    expect(md).toMatch(/## INFO \(1\)/);
    expect(md).toContain('B \\| bad'); // pipes escaped so the table does not break
    expect(md.indexOf('## HIGH')).toBeLessThan(md.indexOf('## INFO'));
  });

  it('writes SARIF + Markdown deliverables from recorded findings', async () => {
    const ctx = makeCtx(profile({ lanes: { report: { enabled: true } } }), { dir });
    const result = await reportLane.run({
      ...ctx,
      findings: [{
        id: 'f1',
        title: 'x',
        description: 'test evidence',
        severity: 'low',
        targetId: 'https://a',
        operatorId: 'scan/test/recon',
        phase: KillChainPhase.EXPLOIT,
        evidence: [],
        discoveredAt: Date.now(),
      }] as LaneContext['findings'],
    });
    expect(result.status).toBe('completed');
    const sarif = JSON.parse(await readFile(join(dir, 'report.sarif.json'), 'utf8'));
    expect(sarif.version).toBe('2.1.0');
    const md = await readFile(join(dir, 'report.md'), 'utf8');
    expect(md).toMatch(/Findings: 1/);
  });
});

describe('integrations lane', () => {
  it('exports STIX 2.1, MISP, and ATT&CK Navigator artifacts', async () => {
    const ctx = makeCtx(profile({ lanes: { integrations: { enabled: true } } }), { dir });
    const result = await integrationsLane.run({
      ...ctx,
      findings: [{
        id: 'f1',
        title: 'Reflected XSS',
        description: 'Reflected XSS at https://a',
        severity: 'high',
        targetId: 'https://a',
        operatorId: 'scan/test/api_fuzz',
        phase: KillChainPhase.EXPLOIT,
        evidence: [{ type: 'output', content: 'Reflected XSS at https://a', timestamp: Date.now(), metadata: { tool: 'xss_scan' } }],
        discoveredAt: Date.now(),
      }] as LaneContext['findings'],
    });
    expect(result.status).toBe('completed');
    expect(result.artifacts).toHaveLength(3);

    const stix = JSON.parse(await readFile(join(dir, 'stix-bundle.json'), 'utf8'));
    expect(stix.type).toBe('bundle');
    expect(stix.spec_version ?? '2.1').toBe('2.1');
    expect(Array.isArray(stix.objects)).toBe(true);

    const misp = JSON.parse(await readFile(join(dir, 'misp-event.json'), 'utf8'));
    expect(misp.Event ?? misp.event).toBeTruthy();

    const navigator = JSON.parse(await readFile(join(dir, 'attack-navigator.json'), 'utf8'));
    expect(navigator.versions ?? navigator.domain).toBeTruthy();
    expect(navigator.domain).toMatch(/enterprise-attack/);
  });
});
