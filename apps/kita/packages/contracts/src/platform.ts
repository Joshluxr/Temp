/**
 * @kita/contracts — internal platform contracts for T-PLAT-01 / T-PLAT-02.
 *
 * Field semantics follow docs/kita-plan/13-backlog.md:
 * - Plat01Input  = reviewed manifests, exact patched versions, integrity/native
 *   peer evidence; Plat01Output = reproducible monorepo lock, build and
 *   generated contract clients (objective: exact patched locks and no server
 *   secrets in client bundle).
 * - Plat02Input  = reviewed core DDL, checksum, target database and runtime
 *   roles; Plat02Output = fresh/upgrade migration proof with NO sandbox money
 *   import.
 *
 * These describe money-adjacent metadata only. Nothing here executes a money
 * effect; addSandboxFunds is banned and never appears in any Kita code path.
 */

import type { UUID } from './context.ts';

/* ------------------------------------------------------------------ *
 * T-PLAT-01 — monorepo versions / contract freeze
 * ------------------------------------------------------------------ */

/** One reviewed dependency manifest (package.json) hashed into the baseline. */
export interface ReviewedManifest {
  /** Workspace-relative path, e.g. "packages/domain". */
  readonly path: string;
  readonly name: string;
  /** sha256 hex of the exact reviewed manifest bytes. */
  readonly hash: string;
  readonly reviewedBy: string;
  readonly reviewCommit: string;
  /**
   * TEST-PLAT-01 gate: the manifest must have been read from a workspace the
   * lock actually covers. Uncovered manifests (root, or any directory outside
   * `package.json` workspaces) are recorded here so the freeze refuses them
   * instead of silently skipping their pins. Optional => treated as covered.
   */
  readonly coveredByLockfile?: boolean;
}

/** Exact patched version pin that the lock must resolve to. */
export interface PatchedVersionPin {
  readonly packageName: string;
  /** Exact semversion or patch range resolved to a single version, e.g. "5.6.3". */
  readonly exactVersion: string;
  /** Integrity of the resolved tarball, e.g. "sha512-…". Required before freeze. */
  readonly integrity: string;
  readonly patches: readonly string[];
}

/** Evidence about native modules and split web/native React peer sets (T-PLAT-01 DB note). */
export interface NativePeerEvidence {
  readonly environment: 'web' | 'native';
  readonly reactVersion: string;
  readonly nativeModules: readonly { readonly name: string; readonly prebuiltHash: string }[];
  /**
   * TEST-PLAT-01(c): the peer sets must be *separate*, not just present. Two
   * environments declaring the same `react` requirement are one merged set and
   * fail as COMPATIBILITY_FAILURE. Optional => not compared (backwards compatible).
   */
  readonly peerRequirement?: string;
}

export interface Plat01Input {
  readonly manifests: readonly ReviewedManifest[];
  readonly pins: readonly PatchedVersionPin[];
  readonly nativePeers: readonly NativePeerEvidence[];
  /** Client-bundle artifact scanned for server secrets (base64/sha256 of built JS assets). */
  readonly clientBundleArtifactId: string;
  /** Approved secret-pattern set; empty input fails closed as SECURITY_FAILURE. */
  readonly secretScanPatternsVersion: string;
}

export interface ReproducibleLock {
  /** Lockfile content hash — recompute must match byte-for-byte on clean install. */
  readonly lockDigest: string;
  readonly resolvedCount: number;
  readonly unresolved: readonly string[];
}

export interface BuildProof {
  readonly artifactDigest: string;
  readonly rebuiltDeterministic: boolean;
}

export interface SecretScanProof {
  readonly artifactsScanned: number;
  readonly findings: readonly string[];
  readonly patternsVersion: string;
}

export interface GeneratedClientProof {
  /** Hash-addressed bundle produced from the frozen OpenAPI schema (see generated.ts). */
  readonly bundleDigest: string;
  readonly operationCount: number;
  readonly openApiHash: string;
}

export interface Plat01Output {
  readonly lock: ReproducibleLock;
  readonly build: BuildProof;
  readonly secretScan: SecretScanProof;
  readonly generatedClients: GeneratedClientProof;
  readonly frozenAt: string;
}

/* ------------------------------------------------------------------ *
 * T-PLAT-01 — TEST-PLAT-01 evidence envelope (additive, frozen shape)
 *
 * The types above carry the DECISION (Plat01Input -> Result<Plat01Output>).
 * These carry the EVIDENCE that produced it, so EV(T-PLAT-01) can be filed
 * and re-checked without re-running a build. Verification only: nothing here
 * performs an install, a write, or a money effect.
 * ------------------------------------------------------------------ */

/** Which pin list a manifest block was read from. Workspace-internal cross-links are excluded. */
export type ManifestSection = 'dependencies' | 'devDependencies' | 'peerDependencies';

/** One requirement string as written in a reviewed manifest, plus its exactness verdict. */
export interface ManifestPinEvidence {
  readonly workspacePath: string;
  readonly section: ManifestSection;
  readonly packageName: string;
  /** Verbatim requirement from package.json, e.g. "^18.3.0" or "8.16.3". */
  readonly requirement: string;
  /** True only when the requirement is an exact version (no ^, ~, x, *, latest, range, workspace:*). */
  readonly exact: boolean;
  /** Reason token for exact=false, e.g. "caret-range" | "workspace-link". Empty when exact. */
  readonly reason: string;
}

/** Integrity evidence for one resolved node in a lockfile. */
export interface LockNodeIntegrityEvidence {
  /** Lockfile package key, e.g. "apps/mobile/node_modules/react". */
  readonly key: string;
  readonly name: string;
  readonly version: string;
  /** Verbatim `integrity` value; absent entries are recorded as "" and count as a finding. */
  readonly integrity: string;
  readonly hasResolved: boolean;
  /** True for link/workspace members, which legitimately carry no integrity. */
  readonly isWorkspaceLink: boolean;
}

/** The two React peer sets the T-PLAT-01 DB note requires to stay separate. */
export interface ReactPeerSetEvidence {
  readonly environment: 'web' | 'native';
  /** Every non-empty `react` requirement seen in that environment's manifests. */
  readonly reactRequirements: readonly string[];
  readonly reactNativeRequirement?: string;
}

/** One scanned client-bundle source unit (built artifact when present, source otherwise). */
export interface ClientBundleScanEvidence {
  readonly workspacePath: string;
  /** "built-artifact" | "source-substitute" — never report a substitute as the artifact. */
  readonly scanBasis: string;
  readonly filesScanned: number;
  /** Findings are locators only (`file:line:pattern-id`); raw material is never echoed (§F2 no-leak). */
  readonly findings: readonly string[];
}

/** Full evidence record for one TEST-PLAT-01 run; input to the validator's audit side. */
export interface Plat01Evidence {
  readonly evidenceVersion: string;
  readonly generatedAt: string;
  readonly gitCommit: string;
  readonly pins: readonly ManifestPinEvidence[];
  readonly lockNodes: readonly LockNodeIntegrityEvidence[];
  readonly reactPeerSets: readonly ReactPeerSetEvidence[];
  readonly bundleScans: readonly ClientBundleScanEvidence[];
  /** Forbidden outcome-manufacturing identifiers found in production-reachable paths. Must be []. */
  readonly forbiddenIdentifierFindings: readonly string[];
}

/** Digest of one evidence block, so a review can cite exactly what was approved. */
export interface Plat01EvidenceDigests {
  readonly pinsDigest: string;
  readonly lockDigestEvidence: string;
  readonly peerSetDigest: string;
  readonly bundleScanDigest: string;
}

/**
 * Accumulated TEST-PLAT-01 receipt: the validator output plus the evidence it
 * was derived from. A freeze is only promotable with both halves present.
 */
export interface Plat01VerificationReceipt {
  readonly output: Plat01Output;
  readonly evidence: Plat01EvidenceDigests;
  /** Freeze stays refused until Sol signs the evidence bundle (EV(T-PLAT-01)). */
  readonly approvedBy: string;
}

/**
 * Additional error cases named by 13-backlog.md T-PLAT-01 I/O line ("unresolved
 * version; compatibility/security failure"). Narrow unions over the existing F2
 * ProblemCode values — additive, and they keep the shared M2 errors untouched.
 */
export type Plat01UnresolvedVersionErrorCode = 'UNRESOLVED_VERSION';
export type Plat01CompatibilityErrorCode = 'COMPATIBILITY_FAILURE';
export type Plat01SecurityErrorCode = 'SECURITY_FAILURE' | 'OUTCOME_MANUFACTURING_FORBIDDEN';
export type Plat01ErrorCode =
  | Plat01UnresolvedVersionErrorCode
  | Plat01CompatibilityErrorCode
  | Plat01SecurityErrorCode;

/** Structured detail for UNRESOLVED_VERSION: a requirement that pinned nothing. */
export interface UnresolvedVersionDetail {
  readonly code: Plat01UnresolvedVersionErrorCode;
  readonly packageName: string;
  readonly workspacePath: string;
  readonly requirement: string;
  readonly reason: string;
}

/** Structured detail for COMPATIBILITY_FAILURE: web/native peer sets collided or a native hash was missing. */
export interface CompatibilityFailureDetail {
  readonly code: Plat01CompatibilityErrorCode;
  readonly environment: 'web' | 'native' | 'mixed';
  readonly conflictingRequirements: readonly string[];
  readonly reason: string;
}

/** Structured detail for SECURITY_FAILURE: locator-only, never the matched material. */
export interface SecurityFailureDetail {
  readonly code: Plat01SecurityErrorCode;
  readonly patternId: string;
  readonly artifactId: string;
  readonly offset: number;
}

/** Plat01 typed-error union; still carried inside Problem.detail-boundary results per §F2. */
export type Plat01FailureDetail =
  | UnresolvedVersionDetail
  | CompatibilityFailureDetail
  | SecurityFailureDetail;

/* ------------------------------------------------------------------ *
 * T-PLAT-02 — PostgreSQL migration from MySQL sandbox
 * ------------------------------------------------------------------ */

/** Reviewed core DDL unit (e.g. packages/database/migrations/001_core.sql). */
export interface CoreDdlFile {
  readonly sequence: number;
  readonly filename: string;
  /** sha256 hex over exact DDL bytes; mismatch => MIGRATION_CHECKSUM_FAILURE. */
  readonly checksum: string;
  readonly reviewedBy: string;
}

/** Target database coordinates — metadata only; no credentials inline. */
export interface TargetDatabase {
  readonly engine: 'postgresql';
  readonly databaseName: string;
  /** Secret-store reference, never a literal credential. */
  readonly adminBindingRef: string;
}

/** Least-privilege runtime role grant expectation (E1: no direct financial writes). */
export interface RuntimeRoleGrant {
  readonly role: string;
  readonly canWriteFinancialTables: false; // true is structurally unrepresentable: runtime roles get no direct financial table writes
  readonly grantedProcedures: readonly string[];
}

/**
 * Read-only inventory of the MySQL sandbox source. Counts/hashes are evidence
 * for the disposition report ONLY. The presence of any balance figure here is
 * what migrateCore must refuse to carry forward — see SandboxMoneyImportDenial.
 */
export interface SourceInventoryRow {
  readonly table: string;
  readonly rowCount: number;
  readonly rowHash: string;
  /** True when the table holds sandbox balances/ledger rows. Must be excluded, never imported. */
  readonly containsSandboxMoney: boolean;
}

export interface Plat02Input {
  readonly ddl: readonly CoreDdlFile[];
  readonly target: TargetDatabase;
  readonly runtimeRoles: readonly RuntimeRoleGrant[];
  readonly sourceInventory: readonly SourceInventoryRow[];
  /**
   * BANNED by policy (docs/kita-plan/05-data-ledger.md E7): importing sandbox
   * balances as live cash. Typed as `never` so any attempt is a compile error;
   * runtime guards reject structural workarounds. No runtime boolean can turn
   * a fake funding function into a live rail — addSandboxFunds must never exist.
   */
  readonly sandboxMoneyImport?: never;
}

export interface FreshInstallProof {
  readonly appliedSequences: readonly number[];
  readonly ddlChecksumVerified: true;
  readonly invariantChecksPassed: readonly string[];
}

export interface GrantAuditRow {
  readonly role: string;
  readonly financialTableDirectWriteDenied: boolean;
}

export interface SandboxMoneyImportDenial {
  readonly deniedRows: readonly string[];
  readonly reason: string;
}

export interface Plat02Output {
  readonly freshInstall: FreshInstallProof;
  readonly grants: readonly GrantAuditRow[];
  /** Always present: positive proof that zero sandbox money crossed the boundary. */
  readonly sandboxMoney: SandboxMoneyImportDenial;
  readonly targetSchemaDigest: string;
}
