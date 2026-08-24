/**
 * Credential lane (Phase B) — token analysis, hash cracking, and credential
 * spraying through the Arsenal credential tools.
 *
 * Lane options:
 *   tokens:   string[] — JWTs/tokens to decode and assess (jwt_decode)
 *   hashes:   [{ hash, type? }] — hashes to attempt against wordlists (hash_crack)
 *   spray:    { url, usernames: string[], passwords: string[],
 *               usernameField?, passwordField?, maxAttempts? } — password_spray
 *
 * All inputs are operator-supplied; nothing here guesses at targets.
 */

import type { AnalysisFinding } from '../../analysis/finding.js';
import type { LaneContext, LaneResult, ScanLane } from '../types.js';
import { optRecord, runTool, targetUrls } from './util.js';

interface SpraySpec {
  url: string;
  usernames: string[];
  passwords: string[];
  usernameField?: string;
  passwordField?: string;
  maxAttempts: number;
}

function spraySpec(ctx: LaneContext): SpraySpec | null {
  const raw = optRecord(ctx, 'credential')['spray'];
  if (typeof raw !== 'object' || raw === null) return null;
  const s = raw as Record<string, unknown>;
  const url = typeof s.url === 'string' && /^https?:\/\//i.test(s.url) ? s.url : targetUrls(ctx)[0];
  const usernames = Array.isArray(s.usernames) ? s.usernames.filter((u): u is string => typeof u === 'string' && u.trim().length > 0) : [];
  const passwords = Array.isArray(s.passwords) ? s.passwords.filter((p): p is string => typeof p === 'string' && p.length > 0) : [];
  if (!url || usernames.length === 0 || passwords.length === 0) return null;
  return {
    url,
    usernames: usernames.slice(0, 50),
    passwords: passwords.slice(0, 50),
    usernameField: typeof s.usernameField === 'string' && s.usernameField.trim() ? s.usernameField.trim() : undefined,
    passwordField: typeof s.passwordField === 'string' && s.passwordField.trim() ? s.passwordField.trim() : undefined,
    maxAttempts: typeof s.maxAttempts === 'number' && s.maxAttempts > 0 ? Math.min(Math.floor(s.maxAttempts), 200) : 50,
  };
}

export const credentialLane: ScanLane = {
  id: 'credential',
  phase: 'B',
  async run(ctx: LaneContext): Promise<LaneResult> {
    ctx.abort.throwIfAborted();
    const opts = optRecord(ctx, 'credential');
    const tokens = Array.isArray(opts['tokens'])
      ? (opts['tokens'] as unknown[]).filter((t): t is string => typeof t === 'string' && t.trim().length > 0).slice(0, 50)
      : [];
    const hashes: { hash: string; type?: string }[] = Array.isArray(opts['hashes'])
      ? (opts['hashes'] as unknown[]).flatMap((h): { hash: string; type?: string }[] => {
          if (typeof h === 'string' && h.trim()) return [{ hash: h.trim() }];
          if (typeof h === 'object' && h !== null && typeof (h as Record<string, unknown>).hash === 'string') {
            const rec = h as Record<string, unknown>;
            return [{ hash: String(rec.hash), type: typeof rec.type === 'string' ? rec.type : undefined }];
          }
          return [];
        }).slice(0, 50)
      : [];
    const spray = spraySpec(ctx);

    if (tokens.length === 0 && hashes.length === 0 && !spray) {
      return {
        lane: 'credential',
        status: 'skipped',
        reason: 'no tokens, hashes, or spray configuration supplied (lanes.credential.{tokens,hashes,spray})',
        summary: 'no credential material supplied',
        findings: [],
        artifacts: [],
      };
    }

    const findings: AnalysisFinding[] = [];
    const artifacts: string[] = [];
    let ran = 0;

    for (const token of tokens) {
      ctx.abort.throwIfAborted();
      const r = await runTool(ctx, 'jwt_decode', { token }, 'operator-supplied token');
      if (!r.available) { artifacts.push('jwt_decode not registered'); break; }
      ran += 1;
      findings.push(...r.findings);
      if (r.error) artifacts.push(`jwt_decode: ${r.error}`);
    }

    for (const { hash, type } of hashes) {
      ctx.abort.throwIfAborted();
      const parameters: Record<string, unknown> = { hash };
      if (type) parameters.type = type;
      const r = await runTool(ctx, 'hash_crack', parameters, 'operator-supplied hash');
      if (!r.available) { artifacts.push('hash_crack not registered'); break; }
      ran += 1;
      findings.push(...r.findings);
      if (r.error) artifacts.push(`hash_crack: ${r.error}`);
    }

    if (spray) {
      let attempts = 0;
      outer: for (const username of spray.usernames) {
        for (const password of spray.passwords) {
          if (attempts >= spray.maxAttempts) break outer;
          ctx.abort.throwIfAborted();
          attempts += 1;
          const parameters: Record<string, unknown> = { url: spray.url, username, password };
          if (spray.usernameField) parameters.username_field = spray.usernameField;
          if (spray.passwordField) parameters.password_field = spray.passwordField;
          const r = await runTool(ctx, 'password_spray', parameters, spray.url);
          if (!r.available) { artifacts.push('password_spray not registered'); break outer; }
          ran += 1;
          findings.push(...r.findings);
          if (r.error) artifacts.push(`password_spray ${username}: ${r.error}`);
        }
      }
      artifacts.push(`password_spray: ${attempts} attempt(s) against ${spray.url}`);
    }

    return {
      lane: 'credential',
      status: 'completed',
      summary: `credential material processed: ${tokens.length} token(s), ${hashes.length} hash(es)${spray ? `, spray against ${spray.url}` : ''} — ${findings.length} finding(s)`,
      findings,
      artifacts,
    };
  },
};
