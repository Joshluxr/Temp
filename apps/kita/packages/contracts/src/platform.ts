/**
 * @kita/contracts — internal platform contracts for T-PLAT-01 / T-PLAT-02 / T-PLAT-03.
 *
 * Field semantics follow docs/kita-plan/13-backlog.md:
 * - Plat01Input  = reviewed manifests, exact patched versions, integrity/native
 *   peer evidence; Plat01Output = reproducible monorepo lock, build and
 *   generated contract clients (objective: exact patched locks and no server
 *   secrets in client bundle).
 * - Plat02Input  = reviewed core DDL, checksum, target database and runtime
 *   roles; Plat02Output = fresh/upgrade migration proof with NO sandbox money
 *   import.
 * - Plat03Input  = durable event/consumer identity and raw inbox/outbox
 *   envelope; Plat03Output = atomic consume/apply and recoverable publication
 *   (objective: crash at every commit/send/ack boundary preserves one economic
 *   effect).
 * - Plat04Input  = inbound provider webhook identity, signature material and
 *   raw body digest; Plat04Output = authenticated inbox accept with quarantine
 *   of same-ID changed bodies. Until T-CORE-02 exists, receiveWebhook is
 *   unavailable and must not write inbox rows.
 *
 * These describe money-adjacent metadata only. Nothing here executes a money
 * effect; addSandboxFunds is banned and never appears in any Kita code path.
 */

import type { DomainEventType } from './events.ts';
import type { UUID, WorkerContext } from './context.ts';

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

/* ------------------------------------------------------------------ *
 * T-PLAT-03 — outbox/inbox idempotent durable workers
 *
 * Backlog I/O row (13-backlog.md ~L1362): input = durable event/consumer
 * identity and raw inbox/outbox envelope; output = atomic consume/apply and
 * recoverable publication. Additional errors: IDEMPOTENCY_MISMATCH; shared M2
 * errors apply. DB surface named by the same entry: `outbox`, `inbox`,
 * `consumer_inbox` — dedup on business AND delivery IDs, transactionally
 * apply before ack, stable IDs survive DLQ/restart (07-algorithms.md §G7).
 *
 * These types describe an economic fact without effecting one (§F5). No field
 * here carries a balance, amount or journal figure, and financial consumers
 * re-read authority from the ledger rather than trusting envelope payloads.
 * ------------------------------------------------------------------ */

/** Delivery states mirroring the inbox.state CHECK in sql/001_core.sql. */
export type InboxDeliveryState = 'received' | 'processing' | 'applied' | 'quarantined';

/** Publication states for one outbox row (derived from published_at/lease_until/attempts in DDL). */
export type OutboxPublicationState = 'pending' | 'leased' | 'published';

/**
 * Raw provider ingress envelope as persisted BEFORE a 2xx (§G7 ingress rule):
 * exact bytes are stored encrypted at `rawObjectRef` and only their hash
 * travels here. Dedup key is (providerAccountId, deliveryId); replay of the
 * same ID with a different hash is quarantined, never applied.
 */
export interface InboxEnvelopeRaw {
  readonly providerAccountId: UUID;
  /** Provider delivery ID, kept as the exact vendor string (never normalized). */
  readonly deliveryId: string;
  /** sha256 hex over the exact raw bytes; mismatch on same deliveryId => quarantine + security case. */
  readonly payloadHash: string;
  /** Secret-store/object-store reference to the encrypted raw evidence; never inline material. */
  readonly rawObjectRef: string;
  readonly receivedAt: string;
  readonly state: InboxDeliveryState;
  /** Bounded, non-PII reason locator when state is 'quarantined'. */
  readonly lastError?: string;
}

/**
 * Internal domain-event envelope staged for publication, mirroring the outbox
 * table columns. The stable eventId IS the dedup identity consumers record in
 * consumer_inbox; DLQ replay must preserve it and may not change the payload.
 */
export interface OutboxEventEnvelope {
  readonly eventId: UUID;
  readonly aggregateId: UUID;
  /** Decimal string, monotonic per aggregate (§F5); bigint(minor) column in DDL. */
  readonly aggregateVersion: string;
  readonly eventType: DomainEventType;
  readonly schemaVersion: number;
  /** sha256 hex over canonical payload JSON; recorded so replayed publications are byte-identical. */
  readonly payloadDigest: string;
  readonly createdAt: string;
  readonly availableAt: string;
  readonly publishedAt?: string;
  readonly leaseUntil?: string;
  readonly attempts: number;
}

/** Consumer-side dedup identity: PRIMARY KEY (consumer, event_id) in consumer_inbox. */
export interface ConsumerInboxIdentity {
  readonly consumer: string;
  readonly eventId: UUID;
}

export interface Plat03Input {
  readonly worker: WorkerIdentity;
  readonly inbox?: InboxEnvelopeRaw;
  readonly outbox?: OutboxEventEnvelope;
  readonly consumer: ConsumerInboxIdentity;
  /**
   * Structural ban, same shape as Plat02Input.sandboxMoneyImport: this worker
   * consumes and publishes envelopes; it does not post journals, mint balances
   * or accept money effects. Any attempt is a compile error, and T-CORE-02
   * (the durable command/ledger substrate this worker depends on) is not yet
   * implemented, so applyEvent fails closed regardless of input.
   */
  readonly journalPosting?: never;
}

/** Durable work identity carried by the scheduler; mirrors WorkerContext fields. */
export interface WorkerIdentity {
  readonly workId: UUID;
  readonly attemptGeneration: number;
  readonly correlationId: UUID;
  readonly causationId?: UUID;
}

/** Proof that consume+apply committed atomically before the queue ack (§G7). */
export interface ConsumeApplyProof {
  readonly consumer: string;
  readonly eventId: UUID;
  /** True only when the consumer_inbox insert and domain changes committed in ONE transaction. */
  readonly appliedTransactionallyBeforeAck: true;
  readonly duplicateDeliverySuppressed: boolean;
  readonly inboxState: InboxDeliveryState;
}

/** Publication outcome; `republishedStableId` proves crash-after-send replays the SAME eventId. */
export interface RecoverablePublicationProof {
  readonly eventId: UUID;
  readonly publishedAt: string;
  readonly state: OutboxPublicationState;
  readonly republishedStableId: boolean;
}

export interface Plat03Output {
  readonly consume: ConsumeApplyProof;
  readonly publication: RecoverablePublicationProof;
  /** Locator-only trace summary; never raw payloads, credentials or PII (§H2). */
  readonly traceEvents: readonly string[];
}

/** Structured detail for IDEMPOTENCY_MISMATCH: same identity, changed body (§G7 / §F2). */
export interface Plat03IdempotencyMismatchDetail {
  readonly code: 'IDEMPOTENCY_MISMATCH';
  readonly consumer: string;
  readonly eventId: UUID;
  /** Which identity axis collided: delivery-hash change or payload-digest change. */
  readonly axis: 'delivery_id' | 'payload_digest';
  readonly reason: string;
}

/** Plat03 typed-error union; carried inside Problem.detail-boundary results per §F2. */
export type Plat03FailureDetail = Plat03IdempotencyMismatchDetail;

/**
 * Provider webhook ingress (T-PLAT-04 / receiveWebhook).
 * Signature bytes and raw body stay locator/digest-only; never persist raw
 * payloads here. journalPosting is structurally banned.
 */
export interface Plat04Input {
  readonly worker: WorkerIdentity;
  readonly provider: string;
  readonly accountId: UUID;
  readonly deliveryId: string;
  readonly payloadDigest: string;
  readonly signatureLocator: string;
  readonly receivedAt: string;
  readonly journalPosting?: never;
  readonly inboxWrite?: never;
}

/** Proof that an authenticated delivery was recorded without mutating journals. */
export interface Plat04AcceptProof {
  readonly provider: string;
  readonly accountId: UUID;
  readonly deliveryId: string;
  readonly inboxState: InboxDeliveryState;
  readonly sameIdChangedBodyQuarantined: boolean;
}

export interface Plat04Output {
  readonly accept: Plat04AcceptProof;
  readonly traceEvents: readonly string[];
}

export interface Plat04SignatureRejectedDetail {
  readonly code: 'SIGNATURE_REJECTED';
  readonly provider: string;
  readonly accountId: UUID;
  readonly reason: string;
}

export type Plat04FailureDetail = Plat03IdempotencyMismatchDetail | Plat04SignatureRejectedDetail;

/**
 * Timers / DLQ replay (T-PLAT-05). Until T-CORE-02 exists, scheduleTimer and
 * replayDlq must not write timers, outbox, queues, or journals.
 */
export interface Plat05TimerIdentity {
  readonly timerId: UUID;
  readonly generation: number;
  readonly dueAt: string;
  readonly workKey: string;
}

export interface Plat05DlqIdentity {
  readonly deadLetterId: UUID;
  readonly originalWorkId: UUID;
  readonly originalPayloadDigest: string;
}

export interface Plat05Input {
  readonly worker: WorkerIdentity;
  readonly timer?: Plat05TimerIdentity;
  readonly dlq?: Plat05DlqIdentity;
  readonly journalPosting?: never;
  readonly queuePublish?: never;
}

export interface Plat05Output {
  readonly preservedDeadline: boolean;
  readonly preservedOriginalKey: boolean;
  readonly traceEvents: readonly string[];
}

export interface Plat05VersionConflictDetail {
  readonly code: 'VERSION_CONFLICT';
  readonly timerId?: UUID;
  readonly generation?: number;
  readonly reason: string;
}

export type Plat05FailureDetail = Plat05VersionConflictDetail;

/**
 * Financial-health observation (T-PLAT-06). Health projection is not ledger
 * authority. Until exporters exist, observeFinancialHealth fails closed and
 * must not write audit_events, dispatch alerts, or include PII.
 */
export interface Plat06Input {
  readonly worker: WorkerIdentity;
  readonly windowStart: string;
  readonly windowEnd: string;
  readonly redactedTraceEventCount: number;
  readonly journalPosting?: never;
  readonly pii?: never;
  readonly rawPayloads?: never;
}

export interface Plat06Output {
  readonly alertsDeliveredToNamedOnCall: boolean;
  readonly piiLeaked: false;
  readonly sloBreaches: readonly string[];
  readonly traceEvents: readonly string[];
}

export interface Plat06TelemetryExportFailureDetail {
  readonly code: 'TELEMETRY_EXPORT_FAILURE';
  readonly reason: string;
}

export type Plat06FailureDetail = Plat06TelemetryExportFailureDetail;

/**
 * Environment isolation checker (T-PLAT-07). Pure fail-closed: never claims
 * an isolated deployment. Production + sandbox/fixture/addSandboxFunds is
 * CAPABILITY_UNAVAILABLE. All other paths are dependency_unavailable until
 * live IaC/KMS isolation exists. No Terraform, cloud, DB, or money effects.
 */
export type Plat07ClaimedEnvironment = 'production' | 'sandbox';

export interface Plat07Input {
  readonly worker: WorkerIdentity;
  readonly claimedEnvironment: Plat07ClaimedEnvironment;
  readonly sandboxCapabilityPresent: boolean;
  readonly fixtureAdapterPresent: boolean;
  readonly addSandboxFundsPresent: boolean;
  readonly journalPosting?: never;
  readonly terraformApply?: never;
}

export interface Plat07Output {
  readonly isolatedDeployment: true;
  readonly runtimeFailClosed: true;
  readonly traceEvents: readonly string[];
}

export interface Plat07CapabilityUnavailableDetail {
  readonly code: 'CAPABILITY_UNAVAILABLE';
  readonly claimedEnvironment: Plat07ClaimedEnvironment;
  readonly reason: string;
}

export type Plat07FailureDetail = Plat07CapabilityUnavailableDetail;

/**
 * Release gates (T-PLAT-10). Evaluate manifests only. Never ok:true, never
 * claims no financial break. DEP-15 live gates are not implemented.
 */
export type Plat10EvidenceState = 'missing' | 'failing' | 'present';

export interface Plat10EvidenceManifest {
  readonly security: Plat10EvidenceState;
  readonly load: Plat10EvidenceState;
  readonly accessibility: Plat10EvidenceState;
  readonly financial: Plat10EvidenceState;
}

export interface Plat10Input {
  readonly worker: WorkerIdentity;
  readonly artifactDigest: string;
  readonly evidence: Plat10EvidenceManifest;
  readonly journalPosting?: never;
  readonly liveGateExecution?: never;
}

export interface Plat10Output {
  readonly noCriticalGap: true;
  readonly noUnexplainedFinancialBreak: true;
  readonly traceEvents: readonly string[];
}

export interface Plat10BlockingEvidenceDetail {
  readonly code: 'SECURITY_FAILURE' | 'invalid_request';
  readonly axis: keyof Plat10EvidenceManifest;
  readonly state: Plat10EvidenceState;
  readonly reason: string;
}

export type Plat10FailureDetail = Plat10BlockingEvidenceDetail;

/**
 * Privacy retention / legal holds (T-PLAT-09). Always fail closed. A legal
 * hold never deletes. Absence of a hold never authorizes deletion here.
 */
export interface Plat09Input {
  readonly worker: WorkerIdentity;
  readonly subjectId: UUID;
  readonly legalHoldActive: boolean;
  readonly requestKind: 'delete' | 'export';
  readonly journalPosting?: never;
  readonly documentWrite?: never;
}

export interface Plat09Output {
  readonly deleted: false;
  readonly exported: false;
  readonly holdPreserved: true;
  readonly traceEvents: readonly string[];
}

export interface Plat09PolicyUnavailableDetail {
  readonly code: 'POLICY_UNAVAILABLE';
  readonly subjectId: UUID;
  readonly reason: string;
}

export type Plat09FailureDetail = Plat09PolicyUnavailableDetail;

/**
 * Financial authority recovery (T-PLAT-08). Unauthorized reopen, unfenced old
 * writers, and unreconciled uncertainty never grant submission authority.
 * T-CORE-02 and T-LEDGER-02 remain HOLD.
 */
export interface Plat08Input {
  readonly unauthorizedReopen: boolean;
  readonly oldWriterNotFenced: boolean;
  readonly uncertaintyWindowUnreconciled: boolean;
}

export type Plat08Output = never;

export type Plat08CommandContext = Pick<WorkerContext, 'workId' | 'attemptGeneration'>;
