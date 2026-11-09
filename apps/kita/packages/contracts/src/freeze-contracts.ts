/**
 * @kita/contracts — T-CONTRACT-01 freeze helper (domain-stub lane).
 *
 * `freezeContracts` hashes the candidate contract bytes (OpenAPI/event/schema
 * yaml) and returns a Result. Pure local computation: no network, no posting,
 * no publication of the manifest anywhere.
 */

import { createHash } from 'node:crypto';
import { err, ok, problem, type Problem, type Result } from './result.ts';

/** A candidate contract snapshot awaiting freeze: exact reviewed yaml bytes. */
export interface ContractCandidate {
  /** Stable identifier for the artifact, e.g. "kita-v1.yaml". */
  readonly name: string;
  /** The exact yaml bytes to hash; hashing covers these bytes verbatim. */
  readonly yaml: Uint8Array;
}

/** One hashed entry of a frozen manifest. */
export interface FrozenContractEntry {
  readonly name: string;
  /** sha256 hex over the exact candidate yaml bytes. */
  readonly hash: string;
  readonly byteLength: number;
}

/** Output of a successful freeze: hashes only, nothing posted. */
export interface ContractManifest {
  readonly entries: readonly FrozenContractEntry[];
  /** sha256 hex over the sorted per-entry "name:hash" lines (aggregate digest). */
  readonly aggregateHash: string;
  readonly frozenAt: string;
}

function sha256Hex(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function invalid(detail: string, field?: string): Result<never> {
  return err(
    problem('invalid_request', 400, false, detail, field ? { fieldErrors: [{ field, message: detail }] } : undefined),
  );
}

/**
 * Hash one or more candidate yaml snapshots into a freeze manifest.
 * Rejects empty batches, blank/duplicate names and zero-length payloads.
 * The returned manifest stays in-process: this module performs no I/O beyond
 * the pure hash, and never posts or publishes the result.
 */
export function freezeContracts(
  input: ContractCandidate | readonly ContractCandidate[],
  frozenAt: string = new Date().toISOString(),
): Result<ContractManifest, Problem> {
  const candidates = Array.isArray(input) ? input : [input];
  if (candidates.length === 0) return invalid('freeze requires at least one contract candidate');
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(frozenAt)) {
    return invalid('frozenAt must be an ISO-8601 UTC timestamp', 'frozenAt');
  }

  const seen = new Set<string>();
  const entries: FrozenContractEntry[] = [];
  for (const candidate of candidates) {
    if (!candidate || typeof candidate.name !== 'string' || candidate.name.trim() === '') {
      return invalid('candidate name must be a non-empty string', 'name');
    }
    if (seen.has(candidate.name)) {
      return invalid(`duplicate candidate name "${candidate.name}"`, 'name');
    }
    seen.add(candidate.name);
    if (!(candidate.yaml instanceof Uint8Array) || candidate.yaml.length === 0) {
      return invalid(`candidate "${candidate.name}" has no yaml bytes`, 'yaml');
    }
    entries.push({
      name: candidate.name,
      hash: sha256Hex(candidate.yaml),
      byteLength: candidate.yaml.length,
    });
  }

  entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  const aggregateHash = sha256Hex(
    new TextEncoder().encode(entries.map((e) => `${e.name}:${e.hash}`).join('\n')),
  );
  return ok({ entries, aggregateHash, frozenAt });
}
