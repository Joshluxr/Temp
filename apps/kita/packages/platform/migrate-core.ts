/**
 * @kita/platform — migrate-core (T-PLAT-02).
 *
 * Objective: fresh install works and sandbox balances never become live cash.
 * Validates reviewed core DDL checksums, least-privilege runtime-role grants
 * and schema invariants; REFUSES any sandbox-money import at three layers:
 * the `never`-typed contract field, a structural runtime guard, and an
 * allowlist of tables that may ever be touched. This module executes no DDL
 * and no money effect — it produces a proof object only.
 */

import type {
  Plat02Input,
  Plat02Output,
  Problem,
  Result,
  WorkerContext,
} from '@kita/contracts';
import { err, ok, problem } from '@kita/contracts';

const SHA256_HEX_RE = /^[0-9a-f]{64}$/;
const ROLE_RE = /^[a-z][a-z0-9_]{1,62}$/;

/** Tables whose rows carry economic value — read-only inventory at most; never a migration target. addSandboxFunds is banned: no code path here mints balances. */
export const MONEY_BEARING_TABLES: ReadonlySet<string> = new Set([
  'journal_lines',
  'journals',
  'ledger_accounts',
  'balances',
  'quotes',
  'transfers',
  'money_operations',
  'operation_attempts',
  'refund_obligations',
  'liquidity_positions',
  'wallet_balances',
]);

/** Procedures a runtime role may hold; anything touching financial writes or outcome simulation is denied (E1: runtime roles have no direct financial table writes). */
const FORBIDDEN_RUNTIME_PROCEDURES = /(?:^|_)(?:post_journal|mint|set_balance|complete_payout|approve_kyc|simulate|sandbox)/i;

/** Financial-table names detectable by shape in coerced evidence payloads (mirrors MONEY_BEARING_TABLES plus column-suffix shapes). */
const MONEY_COLUMN_RE = /(?:_minor|balance|amount|principal|fee_total)/i;

export interface MigrateCoreDeps {
  /** Verify DDL file bytes still match the reviewed checksum (reads reviewed artifact; applies nothing). */
  verifyDdlChecksum(file: { readonly filename: string; readonly checksum: string }): Promise<boolean>;
  /** Inspect actual target grants via a read-only catalog query. */
  auditGrants(role: string): Promise<{ readonly canWriteFinancialTables: boolean }>;
  /** Run post-install invariant assertions against the freshly created schema (structure checks only). */
  checkInvariants(): Promise<{ readonly passed: readonly string[]; readonly failed: readonly string[] }>;
  /** Catalog digest of the freshly validated schema (sha256-hex); produced by CI wiring, never here. */
  schemaDigest(): Promise<string>;
}

export async function migrateCore(
  ctx: WorkerContext,
  input: Plat02Input,
  deps: MigrateCoreDeps,
): Promise<Result<Plat02Output, Problem>> {
  // ---- Layer 1: contract-level ban. `sandboxMoneyImport?: never` is compile-time;
  // this runtime guard catches structurally-coerced payloads (defence in depth).
  const smuggled = (input as Record<string, unknown>)['sandboxMoneyImport'];
  if (smuggled !== undefined) {
    ctx.trace('sandbox_money_import_rejected');
    return err(problem('SANDBOX_MONEY_IMPORT_FORBIDDEN', 403, false, 'DISABLED: outcome manufacturing forbidden — sandbox balances never become live cash'));
  }

  // ---- Layer 2: source inventory — money-bearing rows are counted, never carried. ----
  const deniedRows: string[] = [];
  for (const row of input.sourceInventory) {
    if (row.containsSandboxMoney || MONEY_BEARING_TABLES.has(row.table)) {
      deniedRows.push(`${row.table}:rows=${row.rowCount}`);
    }
    if (MONEY_COLUMN_RE.test(row.table)) {
      deniedRows.push(`${row.table}:column-shape`);
    }
  }
  // Denial is not a failure by itself — it is the REQUIRED outcome recorded in the
  // proof. Failure occurs only if evidence claims those rows were imported.
  const claimedImport = (input as Record<string, unknown>)['importedTables'];
  if (Array.isArray(claimedImport) && claimedImport.some((t) => typeof t === 'string' && (MONEY_BEARING_TABLES.has(t) || MONEY_COLUMN_RE.test(t)))) {
    ctx.trace('sandbox_money_import_rejected');
    return err(problem('SANDBOX_MONEY_IMPORT_FORBIDDEN', 403, false, 'DISABLED: outcome manufacturing forbidden — migration evidence lists financial-table imports'));
  }

  // ---- DDL sequence + checksum validation ----
  if (input.ddl.length === 0) {
    return err(problem('invalid_request', 400, false, 'no reviewed core DDL supplied'));
  }
  const sequences = input.ddl.map((f) => f.sequence);
  if (new Set(sequences).size !== sequences.length) {
    return err(problem('MIGRATION_CHECKSUM_FAILURE', 422, false, 'duplicate DDL sequence numbers'));
  }
  const ordered = [...input.ddl].sort((a, b) => a.sequence - b.sequence);
  for (let i = 0; i < ordered.length; i += 1) {
    if (ordered[i]!.sequence !== i + 1) {
      return err(problem('MIGRATION_CHECKSUM_FAILURE', 422, false, 'DDL sequence must be contiguous starting at 1 (expand-safe numbering)'));
    }
  }
  for (const file of ordered) {
    if (!SHA256_HEX_RE.test(file.checksum)) {
      return err(problem('MIGRATION_CHECKSUM_FAILURE', 422, false, `ddl ${file.filename} checksum is not sha256-hex`));
    }
    if (!(await deps.verifyDdlChecksum(file))) {
      return err(problem('MIGRATION_CHECKSUM_FAILURE', 422, false, `ddl ${file.filename} bytes do not match reviewed checksum`));
    }
  }

  // ---- least-privilege runtime roles ----
  if (input.target.engine !== 'postgresql') {
    return err(problem('MIGRATION_INVARIANT_FAILURE', 422, false, 'target engine must be postgresql'));
  }
  if (input.runtimeRoles.length === 0) {
    return err(problem('MIGRATION_PERMISSION_FAILURE', 422, false, 'no runtime roles declared; fail closed'));
  }
  const grants: { role: string; financialTableDirectWriteDenied: boolean }[] = [];
  for (const role of input.runtimeRoles) {
    if (!ROLE_RE.test(role.role)) {
      return err(problem('MIGRATION_PERMISSION_FAILURE', 422, false, `runtime role name '${role.role}' invalid`));
    }
    if (role.canWriteFinancialTables !== false) {
      // Structural guarantee: the type makes `true` unrepresentable; coercion attempts land here.
      return err(problem('MIGRATION_PERMISSION_FAILURE', 422, false, `runtime role '${role.role}' declares financial table write authority`));
    }
    for (const proc of role.grantedProcedures) {
      if (FORBIDDEN_RUNTIME_PROCEDURES.test(proc)) {
        return err(problem('MIGRATION_PERMISSION_FAILURE', 422, false, `runtime role '${role.role}' holds forbidden procedure '${proc}'`));
      }
    }
    const audit = await deps.auditGrants(role.role);
    if (audit.canWriteFinancialTables) {
      return err(problem('MIGRATION_PERMISSION_FAILURE', 422, false, `catalog audit shows role '${role.role}' can directly write financial tables`));
    }
    grants.push({ role: role.role, financialTableDirectWriteDenied: true });
  }

  // ---- post-install invariants (structure only; no data movement) ----
  const inv = await deps.checkInvariants();
  if (inv.failed.length > 0) {
    return err(problem('MIGRATION_INVARIANT_FAILURE', 422, false, `invariant failures: ${inv.failed.join(', ').slice(0, 400)}`));
  }

  ctx.trace('migrate_core_validated', { ddl: ordered.length, roles: grants.length, deniedMoneyRows: deniedRows.length });
  return ok({
    freshInstall: {
      appliedSequences: ordered.map((f) => f.sequence),
      ddlChecksumVerified: true,
      invariantChecksPassed: inv.passed,
    },
    grants,
    sandboxMoney: {
      deniedRows,
      reason: 'read-only inventory only; sandbox balances excluded per 05-data-ledger.md §E7 — never imported as live cash',
    },
    targetSchemaDigest: await deps.schemaDigest(),
  });
}
