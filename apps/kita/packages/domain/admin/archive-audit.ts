/**
 * @kita/domain — archive-audit (T-ADM-11).
 *
 * Pure fail-closed checker. Never claims concurrent hash anchors verified.
 * Archive unavailable or chain mismatch is SECURITY_FAILURE. Never ok:true.
 */

import type { Adm01CommandContext, Adm11Input, Adm11Output } from '../../contracts/src/admin.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const ARCHIVE_AUDIT_SECURITY_DETAIL =
  'T-ADM-11 independent archive unavailable or hash chain mismatch; anchors are not verified';

export const ARCHIVE_AUDIT_UNAVAILABLE_DETAIL =
  'T-ADM-11 archiveAudit cannot verify anchors: independent WORM archive/T-PLAT-03 is not implemented (fail closed)';

export async function archiveAudit(
  ctx: Adm01CommandContext,
  input: Adm11Input,
): Promise<Result<Adm11Output, Problem>> {
  ctx.trace('archive_audit_fail_closed', {
    archiveUnavailable: input.archiveUnavailable,
    chainMismatch: input.chainMismatch,
  });
  if (input.archiveUnavailable || input.chainMismatch) {
    return err(problem('SECURITY_FAILURE', 409, false, ARCHIVE_AUDIT_SECURITY_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, ARCHIVE_AUDIT_UNAVAILABLE_DETAIL));
}
