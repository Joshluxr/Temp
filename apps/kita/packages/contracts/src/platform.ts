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
