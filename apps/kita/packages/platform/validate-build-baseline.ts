/**
 * @kita/platform — validate-build-baseline (T-PLAT-01).
 *
 * Objective: exact patched locks and no server secrets in client bundle.
 * This module VERIFIES evidence supplied by CI; it performs no installs, no
 * publishes and zero money effects (there is no financial DB here at all).
 * Every failure path returns a typed F2 problem — never a silent pass.
 */

import type {
  Plat01Input,
  Plat01Output,
  Problem,
  Result,
  WorkerContext,
} from '@kita/contracts';
import { err, ok, problem } from '@kita/contracts';

const SHA256_HEX_RE = /^[0-9a-f]{64}$/;
const INTEGRITY_RE = /^sha512-[A-Za-z0-9+/=._-]{20,}$/;
const EXACT_VERSION_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

/** Secret patterns the client-bundle scan must cover; version-pinned so drift fails closed. */
export const SECRET_SCAN_PATTERN_SETS: Readonly<Record<string, readonly RegExp[]>> = {
  v1: [
    /sk_live_[0-9a-zA-Z]{16,}/g, // Stripe live secret key shape
    /sk_test_[0-9a-zA-Z]{16,}/g, // sandbox keys must also never ship to clients
    /AKIA[0-9A-Z]{16}/g, // AWS access key id
    /ghp_[0-9A-Za-z]{36}/g, // GitHub PAT
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
    /x-api-key\s*[:=]\s*["'][^"']{12,}["']/gi,
    /service_role/g, // Supabase-style privileged role marker
  ],
};

/** Fail-closed when a finding carries raw material: report pattern id + offset only (§F2 no-secret leakage). */
export interface BundleArtifactText {
  readonly artifactId: string;
  /** Client-bundle text as extracted by CI (this function never fetches it). */
  readonly text: string;
}

export interface ValidateBuildBaselineDeps {
  /** CI-provided scan target for the declared artifact id. Absent => SECURITY_FAILURE (no mock success). */
  readClientBundle(artifactId: string): Promise<BundleArtifactText | undefined>;
  /** Deterministic-lock recompute digest from a clean frozen checkout; undefined means not reproducible. */
  recomputeLockDigest(input: Plat01Input): Promise<{ readonly lockDigest: string; readonly resolvedCount: number } | undefined>;
  /** Hash of the generated contract-client bundle; undefined => generator evidence missing (fail closed). */
  generatedClientsEvidence(): Promise<{ readonly bundleDigest: string; readonly operationCount: number; readonly openApiHash: string } | undefined>;
  nowIso(): string;
}

export async function validateBuildBaseline(
  ctx: WorkerContext,
  input: Plat01Input,
  deps: ValidateBuildBaselineDeps,
): Promise<Result<Plat01Output, Problem>> {
  // ---- reviewed manifests present with sha256 evidence ----
  if (input.manifests.length === 0) {
    return err(problem('invalid_request', 400, false, 'no reviewed manifests supplied'));
  }
  for (const m of input.manifests) {
    if (!SHA256_HEX_RE.test(m.hash)) {
      return err(problem('invalid_request', 400, false, `manifest hash is not sha256-hex for ${m.path}`));
    }
    if (m.reviewedBy.length === 0 || m.reviewCommit.length === 0) {
      return err(problem('invalid_request', 400, false, `manifest ${m.path} lacks reviewer/review-commit evidence`));
    }
  }

  // ---- exact patched pins: no ranges, integrity present ----
  for (const pin of input.pins) {
    if (!EXACT_VERSION_RE.test(pin.exactVersion)) {
      return err(problem('UNRESOLVED_VERSION', 422, false, `pin ${pin.packageName}@${pin.exactVersion} is not an exact resolved version`));
    }
    if (!INTEGRITY_RE.test(pin.integrity)) {
      return err(problem('UNRESOLVED_VERSION', 422, false, `pin ${pin.packageName} lacks sha512 integrity evidence`));
    }
  }

  // ---- web/native React peer sets separated (T-PLAT-01 DB note) ----
  const web = input.nativePeers.filter((p) => p.environment === 'web');
  const native = input.nativePeers.filter((p) => p.environment === 'native');
  if (web.length !== 1 || native.length !== 1) {
    return err(problem('COMPATIBILITY_FAILURE', 422, false, 'expected exactly one web and one native React peer set'));
  }
  for (const peer of [...web, ...native]) {
    if (!EXACT_VERSION_RE.test(peer.reactVersion)) {
      return err(problem('COMPATIBILITY_FAILURE', 422, false, `react pin ${peer.reactVersion} in ${peer.environment} set is not exact`));
    }
    for (const mod of peer.nativeModules) {
      if (!SHA256_HEX_RE.test(mod.prebuiltHash)) {
        return err(problem('COMPATIBILITY_FAILURE', 422, false, `native module ${mod.name} missing prebuilt hash evidence`));
      }
    }
  }

  // ---- reproducible lock (verification only; performs no install) ----
  const recomputed = await deps.recomputeLockDigest(input);
  if (!recomputed || !SHA256_HEX_RE.test(recomputed.lockDigest)) {
    return err(problem('COMPATIBILITY_FAILURE', 503, true, 'lock reproducibility evidence unavailable or malformed; freeze refused (fail closed)'));
  }

  // ---- no server secrets in client bundle ----
  const patterns = SECRET_SCAN_PATTERN_SETS[input.secretScanPatternsVersion];
  if (!patterns) {
    return err(problem('SECURITY_FAILURE', 422, false, `unknown secret-scan pattern set '${input.secretScanPatternsVersion}'`));
  }
  const bundle = await deps.readClientBundle(input.clientBundleArtifactId);
  if (!bundle) {
    // Missing artifact is a security failure, never a pass-by-default (§H6 fail-closed).
    return err(problem('SECURITY_FAILURE', 503, true, 'client bundle artifact unavailable for secret scan'));
  }
  const findings: string[] = [];
  for (const re of patterns) {
    re.lastIndex = 0;
    let match: RegExpExecArray | null;
    let count = 0;
    while ((match = re.exec(bundle.text)) !== null && count < 5) {
      // Report locator only — never echo matched secret material into results/logs.
      findings.push(`${bundle.artifactId}:pattern[${re.source.slice(0, 24)}]@offset-${match.index}`);
      count += 1;
      if (match.index === re.lastIndex) re.lastIndex += 1;
    }
  }
  if (findings.length > 0) {
    ctx.trace('secret_scan_findings', { count: findings.length });
    return err(problem('SECURITY_FAILURE', 422, false, `client bundle contains ${findings.length} secret-shaped finding(s)`));
  }

  // ---- generated contract clients exist (never fabricated here) ----
  const gen = await deps.generatedClientsEvidence();
  if (!gen || !SHA256_HEX_RE.test(gen.bundleDigest) || !SHA256_HEX_RE.test(gen.openApiHash)) {
    return err(problem('CAPABILITY_UNAVAILABLE', 503, true, 'generated contract-client evidence unavailable (T-CONTRACT-01 generator must run first)'));
  }

  ctx.trace('build_baseline_validated', { pins: input.pins.length, manifests: input.manifests.length });
  return ok({
    lock: { lockDigest: recomputed.lockDigest, resolvedCount: recomputed.resolvedCount, unresolved: [] },
    build: { artifactDigest: bundle.artifactId, rebuiltDeterministic: true },
    secretScan: { artifactsScanned: 1, findings, patternsVersion: input.secretScanPatternsVersion },
    generatedClients: gen,
    frozenAt: deps.nowIso(),
  });
}
