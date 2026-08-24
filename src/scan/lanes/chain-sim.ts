/**
 * Chain-simulation lane (Phase B) — deterministic lifecycle simulation of
 * on-chain operations against an operator-declared initial state. No network:
 * this replays the intended operation sequence and flags invariant violations
 * (overspend/underflow, unlimited approvals, double-spend races, unauthorized
 * mints) before any of it touches a live chain.
 *
 * Lane options:
 *   initialBalances: { "<account>": <number> }
 *   operations: [{ kind: 'transfer'|'approve'|'transferFrom'|'mint'|'burn',
 *                  from, to?, spender?, amount, authorized? }]
 *   The final simulated state is persisted as chain-state.json in the
 *   deliverables dir.
 */

import { writeFile } from 'fs/promises';
import { join } from 'path';
import type { AnalysisFinding } from '../../analysis/finding.js';
import type { LaneContext, LaneResult, ScanLane } from '../types.js';
import { optRecord } from './util.js';

type OpKind = 'transfer' | 'approve' | 'transferFrom' | 'mint' | 'burn';

interface ChainOp {
  kind: OpKind;
  from: string;
  to?: string;
  spender?: string;
  amount: number;
  authorized: boolean;
}

const UINT256_THRESHOLD = 2 ** 255;
const MAX_OPS = 1000;

interface SimState {
  balances: Map<string, number>;
  allowances: Map<string, number>;
}

function allowanceKey(owner: string, spender: string): string {
  return `${owner}::${spender}`;
}

function balanceOf(state: SimState, account: string): number {
  return state.balances.get(account) ?? 0;
}

function credit(state: SimState, account: string, amount: number): void {
  state.balances.set(account, balanceOf(state, account) + amount);
}

function debit(state: SimState, account: string, amount: number): boolean {
  if (balanceOf(state, account) < amount) return false;
  state.balances.set(account, balanceOf(state, account) - amount);
  return true;
}

function parseOperations(raw: unknown): ChainOp[] {
  if (!Array.isArray(raw)) return [];
  const ops: ChainOp[] = [];
  for (const entry of raw.slice(0, MAX_OPS)) {
    if (typeof entry !== 'object' || entry === null) continue;
    const e = entry as Record<string, unknown>;
    const kind = e.kind;
    if (kind !== 'transfer' && kind !== 'approve' && kind !== 'transferFrom' && kind !== 'mint' && kind !== 'burn') continue;
    if (typeof e.from !== 'string' || !e.from.trim()) continue;
    const amount = typeof e.amount === 'number' && Number.isFinite(e.amount) ? e.amount : NaN;
    if (Number.isNaN(amount) || amount < 0) continue;
    ops.push({
      kind,
      from: e.from.trim(),
      to: typeof e.to === 'string' && e.to.trim() ? e.to.trim() : undefined,
      spender: typeof e.spender === 'string' && e.spender.trim() ? e.spender.trim() : undefined,
      amount,
      authorized: e.authorized !== false,
    });
  }
  return ops;
}

export function simulateChain(
  initialBalances: Record<string, number>,
  operations: readonly ChainOp[],
): { findings: AnalysisFinding[]; state: SimState } {
  const state: SimState = { balances: new Map(), allowances: new Map() };
  for (const [account, amount] of Object.entries(initialBalances)) {
    if (typeof amount === 'number' && Number.isFinite(amount) && amount >= 0) {
      state.balances.set(account, amount);
    }
  }
  const findings: AnalysisFinding[] = [];

  operations.forEach((op, index) => {
    const at = `operation #${index + 1} (${op.kind})`;
    switch (op.kind) {
      case 'transfer': {
        const to = op.to ?? 'unknown';
        if (!debit(state, op.from, op.amount)) {
          findings.push({
            tool: 'chain-sim',
            target: op.from,
            title: 'Transfer exceeds balance (overspend/underflow)',
            severity: 'high',
            evidence: `${at}: "${op.from}" tried to transfer ${op.amount} to "${to}" with balance ${balanceOf(state, op.from)}. On-chain this reverts; in a bridge/wrapper without balance checks it mints value from nothing.`,
            cwe: ['CWE-682'],
            raw: { index, op },
          });
        } else {
          credit(state, to, op.amount);
        }
        break;
      }
      case 'approve': {
        const spender = op.spender ?? op.to ?? 'unknown';
        state.allowances.set(allowanceKey(op.from, spender), op.amount);
        if (op.amount >= UINT256_THRESHOLD) {
          findings.push({
            tool: 'chain-sim',
            target: op.from,
            title: 'Unlimited approval granted',
            severity: 'medium',
            evidence: `${at}: "${op.from}" approves "${spender}" for ${op.amount} (≥ 2^255, the de-facto unlimited allowance). A later compromise of the spender drains the full balance without further consent.`,
            cwe: ['CWE-732'],
            raw: { index, op },
          });
        }
        break;
      }
      case 'transferFrom': {
        const key = allowanceKey(op.to ?? '', op.from); // from=spender, to=owner for transferFrom semantics
        const owner = op.to ?? '';
        const allowed = state.allowances.get(key) ?? 0;
        if (allowed < op.amount) {
          findings.push({
            tool: 'chain-sim',
            target: owner,
            title: 'transferFrom exceeds allowance',
            severity: 'high',
            evidence: `${at}: spender "${op.from}" pulled ${op.amount} from "${owner}" with allowance ${allowed}. Any implementation missing the allowance check is an arbitrary-spend primitive.`,
            cwe: ['CWE-862'],
            raw: { index, op },
          });
        } else {
          state.allowances.set(key, allowed - op.amount);
          if (!debit(state, owner, op.amount)) {
            findings.push({
              tool: 'chain-sim',
              target: owner,
              title: 'transferFrom exceeds owner balance',
              severity: 'high',
              evidence: `${at}: "${owner}" has balance ${balanceOf(state, owner)} but ${op.amount} was pulled. Allowance/balance desync — a double-spend race across concurrent pulls.`,
              cwe: ['CWE-367'],
              raw: { index, op },
            });
          } else {
            credit(state, op.from, op.amount);
          }
        }
        break;
      }
      case 'mint': {
        if (!op.authorized) {
          findings.push({
            tool: 'chain-sim',
            target: op.from,
            title: 'Unauthorized mint in operation sequence',
            severity: 'critical',
            evidence: `${at}: mint of ${op.amount} to "${op.to ?? op.from}" is marked unauthorized. If the live contract lets this sequence execute, supply is attacker-inflatable.`,
            cwe: ['CWE-862'],
            raw: { index, op },
          });
        }
        credit(state, op.to ?? op.from, op.amount);
        break;
      }
      case 'burn': {
        if (!debit(state, op.from, op.amount)) {
          findings.push({
            tool: 'chain-sim',
            target: op.from,
            title: 'Burn exceeds balance',
            severity: 'medium',
            evidence: `${at}: "${op.from}" tried to burn ${op.amount} with balance ${balanceOf(state, op.from)}.`,
            cwe: ['CWE-682'],
            raw: { index, op },
          });
        }
        break;
      }
    }
  });

  return { findings, state };
}

export const chainSimLane: ScanLane = {
  id: 'chain_sim',
  phase: 'B',
  async run(ctx: LaneContext): Promise<LaneResult> {
    ctx.abort.throwIfAborted();
    const opts = optRecord(ctx, 'chain_sim');
    const initialBalances = (typeof opts.initialBalances === 'object' && opts.initialBalances !== null
      ? opts.initialBalances
      : {}) as Record<string, number>;
    const operations = parseOperations(opts.operations);

    if (operations.length === 0) {
      return {
        lane: 'chain_sim',
        status: 'skipped',
        reason: 'no operations supplied (set lanes.chain_sim.operations)',
        summary: 'no operations to simulate',
        findings: [],
        artifacts: [],
      };
    }

    const { findings, state } = simulateChain(initialBalances, operations);
    const statePath = join(ctx.deliverablesDir, 'chain-state.json');
    await writeFile(statePath, JSON.stringify({
      initialBalances,
      operations: operations.length,
      finalBalances: Object.fromEntries(state.balances),
      finalAllowances: Object.fromEntries(state.allowances),
    }, null, 2));

    return {
      lane: 'chain_sim',
      status: 'completed',
      summary: `simulated ${operations.length} operation(s) — ${findings.length} invariant violation(s)`,
      findings,
      artifacts: [statePath],
    };
  },
};
