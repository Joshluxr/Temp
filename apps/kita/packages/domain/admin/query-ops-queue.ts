/**
 * @kita/domain — query-ops-queue (T-ADM-02).
 *
 * Pure fail-closed checker. Unauthorized staff get 403. Live queue is not
 * implemented. Never ok:true. Never invent transfer rows or mutation rights.
 */

import type { Adm01CommandContext, Adm02Input, Adm02Output } from '../../contracts/src/admin.ts';
import type { Problem, Result } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const QUERY_OPS_QUEUE_UNAUTHORIZED_DETAIL =
  'T-ADM-02 ops queue requires authorized staff';

export const QUERY_OPS_QUEUE_UNAVAILABLE_DETAIL =
  'T-ADM-02 queryOpsQueue cannot list transfers: live ops queue/T-TX-02 is not implemented (fail closed)';

export async function queryOpsQueue(
  ctx: Adm01CommandContext,
  input: Adm02Input,
): Promise<Result<Adm02Output, Problem>> {
  ctx.trace('query_ops_queue_fail_closed', {
    staffAuthorized: input.staffAuthorized,
  });
  if (!input.staffAuthorized) {
    return err(problem('unauthorized', 403, false, QUERY_OPS_QUEUE_UNAUTHORIZED_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, QUERY_OPS_QUEUE_UNAVAILABLE_DETAIL));
}
